/** Fictional review model only. These are not the private production event contracts. */
export const classification='FICTIONAL / PROTOTYPE / NOT APPROVED';
export const stages=['Lead','First visit','Second purchase','Active member','Exited'];
const dayMs=86400000;
export const daysBetween=(a,b)=>Math.round((Date.parse(b+'T00:00:00Z')-Date.parse(a+'T00:00:00Z'))/dayMs);
export const money=n=>'NPR '+Math.round(n).toLocaleString('en-US');
export const ratio=(n,d)=>d?Math.round(n/d*100)+'%':'n/a';
export function cleanState(seed,value={}) {
 const v=value&&typeof value==='object'?value:{};
 const known=(items,ids)=>Array.isArray(ids)?[...new Set(ids.filter(id=>items.some(x=>x.id===id)))]:[];
 const bookingStates={};
 for(const [id,status] of Object.entries(v.bookingStates||{})) {
  const b=seed.bookings.find(x=>x.id===id),s=seed.sessions.find(x=>x.id===b?.sessionId);
  if(b&&s.state!=='Completed'&&['Booked','Checked in','No-show','Cancelled'].includes(status))bookingStates[id]=status;
 }
 // Revalidate occupied seats on restore. Session storage cannot bypass capacity/holds.
 for(const session of seed.sessions) {
  const bs=seed.bookings.filter(b=>b.sessionId===session.id);
  const active=b=>['Booked','Checked in','Attended'].includes(bookingStates[b.id]||b.status);
  let occupied=bs.filter(active).length;
  for(const b of bs.filter(b=>b.status==='Waitlisted'&&active(b))) {
   if(occupied<=session.capacity-session.held)break;
   delete bookingStates[b.id];occupied--;
  }
 }
 return {completed:known(seed.actions,v.completed),checks:known(seed.checks.filter(x=>!x.state.startsWith('Blocked')),v.checks),bookingStates,lapseDays:Number.isInteger(v.lapseDays)&&v.lapseDays>=7&&v.lapseDays<=45?v.lapseDays:14,mode:v.mode==='Pre-opening planning'?'Pre-opening planning':'Operating review',log:Array.isArray(v.log)?v.log.filter(x=>typeof x==='string'&&/^DEMO-[A-Z0-9]+: (Reviewed|Checked in|No-show|Cancelled|Promoted|Reset)$/.test(x)).slice(-25):[]};
}
export function project(seed,state={}) {
 state=cleanState(seed,state);
 const rows=seed.people.map(person=>{
  const events=seed.events.filter(e=>e.personId===person.id&&e.date<=seed.asOf);
  const visits=events.filter(e=>e.type==='visit');
  const purchases=events.filter(e=>e.type==='purchase');
  const purchase=purchases.at(-1),exit=events.filter(e=>e.type==='cancel').at(-1);
  const active=!!purchase&&(!exit||exit.date<purchase.date);
  const last=visits.at(-1)?.date,first=visits[0]?.date;
  const used=purchase?visits.filter(e=>e.date>=purchase.date).length:0;
  const credits=purchase?Math.max(0,purchase.credits-used):person.introCredits?Math.max(0,person.introCredits-visits.length):0;
  const gap=last?daysBetween(last,seed.asOf):null;
  const friction=events.filter(e=>e.type==='friction');
  const reasons=[];
  if(active&&gap>=state.lapseDays)reasons.push(gap+' days since last completed visit');
  if(active&&credits>=6&&gap>=7)reasons.push(credits+' credits unused with a participation gap');
  if(!exit&&friction.length)reasons.push(...friction.map(e=>'Service friction: '+e.reason));
  const stage=exit&&!active?'Exited':active?'Active member':purchase?'Second purchase':first?'First visit':'Lead';
  return {...person,events,visits,purchases,firstVisit:first,lastVisit:last,active,stage,credits,gap,reasons,freeze:events.some(e=>e.type==='freeze_request'),cancellation:exit};
 });
 const bookings=seed.bookings.map(b=>({...b,status:state.bookingStates[b.id]||b.status}));
 const sessions=seed.sessions.map(s=>{
  const bs=bookings.filter(b=>b.sessionId===s.id),occupied=bs.filter(b=>['Booked','Checked in','Attended'].includes(b.status)).length;
  return {...s,bookings:bs,availableCapacity:s.capacity-s.held,occupied,spaces:Math.max(0,s.capacity-s.held-occupied),waitlisted:bs.filter(b=>b.status==='Waitlisted').length};
 });
 return {state,rows,bookings,sessions,risks:rows.filter(r=>r.reasons.length),funnel:{leads:rows.length,firstVisits:rows.filter(r=>r.firstVisit).length,secondPurchases:rows.filter(r=>r.purchases.length).length,active:rows.filter(r=>r.active).length,exits:rows.filter(r=>r.cancellation).length}};
}
export function transitionBooking(seed,state,id,status) {
 const p=project(seed,state),b=p.bookings.find(x=>x.id===id),s=p.sessions.find(x=>x.id===b?.sessionId);
 if(!b||!s||s.state==='Completed')return {ok:false,message:'Completed session evidence cannot be rewritten in the demo.',state:p.state};
 const allowed=b.status==='Waitlisted'?['Booked']:b.status==='Booked'?['Checked in','No-show','Cancelled']:[];
 if(!allowed.includes(status))return {ok:false,message:'This transition is not available from the current demo state.',state:p.state};
 if(status==='Booked'&&s.spaces<1)return {ok:false,message:'No available place. A maintenance hold never becomes bookable through this demo.',state:p.state};
 const next={...p.state,bookingStates:{...p.state.bookingStates,[id]:status},log:[...p.state.log,id+': '+(status==='Booked'?'Promoted':status)].slice(-25)};
 return {ok:true,message:'Fictional demo updated. '+(status==='Checked in'?'Check-in is arrival, not a completed visit.':'No real booking, contact or payment changed.'),state:next};
}
export function report(seed,period='Weekly') {
 const count=period==='Daily'?1:period==='Weekly'?7:30;
 const end=seed.asOf,start=new Date(Date.parse(end+'T00:00:00Z')-(count-1)*dayMs).toISOString().slice(0,10);
 const events=seed.events.filter(e=>e.date>=start&&e.date<=end);
 const leads=events.filter(e=>e.type==='lead');
 const cohort=new Set(leads.map(e=>e.personId));
 const p=project(seed),visited=p.rows.filter(r=>cohort.has(r.id)&&r.firstVisit),bought=p.rows.filter(r=>cohort.has(r.id)&&r.purchases.length);
 const cancels=events.filter(e=>e.type==='cancel');
 const starting=seed.people.filter(person=>{
  const es=seed.events.filter(e=>e.personId===person.id&&e.date<start);
  const purchase=es.filter(e=>e.type==='purchase').at(-1),cancel=es.filter(e=>e.type==='cancel').at(-1);
  return purchase&&(!cancel||cancel.date<purchase.date);
 }).length;
 return {start,end,count,events,leads:leads.length,firstVisits:events.filter(e=>e.type==='visit'&&e.first).length,visits:events.filter(e=>e.type==='visit').length,purchases:events.filter(e=>e.type==='purchase').length,cash:events.filter(e=>e.type==='purchase').reduce((n,e)=>n+e.amount,0),exits:cancels.length,startingMembers:starting,churn:starting?ratio(cancels.filter(e=>seed.events.some(x=>x.personId===e.personId&&x.type==='purchase'&&x.date<start)).length,starting):'n/a',firstConversion:ratio(visited.length,leads.length),secondConversion:ratio(bought.length,visited.length),cohortFirst:visited.length,cohortSecond:bought.length};
}
export function scenario({fixed=45000,price=11500,variable=15,members=6}={}) {
 if(![fixed,price,variable,members].every(Number.isFinite)||fixed<0||price<=0||variable<0||variable>=100||members<0)throw new Error('Invalid fictional scenario assumptions');
 const contribution=price*(1-variable/100);
 return {contribution,breakEven:Math.ceil(fixed/contribution),modelRevenue:price*members,modelCost:fixed+price*members*variable/100,modelSurplus:contribution*members-fixed};
}
