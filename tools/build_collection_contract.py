#!/usr/bin/env python3
"""Generate SQL DDL and a field map from the declared collection contract."""
import csv,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
p=ROOT/'data-model/collection'
contract=json.loads((p/'contract.json').read_text())
remaining={t['key']:t for t in contract['tables']};ordered=[];done=set()
while remaining:
    ready=[t for key,t in remaining.items() if {f['references'].split('.')[0] for f in t['fields'] if f.get('references') and not f['references'].startswith(key+'.')}<=done]
    if not ready:raise ValueError('Unexpected foreign-key cycle')
    for t in ready:ordered.append(t);done.add(t['key']);del remaining[t['key']]
types={'id':'TEXT','text':'TEXT','choice':'TEXT','date':'DATE','time':'TIME WITHOUT TIME ZONE','money':'NUMERIC(16,2)','integer':'INTEGER'}
q=lambda x:"'"+str(x).replace("'","''")+"'"
ddl=['-- Collection staging schema. No operational data is included.','-- Drive Sheets are inputs. Validation precedes admission and reporting.','CREATE SCHEMA IF NOT EXISTS paila_input;']
for t in ordered:
    cols=[];constraints=[];pk=t['fields'][0]['key']
    for f in t['fields']:
        col='  '+f['key']+' '+types[f['type']]+(' PRIMARY KEY' if f['key']==pk else ' NOT NULL' if f['required'] else '')
        if f['type'] in ('money','integer'):col+=' CHECK ('+f['key']+'>=0)'
        if f.get('options'):col+=' CHECK ('+f['key']+' IN ('+', '.join(map(q,f['options']))+'))'
        cols.append(col)
        if f.get('references'):
            table,key=f['references'].split('.')
            constraints.append('  FOREIGN KEY ('+f['key']+') REFERENCES paila_input.'+table+'('+key+') DEFERRABLE INITIALLY DEFERRED')
    constraints+=['  UNIQUE ('+', '.join(keys)+')' for keys in t.get('unique',[])]
    ddl.append('CREATE TABLE IF NOT EXISTS paila_input.'+t['key']+' (\n'+',\n'.join(cols+constraints)+'\n);')
(p/'schema.sql').write_text('\n\n'.join(ddl)+'\n')
with (p/'fields.csv').open('w',newline='') as out:
    w=csv.writer(out);w.writerow(['table','field','sheet_header','type','required','primary_key','references'])
    for t in contract['tables']:
        for i,f in enumerate(t['fields']):w.writerow([t['key'],f['key'],f['label'],f['type'],f['required'],i==0,f.get('references','')])
print('Generated 12-table SQL schema and CSV field map.')

