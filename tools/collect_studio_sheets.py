#!/usr/bin/env python3
"""Read the staff Sheets or CSV exports into a validated private snapshot. Standard library only."""
import argparse,csv,datetime as dt,decimal,hashlib,json,os,re,tempfile,uuid
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request,urlopen
ROOT=Path(__file__).resolve().parents[1]
CONTRACT=ROOT/'data-model/collection/contract.json'
SOURCES=ROOT/'data-model/collection/sources.json'
D=decimal.Decimal
def text(v):return '' if v is None else str(v).strip()
def normalize(v,f):
    if v is None or v=='':return None
    kind=f['type'];value=text(v)
    if kind=='date':
        if isinstance(v,(int,float)) and not isinstance(v,bool):
            if float(v)%1:raise ValueError('Date must not include a time')
            return (dt.date(1899,12,30)+dt.timedelta(days=int(v))).isoformat()
        if not re.fullmatch(r'\d{4}-\d{2}-\d{2}',value):raise ValueError('Use YYYY-MM-DD')
        return dt.date.fromisoformat(value).isoformat()
    if kind=='time':
        if not re.fullmatch(r'(?:[01]\d|2[0-3]):[0-5]\d',value):raise ValueError('Use 24-hour HH:MM')
        return value
    if kind in ('money','integer'):
        if isinstance(v,bool):raise ValueError('Enter a number')
        if kind=='money':
            value=re.sub(r'^NPR\s*','',value)
            if ',' in value:
                if not re.fullmatch(r'\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?',value):raise ValueError('Invalid amount grouping')
                value=value.replace(',','')
        n=D(value)
        if not n.is_finite() or n<0:raise ValueError('Enter a non-negative number')
        if kind=='integer':
            if n!=n.to_integral_value():raise ValueError('Enter a whole number')
            return int(n)
        if n!=n.quantize(D('.01')):raise ValueError('Use at most two decimal places')
        return str(n.quantize(D('.01')))
    if kind=='choice' and value not in f['options']:raise ValueError('Choose an allowed value')
    return value or None
def read_sources(contract,catalog,csv_dir=None):
    raw={}
    if csv_dir:
        for table in contract['tables']:
            with (Path(csv_dir)/(table['key']+'.csv')).open(newline='',encoding='utf-8-sig') as f:raw[table['key']]=list(csv.reader(f))
    else:
        token=os.environ.get('GOOGLE_SHEETS_ACCESS_TOKEN')
        if not token:raise ValueError('Missing GOOGLE_SHEETS_ACCESS_TOKEN in the private runner')
        for source in catalog['sources']:
            params=[('ranges',t['range']) for t in source['tables']]+[('valueRenderOption','UNFORMATTED_VALUE'),('dateTimeRenderOption','SERIAL_NUMBER')]
            url='https://sheets.googleapis.com/v4/spreadsheets/'+source['spreadsheet_id']+'/values:batchGet?'+urlencode(params)
            request=Request(url,headers={'Authorization':'Bearer '+token})
            with urlopen(request,timeout=45) as response:payload=json.load(response)
            ranges=payload.get('valueRanges',[])
            if len(ranges)!=len(source['tables']):raise ValueError('Source range count mismatch')
            for table,values in zip(source['tables'],ranges):raw[table['key']]=values.get('values',[])
    return raw
def prepare(contract,raw):
    result={}
    for t in contract['tables']:
        fields=t['fields'];expected=[f['label'] for f in fields];rows=raw[t['key']]
        header_index=next((i for i,row in enumerate(rows[:4]) if row[:len(expected)]==expected),None)
        if header_index is None:raise ValueError(t['key']+': headers do not match the source contract')
        if any(text(v) for v in rows[header_index][len(expected)+1:]):raise ValueError(t['key']+': unexpected extra headers')
        records=[]
        for pos,row in enumerate(rows[header_index+1:],header_index+2):
            padded=list(row)+[None]*max(0,len(fields)-len(row))
            if not any(v is not None and v!='' for v in padded[1:len(fields)]):continue
            try:
                record={f['key']:normalize(padded[i],f) for i,f in enumerate(fields)}
                for f in fields:
                    if f['required'] and record[f['key']] is None:raise ValueError('Missing '+f['label'])
                if not re.fullmatch(re.escape(t['prefix'])+r'-\d{6,}',record[fields[0]['key']]):raise ValueError('Use the issued ID')
                records.append(record)
            except (ValueError,decimal.InvalidOperation,OverflowError) as e:raise ValueError(t['key']+' row '+str(pos)+': '+str(e)) from None
        result[t['key']]=records
    validate(contract,result)
    return result
def validate(contract,data):
    indexes={}
    for t in contract['tables']:
        pk=t['fields'][0]['key'];values=[r[pk] for r in data[t['key']]]
        if len(values)!=len(set(values)):raise ValueError(t['key']+': duplicate primary ID')
        indexes[t['key']]={r[pk]:r for r in data[t['key']]}
        for columns in t.get('unique',[]):
            combos=[tuple(r[k] for k in columns) for r in data[t['key']]]
            if len(combos)!=len(set(combos)):raise ValueError(t['key']+': duplicate '+', '.join(columns))
    for t in contract['tables']:
        for r in data[t['key']]:
            for f in t['fields']:
                value=r[f['key']]
                if f.get('references') and value is not None:
                    target,_=f['references'].split('.')
                    if value not in indexes[target]:raise ValueError(t['key']+': unknown '+f['label'])
    for r in data['sessions']:
        if r['status']!='Cancelled' and r['capacity']<1:raise ValueError('A scheduled or completed class needs at least one place')
    for r in data['memberships']:
        if r['end_date'] and r['end_date']<r['start_date']:raise ValueError('Membership end precedes start')
    for r in data['attendance']:
        session=indexes['sessions'][r['session_id']]
        if r['status'] in ('Attended','Checked in') and session['status']=='Cancelled':raise ValueError('Attendance belongs to a cancelled class')
        if r['membership_id'] and indexes['memberships'][r['membership_id']]['customer_id']!=r['customer_id']:raise ValueError('Attendance membership belongs to another client')
    for session_id,session in indexes['sessions'].items():
        occupied=sum(r['session_id']==session_id and r['status'] in ('Booked','Checked in','Attended') for r in data['attendance'])
        if occupied>session['capacity']:raise ValueError('Class attendance exceeds its places')
    refunded={}
    for r in data['payments']:
        if r['membership_id'] and indexes['memberships'][r['membership_id']]['customer_id']!=r['customer_id']:raise ValueError('Payment membership belongs to another client')
        if r['kind']=='Refund':
            original=indexes['payments'].get(r['refund_of_payment_id'])
            if not original or original['kind']!='Receipt' or original['customer_id']!=r['customer_id'] or original['location_id']!=r['location_id']:raise ValueError('Refund needs its matching original receipt')
            if r['local_date']<original['local_date']:raise ValueError('Refund date precedes receipt')
            refunded[original['payment_id']]=refunded.get(original['payment_id'],D(0))+D(r['amount_npr'])
        elif r['refund_of_payment_id'] is not None:raise ValueError('A receipt cannot point to an original refund payment')
    for payment_id,amount in refunded.items():
        if amount>D(indexes['payments'][payment_id]['amount_npr']):raise ValueError('Refund total exceeds original receipt')
    for r in data['followups']:
        if r['status']=='Done' and not r['completed_date']:raise ValueError('Completed follow-up needs its completion date')
    for r in data['equipment']:
        if r['last_check_date'] and r['next_check_date'] and r['next_check_date']<r['last_check_date']:raise ValueError('Next equipment check precedes last check')
def quote(v):return 'NULL' if v is None else "'"+str(v).replace("'","''")+"'"
def atomic(path,value):
    temp=path.with_suffix(path.suffix+'.tmp');temp.write_text(value,encoding='utf-8');os.chmod(temp,0o600);temp.replace(path)
def save(contract,catalog,data,out):
    out=Path(out).resolve()
    if out.is_relative_to(ROOT):raise ValueError('Output must be outside the public repository')
    out.mkdir(parents=True,exist_ok=True,mode=0o700);os.chmod(out,0o700)
    lock=out/'.collect.lock'
    try:fd=os.open(lock,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600)
    except FileExistsError:raise ValueError('Another import is running, or a stale lock requires investigation')
    try:
        os.close(fd)
        latest={}
        log=out/'observations.jsonl'
        if log.exists():
            for line in log.read_text().splitlines():
                e=json.loads(line);latest[(e['table'],e['record_id'])]=e['hash']
        current={}
        observations=[]
        now=dt.datetime.now(dt.timezone.utc).isoformat()
        source_for={t['key']:s for s in catalog['sources'] for t in s['tables']}
        for t in contract['tables']:
            pk=t['fields'][0]['key']
            for r in data[t['key']]:
                key=(t['key'],r[pk]);digest=hashlib.sha256(json.dumps(r,sort_keys=True,separators=(',',':')).encode()).hexdigest();current[key]=digest
                if latest.get(key)!=digest:observations.append({'observation_id':str(uuid.uuid4()),'observed_at':now,'table':key[0],'record_id':key[1],'hash':digest,'source_sheet_id':source_for[t['key']]['spreadsheet_id'],'record':r})
        if set(latest)-set(current):raise ValueError('Prior IDs are missing. Investigate deletions or source access before exporting')
        if observations:
            with log.open('a',encoding='utf-8') as stream:
                for e in observations:stream.write(json.dumps(e,ensure_ascii=False)+'\n')
                stream.flush();os.fsync(stream.fileno())
            os.chmod(log,0o600)
        elif not log.exists():log.touch(mode=0o600)
        sql=[(ROOT/'data-model/collection/schema.sql').read_text(),'BEGIN;','SET CONSTRAINTS ALL DEFERRED;']
        for t in contract['tables']:
            key=t['key'];cols=[f['key'] for f in t['fields']];pk=cols[0]
            atomic(out/(key+'.json'),json.dumps(data[key],ensure_ascii=False,indent=2)+'\n')
            tmp=out/(key+'.csv.tmp')
            with tmp.open('w',newline='',encoding='utf-8') as stream:
                writer=csv.writer(stream);writer.writerow(cols);writer.writerows([r[c] if r[c] is not None else '' for c in cols] for r in data[key])
            os.chmod(tmp,0o600);tmp.replace(out/(key+'.csv'))
            for r in data[key]:
                sql.append('INSERT INTO paila_input.'+key+' ('+', '.join(cols)+') VALUES ('+', '.join(quote(r[c]) for c in cols)+') ON CONFLICT ('+pk+') DO UPDATE SET '+', '.join(c+'=EXCLUDED.'+c for c in cols[1:])+';')
        sql+=['COMMIT;']
        atomic(out/'current.sql','\n'.join(sql)+'\n')
        atomic(out/'current.json',json.dumps({'as_of':now,'source':'private Google Sheet read or supplied CSV exports','tables':data},ensure_ascii=False,indent=2)+'\n')
        return len(observations)
    finally:lock.unlink(missing_ok=True)
def main():
    parser=argparse.ArgumentParser(description=__doc__)
    source=parser.add_mutually_exclusive_group(required=True)
    source.add_argument('--csv-dir');source.add_argument('--live',action='store_true')
    parser.add_argument('--out',required=True);args=parser.parse_args()
    contract=json.loads(CONTRACT.read_text());catalog=json.loads(SOURCES.read_text())
    raw=read_sources(contract,catalog,args.csv_dir);data=prepare(contract,raw)
    changed=save(contract,catalog,data,args.out)
    print(json.dumps({'tables':len(data),'rows':sum(map(len,data.values())),'changed_observations':changed}))
if __name__=='__main__':
    try:main()
    except Exception as e:raise SystemExit('Import stopped: '+str(e))

