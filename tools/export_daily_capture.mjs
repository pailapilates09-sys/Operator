#!/usr/bin/env node
// Paila private daily capture exporter. Requires Node 20+. Never publish output.
import {createHash, createSign} from 'node:crypto';
import {mkdir, readFile, writeFile, rename} from 'node:fs/promises';
import {resolve, dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const SHEET_ID='13um0MJkeGd3k_pRDQMu3L0FXJp1BErI8KpY7K8V9kZg';
const TABLES={
  daily_close:{tab:'Daily Close',key:'day_id',columns:'day_id local_date location_id lead_enquiries responses_same_day trials_booked trials_attended first_visits memberships_started renewals_due renewals_completed memberships_ended unresolved_followups incidents_count equipment_holds_count opening_done cleaning_done closing_done source_reference entered_by_id manager_review coverage_status'.split(' ')},
  class_sessions:{tab:'Class Sessions',key:'session_id',columns:'session_id local_date location_id class_type_id instructor_id status capacity booked_at_start attended_booked walk_ins no_shows cancelled_pre_cutoff waitlist_end source_reference row_check'.split(' ')},
  finance_daily:{tab:'Finance Daily',key:'day_id',columns:'day_id local_date location_id gross_sales_npr discounts_npr refunds_npr cash_receipts_npr digital_receipts_npr other_receipts_npr paid_expenses_npr opening_cash_npr counted_closing_cash_npr expected_closing_cash_npr cash_difference_npr source_reference entered_by_id manager_review coverage_status'.split(' ')}
};
const COUNTS=new Set('lead_enquiries responses_same_day trials_booked trials_attended first_visits memberships_started renewals_due renewals_completed memberships_ended unresolved_followups incidents_count equipment_holds_count capacity booked_at_start attended_booked walk_ins no_shows cancelled_pre_cutoff waitlist_end'.split(' '));
const AMOUNTS=new Set('gross_sales_npr discounts_npr refunds_npr cash_receipts_npr digital_receipts_npr other_receipts_npr paid_expenses_npr opening_cash_npr counted_closing_cash_npr expected_closing_cash_npr cash_difference_npr'.split(' '));
const BOOLS=new Set('opening_done cleaning_done closing_done'.split(' '));
const sha=s=>createHash('sha256').update(s).digest('hex');
const stable=obj=>JSON.stringify(obj);
function fail(message){throw new Error(message)}
function args(){
  const out={};
  for(let i=2;i<process.argv.length;i+=2){const key=process.argv[i];if(!['--out','--source-dir','--sheet-id'].includes(key)||!process.argv[i+1])fail('Usage: node export_daily_capture.mjs --out PRIVATE_DIR [--source-dir CSV_DIR | --sheet-id ID]');out[key.slice(2)]=process.argv[i+1]}
  if(!out.out||Boolean(out['source-dir'])===Boolean(out['sheet-id'])) fail('Specify --out and exactly one of --source-dir or --sheet-id');
  return out;
}
async function token(){
  if(process.env.GOOGLE_SHEETS_ACCESS_TOKEN)return process.env.GOOGLE_SHEETS_ACCESS_TOKEN;
  if(!process.env.GOOGLE_SERVICE_ACCOUNT_JSON)fail('Set GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SHEETS_ACCESS_TOKEN in the private runner');
  const sa=JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  if(!sa.client_email||!sa.private_key||!sa.token_uri)fail('Incomplete service account');
  const now=Math.floor(Date.now()/1000), b64=o=>Buffer.from(JSON.stringify(o)).toString('base64url');
  const input=b64({alg:'RS256',typ:'JWT'})+'.'+b64({iss:sa.client_email,scope:'https://www.googleapis.com/auth/spreadsheets.readonly',aud:sa.token_uri,iat:now,exp:now+3600});
  const signer=createSign('RSA-SHA256');signer.update(input);signer.end();
  const assertion=input+'.'+signer.sign(sa.private_key).toString('base64url');
  const res=await fetch(sa.token_uri,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion})});
  if(!res.ok)fail(`Google token request failed: ${res.status}`);
  const data=await res.json();return data.access_token;
}
async function fromSheet(id,tab,bearer){
  const range=`'${tab}'!A4:V10000`;
  const url=`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}/values/${encodeURIComponent(range)}?valueRenderOption=UNFORMATTED_VALUE`;
  const res=await fetch(url,{headers:{authorization:`Bearer ${bearer}`}});
  if(!res.ok)fail(`Sheet ${tab} read failed: ${res.status}`);
  return (await res.json()).values||[];
}
function parseCsv(text){
  let rows=[],row=[],field='',quoted=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(quoted){if(c==='"'&&text[i+1]==='"'){field+='"';i++}else if(c==='"')quoted=false;else field+=c}
    else if(c==='"'){if(field)fail('Invalid CSV quote');quoted=true}
    else if(c===','){row.push(field);field=''}
    else if(c==='\n'){row.push(field);rows.push(row);row=[];field=''}
    else if(c!=='\r')field+=c;
  }
  if(quoted)fail('Unclosed CSV quote');
  if(field||row.length){row.push(field);rows.push(row)}
  return rows;
}
const csvCell=x=>{const s=x==null?'':String(x);return /[,"\r\n]/.test(s)?'"'+s.replaceAll('"','""')+'"':s};
function convert(c,v,where){
  if(v===''||v===null||v===undefined)return null;
  if(COUNTS.has(c)||AMOUNTS.has(c)){
    const raw=String(v).trim(),n=Number(raw);
    if(!Number.isFinite(n)||!Number.isSafeInteger(Math.round(n*100))||
      COUNTS.has(c)&&(!Number.isSafeInteger(n)||n<0)||
      AMOUNTS.has(c)&&(!/^-?\d+(?:\.\d{1,2})?$/.test(raw)||c!=='cash_difference_npr'&&n<0))
      fail(`${where}: invalid number ${c}`);
    return n;
  }
  if(BOOLS.has(c)){
    if(v===true||v==='TRUE'||v==='true')return true;
    if(v===false||v==='FALSE'||v==='false')return false;
    fail(`${where}: invalid boolean ${c}`);
  }
  return String(v).trim();
}
function normalize(table,rows){
  const cfg=TABLES[table],head=rows[0]||[];
  if(stable(head)!==stable(cfg.columns))fail(`${cfg.tab}: row 4 header changed; export aborted`);
  const seen=new Set(),out=[];
  for(let i=1;i<rows.length;i++){
    const values=rows[i]||[];if(values.every(v=>v===''||v===null||v===undefined))continue;
    if(values.slice(cfg.columns.length).some(v=>v!==''&&v!==null&&v!==undefined))fail(`${cfg.tab} row ${i+4}: unexpected extra column`);
    const obj=Object.fromEntries(cfg.columns.map((c,j)=>[c,convert(c,values[j],`${cfg.tab} row ${i+4}`)]));
    const id=obj[cfg.key];if(!id||!obj.location_id||!obj.local_date)fail(`${cfg.tab} row ${i+4}: missing key/date/location`);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(obj.local_date)||Number.isNaN(Date.parse(obj.local_date+'T00:00:00Z')))fail(`${cfg.tab} row ${i+4}: invalid date`);
    if(table!=='class_sessions'&&id!==`${obj.location_id}|${obj.local_date}`)fail(`${cfg.tab} row ${i+4}: day_id must be location_id|local_date`);
    if(seen.has(id))fail(`${cfg.tab}: duplicate ${cfg.key} ${id}`);seen.add(id);out.push(obj);
  }
  return out.sort((a,b)=>String(a[cfg.key]).localeCompare(String(b[cfg.key])));
}
const sqlQuote=s=>"'"+String(s).replaceAll("'","''")+"'";
function sqlValue(x){return x===null?'NULL':typeof x==='boolean'?(x?'TRUE':'FALSE'):typeof x==='number'?String(x):sqlQuote(x)}
function sql(rowsByTable){
  let lines=['-- Private Paila aggregate snapshot. PostgreSQL 14+. Do not publish operational rows.','BEGIN;'];
  for(const [table,cfg] of Object.entries(TABLES)){
    const cols=cfg.columns.map(c=>`  "${c}" ${COUNTS.has(c)?'BIGINT':AMOUNTS.has(c)?'NUMERIC(18,2)':BOOLS.has(c)?'BOOLEAN':c==='local_date'?'DATE':'TEXT'}${c===cfg.key?' PRIMARY KEY':''}`).join(',\n');
    lines.push(`CREATE TABLE IF NOT EXISTS "${table}" (\n${cols}\n);`);
    lines.push(`DELETE FROM "${table}"; -- full current snapshot; history remains in observations.jsonl`);
    for(const row of rowsByTable[table])lines.push(`INSERT INTO "${table}" (${cfg.columns.map(c=>'"'+c+'"').join(', ')}) VALUES (${cfg.columns.map(c=>sqlValue(row[c])).join(', ')}) ON CONFLICT ("${cfg.key}") DO UPDATE SET ${cfg.columns.filter(c=>c!==cfg.key).map(c=>`"${c}"=EXCLUDED."${c}"`).join(', ')};`);
    // A removed sheet row is not proof that the underlying business event was deleted.
  }
  return lines.concat('COMMIT;','').join('\n');
}
async function atomic(path,content){const temp=path+'.tmp-'+process.pid;await writeFile(temp,content,{mode:0o600});await rename(temp,path)}
async function main(){
  const opts=args(),out=resolve(opts.out),repo=resolve(dirname(fileURLToPath(import.meta.url)),'..');
  if(out===repo||out.startsWith(repo+'/'))fail('Output must be outside the public repository');
  await mkdir(out,{recursive:true,mode:0o700});
  const sheetId=opts['sheet-id'];if(sheetId&&sheetId!==SHEET_ID)fail('Unexpected source Sheet ID');
  const bearer=sheetId?await token():null,rowsByTable={};
  for(const [table,cfg] of Object.entries(TABLES)){
    const rows=sheetId?await fromSheet(sheetId,cfg.tab,bearer):parseCsv(await readFile(join(resolve(opts['source-dir']),table+'.csv'),'utf8'));
    rowsByTable[table]=normalize(table,rows);
  }
  const previousPath=join(out,'state.json');let previous={};
  try{previous=JSON.parse(await readFile(previousPath,'utf8'))}catch(e){if(e.code!=='ENOENT')throw e}
  const next={},observed=[],now=new Date().toISOString();
  for(const [table,cfg] of Object.entries(TABLES)){
    next[table]={};
    for(const row of rowsByTable[table]){
      const key=row[cfg.key],digest=sha(stable(row));next[table][key]=digest;
      if(previous[table]?.[key]!==digest)observed.push({observation_id:sha(`${table}|${key}|${digest}`),observation_type:previous[table]?.[key]?'capture.row_changed':'capture.row_first_seen',observed_at:now,source_sheet_id:SHEET_ID,table,key,row_sha256:digest,record:row});
    }
    const missing=Object.keys(previous[table]||{}).filter(key=>!(key in next[table]));
    if(missing.length)fail(`${table}: ${missing.length} prior key(s) missing; investigate source corrections before exporting`);
  }
  // Write snapshots and event log before advancing state. Re-run uses observation_id for downstream dedupe.
  for(const [table,cfg] of Object.entries(TABLES)){
    const records=rowsByTable[table],columns=cfg.columns;
    await atomic(join(out,table+'.csv'),[columns.join(','),...records.map(row=>columns.map(c=>csvCell(row[c])).join(',')),''].join('\n'));
    await atomic(join(out,table+'.json'),JSON.stringify({schema_version:'1.0.0',source_sheet_id:SHEET_ID,table,record_count:records.length,records},null,2)+'\n');
  }
  await atomic(join(out,'daily_capture_postgres.sql'),sql(rowsByTable));
  if(observed.length){
    let history='';try{history=await readFile(join(out,'observations.jsonl'),'utf8')}catch(e){if(e.code!=='ENOENT')throw e}
    const ids=new Set(history.split('\n').filter(Boolean).map(line=>JSON.parse(line).observation_id));
    await atomic(join(out,'observations.jsonl'),history+observed.filter(x=>!ids.has(x.observation_id)).map(x=>JSON.stringify(x)+'\n').join(''));
  }
  await atomic(previousPath,JSON.stringify(next,null,2)+'\n');
  console.log(JSON.stringify({status:'VERIFIED_LOCAL_EXPORT',counts:Object.fromEntries(Object.entries(rowsByTable).map(([k,v])=>[k,v.length])),new_observations:observed.length,output:out}));
}
main().catch(e=>{console.error(e.message);process.exitCode=1});
