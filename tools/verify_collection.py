#!/usr/bin/env python3
"""Synthetic tests for the private collection importer. Does not touch Google Sheets."""
import copy,csv,importlib.util,json,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('collector',ROOT/'tools/collect_studio_sheets.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
contract=json.loads((ROOT/'data-model/collection/contract.json').read_text());catalog=json.loads((ROOT/'data-model/collection/sources.json').read_text())
data={t['key']:[] for t in contract['tables']}
def row(table,**values):
    t=next(t for t in contract['tables'] if t['key']==table);r={f['key']:None for f in t['fields']};r.update(values);data[table].append(r);return r
row('locations',location_id='LOC-000001',name='Synthetic location',status='Active')
row('team',staff_id='STF-000001',display_name='Synthetic trainer',role='Trainer',location_id='LOC-000001',status='Active')
row('plans',plan_id='PLN-000001',name='Synthetic plan',status='Active')
row('customers',customer_id='CLI-000001',display_name='Synthetic client',location_id='LOC-000001',enquiry_date='2026-11-03',stage='Active')
row('sessions',session_id='CLS-000001',local_date='2026-11-03',start_time='09:00',location_id='LOC-000001',staff_id='STF-000001',class_name='Synthetic class',capacity=1,status='Completed')
row('memberships',membership_id='MEM-000001',customer_id='CLI-000001',plan_id='PLN-000001',location_id='LOC-000001',start_date='2026-11-03',status='Active')
row('attendance',visit_id='ATT-000001',session_id='CLS-000001',customer_id='CLI-000001',membership_id='MEM-000001',status='Attended')
row('payments',payment_id='PAY-000001',local_date='2026-11-03',customer_id='CLI-000001',location_id='LOC-000001',amount_npr='1234.50',kind='Receipt',method='Cash',membership_id='MEM-000001',source_reference='SYNTHETIC')
def fails(fn):
    try:fn()
    except ValueError:return
    raise AssertionError('Expected a validation failure')
m.validate(contract,data)
assert m.normalize('NPR 1,234.50',{'type':'money'})=='1234.50'
assert m.normalize('0',{'type':'money'})=='0.00'
assert m.normalize('',{'type':'money'}) is None
fails(lambda:m.normalize('2026-02-30',{'type':'date'}))
fails(lambda:m.normalize('1.005',{'type':'money'}))
broken=copy.deepcopy(data);broken['attendance'][0]['customer_id']='CLI-999999';fails(lambda:m.validate(contract,broken))
broken=copy.deepcopy(data);broken['customers'].append(broken['customers'][0]);fails(lambda:m.validate(contract,broken))
broken=copy.deepcopy(data);broken['attendance'].append(dict(broken['attendance'][0],visit_id='ATT-000002'));fails(lambda:m.validate(contract,broken))
broken=copy.deepcopy(data);broken['sessions'][0]['status']='Cancelled';fails(lambda:m.validate(contract,broken))
raw={}
for t in contract['tables']:
    header=[f['label'] for f in t['fields']]+['Check']
    raw[t['key']]=[header]+[[r[f['key']] for f in t['fields']]+[''] for r in data[t['key']]]
    raw[t['key']].append([t['prefix']+'-000099']+['']*len(t['fields']))
parsed=m.prepare(contract,raw)
assert sum(map(len,parsed.values()))==8
with tempfile.TemporaryDirectory() as td:
    assert m.save(contract,catalog,parsed,td)==8
    assert m.save(contract,catalog,parsed,td)==0
    changed=copy.deepcopy(parsed);changed['payments'][0]['amount_npr']='1234.55'
    assert m.save(contract,catalog,changed,td)==1
    assert m.save(contract,catalog,parsed,td)==1  # Returning to a previous value is still a new observation.
    missing=copy.deepcopy(parsed);missing['attendance']=[]
    fails(lambda:m.save(contract,catalog,missing,td))
    assert len((Path(td)/'observations.jsonl').read_text().splitlines())==10
    assert (Path(td)/'current.sql').exists()
print('PASS: joins, duplicate and missing IDs, blank slots, dates, paisa, attendance guards, repeat imports and append-only observations.')

