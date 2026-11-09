#!/usr/bin/env python3
"""Validate the staff site and declared Sheet relationships without live credentials."""
import json,re
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
ROOT=Path(__file__).resolve().parents[1]
def read(path):return json.loads((ROOT/path).read_text())
c=read('data-model/collection/contract.json');s=read('data-model/collection/sources.json')
assert len(c['files'])==len(s['sources'])==10
assert len(c['tables'])==12
tables={t['key']:t for t in c['tables']}
assert len(tables)==12
assert len({f['spreadsheet_id'] for f in s['sources']})==10
assert len({t['prefix'] for t in c['tables']})==12
for t in c['tables']:
    assert len({f['key'] for f in t['fields']})==len(t['fields'])
    for f in t['fields']:
        if f.get('references'):
            target,key=f['references'].split('.')
            assert target in tables and key==tables[target]['fields'][0]['key']
for f in s['sources']:
    assert f['url'].startswith('https://docs.google.com/spreadsheets/d/'+f['spreadsheet_id'])
    assert set(t['key'] for t in f['tables'])==set(next(x['tables'] for x in c['files'] if x['key']==f['key']))
class Links(HTMLParser):
    def __init__(self):super().__init__();self.links=[];self.titles=0;self.h1=0;self.headings=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag in ('a','link','script','img'):
            v=a.get('href',a.get('src'))
            if v:self.links.append(v)
        if tag=='img':
            assert a.get('src') and a.get('alt','').strip(), a
        if tag=='title':self.titles+=1
        if tag=='h1':self.h1+=1
generated=read('data-model/collection/generated-pages.json')['pages']
for filename in generated:
    path=ROOT/filename;parser=Links();parser.feed(path.read_text())
    assert parser.titles==parser.h1==1,filename
    for url in parser.links:
        parsed=urlsplit(url)
        assert parsed.scheme in ('','https'),url
        if parsed.scheme or parsed.netloc or not parsed.path:continue
        target=(path.parent/unquote(parsed.path)).resolve()
        assert target.is_relative_to(ROOT),url
        if parsed.path.endswith('/'):target=target/'index.html'
        assert target.exists(),(filename,url)
for m in read('data-model/console.json')['modules']:
    file=m['path'] if m['path'].endswith('.html') else m['path']+'index.html'
    assert 'data-module="'+m['key']+'"' in (ROOT/file).read_text(),file
assert 'data-module="today"' in (ROOT/'today/index.html').read_text()
assert 'data-module="today"' not in (ROOT/'index.html').read_text()
assert (ROOT/'tools/collect_studio_sheets.py').exists()
print(f'PASS: {len(generated)} staff pages, 10 source files, 12 tables, unique IDs, foreign-key references and local links.')

