"""Bounded structural release checks; no browser or visual QA."""
import json,pathlib,subprocess
from jsonschema import Draft202012Validator,FormatChecker,ValidationError
root=pathlib.Path(__file__).resolve().parents[1]
def read(p):return json.loads((root/p).read_text())
cfg=read('data-model/console.json');dic=read('data-model/dictionary.json');ev=read('data-model/events.json');schema=read('data-model/event.schema.json')
assert cfg['version']==read('version.json')['current']=='0.6.0'
assert cfg['build']==read('version.json')['build']=='review-2026-10-03'
assert len(dic['entities'])==19 and dic['records']==[]
assert len({x['entity'] for x in dic['entities']})==19
assert len(cfg['sops'])>=30 and len({x['code'] for x in cfg['sops']})==len(cfg['sops'])
existing=read('sop/catalog.json')['procedures']
for x in existing:assert next(s for s in cfg['sops'] if s['code']==x['code'])['status']==x['status']
assert {x['category'] for x in cfg['automations']}=={'Automatable now','Automatable after data exists','Human review required','Must remain human-controlled'}
assert all(x['status']=='Inactive candidate' for x in cfg['automations'])
for period,minimum in [('Daily',14),('Weekly',9),('Monthly',12)]:
 assert len(cfg['reports'][period])>=minimum
 assert all(r['state']=='Awaiting source' for r in cfg['reports'][period])
for m in cfg['modules']:
 p=m['path'];target='index.html' if not p else p if p.endswith('.html') else p+'index.html'
 assert (root/target).exists(),target
 text=(root/target).read_text();assert f'data-module="{m["key"]}"' in text and 'v=review-2026-10-03' in text
for ent in dic['entities']:
 s=read('data-model/'+ent['schema']);Draft202012Validator.check_schema(s)
 assert set(s['required'])=={f['name'] for f in ent['fields'] if f['requirement']=='required'}
 assert all(f['authority'] and f['requirement'] in ['required','optional','derived'] and f['privacy'] in ['public-safe definition','private operational'] for f in ent['fields'])
Draft202012Validator.check_schema(schema);validator=Draft202012Validator(schema,format_checker=FormatChecker())
# Synthetic identifiers are generated in memory only, never shipped as records.
for e in ev['types']:
 event=dict(event_id='validation-only',event_type=e['type'],timestamp='2026-10-01T00:00:00+05:45',location_id='validation-only',source_system='validation-only',actor_reference='validation-only',schema_version='1.0.0',status='validation-only')
 for ref in e['required_references']:event[ref]='validation-only'
 if e['type'] in ['payment.completed','refund.completed']:event.update(value=1,metadata={'currency':'NPR'})
 validator.validate(event)
 if e['required_references']:
  broken=event.copy();del broken[e['required_references'][0]]
  assert list(validator.iter_errors(broken)),e['type']
 bad=event.copy();bad['metadata']={'private_narrative':'must be rejected'};assert list(validator.iter_errors(bad))
 bad=event.copy();bad['timestamp']='not-a-timestamp';assert list(validator.iter_errors(bad))
assert len(ev['types'])>=26 and {x['type'] for x in ev['types']}==set(schema['properties']['event_type']['enum'])
for steps in cfg['workflows'].values():
 assert all(step[2] in schema['properties']['event_type']['enum'] for step in steps)
# All original handbook / viewer files must remain byte-for-byte unchanged.
base='ade69b1073468c913e25b1a486cb417e54016adb'
changes=subprocess.check_output(['git','diff','--name-only',base],cwd=root,text=True).splitlines()
assert not any((p.startswith('studio/') or p.startswith('sop/')) and p!='sop/register.html' for p in changes),changes
print(f'PASS: {len(cfg["modules"])} module routes; 19 entity schemas; {len(ev["types"])} event contracts; report/SOP/automation coverage; preserved handbook and viewer.')
