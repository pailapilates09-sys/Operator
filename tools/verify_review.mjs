/** Minimum nonvisual checks for the fictional review model. Run: node tools/verify_review.mjs */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {project,transitionBooking,report,scenario,cleanState} from '../data-model/prototype-engine.js';
const seed=JSON.parse(fs.readFileSync(new URL('../data-model/review-seed.json',import.meta.url)));
assert.equal(seed.classification,'FICTIONAL / PROTOTYPE / NOT APPROVED');
const people=new Set(seed.people.map(x=>x.id));
assert.equal(people.size,seed.people.length);
assert.ok(seed.people.every(p=>/^DEMO-C\d+$/.test(p.id)&&/^Fictional client \d+$/.test(p.name)));
for(const e of seed.events)assert.ok(people.has(e.personId));
assert.equal(new Set(seed.events.map(e=>e.id)).size,seed.events.length);
for(const b of seed.bookings){assert.ok(people.has(b.personId));assert.ok(seed.sessions.some(s=>s.id===b.sessionId));}
for(const row of project(seed).rows){assert.ok(row.purchases.every(e=>row.firstVisit&&e.date>row.firstVisit));assert.ok(row.credits>=0);}
const p=project(seed);
assert.deepEqual(p.funnel,{leads:14,firstVisits:10,secondPurchases:7,active:6,exits:1});
assert.equal(p.sessions.reduce((n,s)=>n+s.availableCapacity,0),24);
assert.equal(p.sessions.reduce((n,s)=>n+s.occupied,0),20);
assert.equal(transitionBooking(seed,{},'DEMO-B21','Booked').ok,false);
assert.equal(transitionBooking(seed,{},'DEMO-B22','Booked').ok,false); // Maintenance hold is excluded.
const cancellation=transitionBooking(seed,{},'DEMO-B12','Cancelled');
assert.ok(cancellation.ok);
const promotion=transitionBooking(seed,cancellation.state,'DEMO-B21','Booked');
assert.ok(promotion.ok);
assert.equal(project(seed,promotion.state).sessions[2].occupied,8);
assert.equal(transitionBooking(seed,{},'DEMO-B01','No-show').ok,false);
assert.deepEqual(cleanState(seed,{bookingStates:{'DEMO-B21':'Booked','DEMO-B22':'Booked','REAL-ID':'Booked'},checks:['DEMO-O02','REAL-ID'],completed:['REAL-ID']}).bookingStates,{});
assert.equal(cleanState(seed,{checks:['DEMO-O02']}).checks.length,0);
assert.equal(report(seed,'Monthly').cash,80500);
assert.equal(report(seed,'Daily').visits,4);
assert.equal(report(seed,'Monthly').firstConversion,'71%');
assert.equal(report(seed,'Monthly').secondConversion,'70%');
assert.equal(report(seed,'Daily').firstConversion,'n/a');
assert.equal(scenario().breakEven,5);
assert.throws(()=>scenario({price:0}));
console.log('PASS: synthetic references; lifecycle and cash reconciliation; capacity/hold guards; completed history; allowlisted demo state; scenario arithmetic.');
