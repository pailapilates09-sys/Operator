#!/usr/bin/env python3
"""Build the staff website from its navigation, field definitions and verified sheet links."""
import json
from pathlib import Path
from html import escape
from urllib.parse import urlparse
ROOT=Path(__file__).resolve().parents[1]
contract=json.loads((ROOT/'data-model/collection/contract.json').read_text())
catalog=json.loads((ROOT/'data-model/collection/sources.json').read_text())
navigation=json.loads((ROOT/'data-model/collection/navigation.json').read_text())
old=json.loads((ROOT/'workspace/links.json').read_text())
sources={s['key']:s for s in catalog['sources']}
tables={t['key']:t for t in contract['tables']}
E=lambda s:escape(str(s),quote=True)
pages=[]
def rel(route,prefix):return prefix+route
def header(prefix,current=''):
    links=[('Home',''),('Daily work','work/daily/'),('Help','work/help/')]
    return '<header class="top"><div class="wrap"><a class="brand" href="'+prefix+'">Paila<small>Studio work</small></a><nav aria-label="Main">'+''.join('<a href="'+rel(p,prefix)+'"'+(' aria-current="page"' if n==current else '')+'>'+n+'</a>' for n,p in links)+'</nav></div></header>'
def shell(route,title,description,body,crumbs=(),current=''):
    file='index.html' if not route else route+'index.html'
    depth=len(Path(file).parts)-1
    prefix='../'*depth if depth else './'
    breadcrumb='<nav class="crumbs" aria-label="Breadcrumb"><a href="'+prefix+'">Home</a>'+''.join(' / <a href="'+rel(p,prefix)+'">'+E(n)+'</a>' for n,p in crumbs)+'</nav>' if crumbs else ''
    markup='<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="description" content="'+E(description)+'"><title>'+E(title)+' · Paila</title><link rel="stylesheet" href="'+prefix+'work/work.css?v=20261103"></head><body data-root="'+prefix+'"><a class="skip" href="#main">Skip to content</a>'+header(prefix,current)+'<main class="wrap" id="main">'+breadcrumb+'<header class="hero"><p class="eyebrow">Paila Pilates</p><h1>'+E(title)+'</h1><p class="intro">'+E(description)+'</p></header>'+body.replace('@@ROOT@@',prefix)+'</main><footer class="footer"><div class="wrap"><span>Paila · Updated 3 November 2026</span><span><a href="'+prefix+'work/sheets/">Sheets</a> · <a href="'+prefix+'work/resources/">Files & tools</a> · <a href="https://pailapilates09-sys.github.io/Customer/">Customer website</a></span></div></footer><script src="'+prefix+'work/work.js?v=20261103" defer></script></body></html>\n'
    target=ROOT/file;target.parent.mkdir(parents=True,exist_ok=True);target.write_text(markup);pages.append(file)
def button(title,url,key=None,tab=None,secondary=False):
    return '<a class="button'+(' secondary' if secondary else '')+'" href="'+E(url)+'"'+(' data-sheet-key="'+E(key)+'"' if key else '')+(' data-sheet-tab="'+E(tab)+'"' if tab else '')+'>'+E(title)+'</a>'
def tile(title,desc,url,extra=''):
    return '<article class="card">'+extra+'<h2><a href="'+E(url)+'">'+E(title)+'</a></h2><p>'+E(desc)+'</p><a class="open" href="'+E(url)+'">Open '+E(title)+' →</a></article>'
def sheetcard(key):
    s=sources[key]
    return '<article class="card" data-find="'+E(s['title']+' '+s['owner']+' '+s['summary'])+'"><p class="meta">'+E(s['owner'])+'</p><h3>'+E(s['title'])+'</h3><p>'+E(s['summary'])+'</p><div class="buttons">'+button('Open sheet',s['url'],key)+ '<a class="plain-link" href="@@ROOT@@work/sheets/'+key+'/">How to fill it in</a></div></article>'
home='<div class="cards">'+''.join(tile(g['title'],g['summary'],'@@ROOT@@work/'+g['key']+'/', '<span class="number">'+str(i+1).zfill(2)+'</span>') for i,g in enumerate(navigation['categories']))+tile('Help','Learn the steps, find a procedure or open the studio plan.','@@ROOT@@work/help/','<span class="number">06</span>')+'</div>'
home+='<section class="soft"><h2>First time here?</h2><p>The manager adds locations, staff and plans in Setup. Trainers then use Classes and Attendance.</p><a href="@@ROOT@@work/setup/">Start with Setup →</a></section>'
home+='<div class="share"><button class="button secondary" type="button" data-copy-link hidden>Copy page link</button><p class="small" id="copy-status" role="status"></p><input id="share-url" aria-label="Link to copy" readonly hidden></div>'
home+='<p class="small">Records are edited in Google Sheets. <a href="@@ROOT@@work/reports/">Combined reports come next.</a></p>'
shell('','Studio work','Choose a task. Open its sheet. Keep the records up to date.',home,current='Home')
shell('workspace/','Tools & sheets','Choose an area to find its sheets, instructions and examples.',home,crumbs=[('Tools & sheets','workspace/')])
for group in navigation['categories']:
    key=group['key']
    body='<div class="cards">'+''.join(sheetcard(s) for s in group['sheets'])+'</div>'
    if key=='setup':
        s=sources['setup']
        body+='<section class="soft"><h2>Set up in this order</h2><ol class="steps"><li>Add each location in <a data-sheet-key="setup" data-sheet-tab="locations" href="'+E(s['tables'][0]['url'])+'">Locations</a>.</li><li>Add each trainer or manager in <a data-sheet-key="setup" data-sheet-tab="team" href="'+E(s['tables'][1]['url'])+'">Team</a>. Copy the matching Location ID.</li><li>Add the plans you offer in <a data-sheet-key="setup" data-sheet-tab="plans" href="'+E(s['tables'][2]['url'])+'">Plans</a>. Use a new Plan ID when terms change.</li></ol></section>'
    elif key=='classes':
        body+='<section class="soft"><h2>Before and after class</h2><p>Add the class first. Copy its Class ID into Attendance, together with each Client ID. After class, update the attendance status on the same row.</p></section>'
    elif key=='clients':
        body+='<section class="soft"><h2>Keep one Client ID</h2><p>Use the same Client ID in Attendance, Memberships, Payments and Follow-ups. A renewal gets a new Membership ID.</p></section>'
    elif key=='money':
        body+='<section class="soft"><h2>Record the transaction</h2><p>Enter the amount in NPR and keep the receipt reference. For a refund, choose Refund and copy the original Payment ID. Money received is not the same as profit.</p></section><p><a href="@@ROOT@@work/reports/">About the future reports →</a></p>'
    else:
        body+='<section class="soft"><h2>At the end of the day</h2><p>Update follow-ups and equipment checks, then finish Daily close. Keep unknown amounts blank.</p></section>'
    body+='<details class="details"><summary>See an example</summary><div><p class="small">These older screens use example figures.</p><ul class="line-list">'+''.join('<li><a href="@@ROOT@@'+p+'">'+E(n)+'</a></li>' for n,p in group['examples'])+'</ul></div></details>'
    shell('work/'+key+'/',group['title'],group['summary'],body,crumbs=[(group['title'],'work/'+key+'/')],current='Daily work' if key=='daily' else '')
sheet_intro='<section class="soft"><h2>Choose your task</h2><p>Share the relevant sheet with each trainer or manager. Use these same files for ongoing records.</p><a href="'+E(catalog['source_folder'])+'">Open the folder containing all 10 sheets →</a></section><div class="search" hidden><label for="find-sheet">Find a sheet</label><input id="find-sheet" type="search" placeholder="Try attendance or manager"></div>'
for group in navigation['categories']:
    sheet_intro+='<details class="details" data-sheet-group><summary>'+E(group['title'])+' · '+str(len(group['sheets']))+' sheet'+('s' if len(group['sheets'])>1 else '')+'</summary><div class="cards">'+''.join(sheetcard(k) for k in group['sheets'])+'</div></details>'
shell('work/sheets/','Sheets','One file for each job. Open a category to find the right one.',sheet_intro,crumbs=[('Sheets','work/sheets/')])
refnames={'locations.location_id':('Location ID','setup','locations'),'team.staff_id':('Staff ID','setup','team'),'plans.plan_id':('Plan ID','setup','plans'),'customers.customer_id':('Client ID','customers','customers'),'sessions.session_id':('Class ID','sessions','sessions'),'memberships.membership_id':('Membership ID','memberships','memberships'),'payments.payment_id':('Payment ID','payments','payments')}
for s in catalog['sources']:
    body='<p class="meta">Who: '+E(s['owner'])+'<br>When: '+E(s['when'])+'</p><div class="buttons">'+button('Open '+s['title']+' sheet',s['url'],s['key'])+button('Help inside the sheet',s['help_url'],secondary=True)+'</div><section class="section"><h2>Three steps</h2><ol class="steps"><li>Use the next empty row from row 5. Keep the ID in column A.</li><li>Fill the required fields and choose from the dropdowns. Copy IDs from the existing records.</li><li>Read the Check column. Keep the row when finished; update its status rather than deleting it.</li></ol></section>'
    for st in s['tables']:
        t=tables[st['key']]
        table_body=''
        for f in t['fields']:
            if f['references'] if 'references' in f else False:
                label,owner,tab=refnames[f['references']]
                target=next(x['url'] for x in sources[owner]['tables'] if x['key']==tab)
                instruction='Copy the existing <a data-sheet-key="'+owner+'" data-sheet-tab="'+tab+'" href="'+E(target)+'">'+E(label)+'</a>.'
            elif f['type']=='id':instruction='Keep the issued ID.'
            elif f.get('options'):instruction='Choose '+E(', '.join(f['options']))+'.'
            elif f['type']=='date':instruction='Enter YYYY-MM-DD.'
            elif f['type']=='time':instruction='Enter HH:MM, for example 09:00.'
            elif f['type']=='money':instruction='Enter a number in NPR. Leave unknown amounts blank.'
            elif f['type']=='integer':instruction='Enter a whole number.'
            else:instruction='Enter '+E(f['label'].lower())+'.'
            if f['key']=='refund_of_payment_id':instruction+=' Required for refunds.'
            if f['key']=='completed_date':instruction+=' Required when the task is Done.'
            table_body+='<tr><td>'+E(f['label'])+'</td><td>'+('Yes' if f['required'] else 'If applicable')+'</td><td>'+instruction+'</td></tr>'
        body+='<details class="details"><summary>What to enter'+(' · '+E(t['title']) if len(s['tables'])>1 else '')+'</summary><div><p>'+E(t['grain'])+'</p><div class="table-wrap"><table><thead><tr><th>Field</th><th>Required</th><th>Instruction</th></tr></thead><tbody>'+table_body+'</tbody></table></div></div></details>'
    body+='<p class="small">IDs connect the files. See <a href="@@ROOT@@work/help/ids/">how IDs work</a>. Use <a href="@@ROOT@@work/help/entry/">the entry guide</a> for sorting, corrections and more rows.</p>'
    shell('work/sheets/'+s['key']+'/',s['title'],s['summary'],body,crumbs=[(next(g['title'] for g in navigation['categories'] if g['key']==s['group']),'work/'+s['group']+'/'),(s['title'],'work/sheets/'+s['key']+'/')])
help_cards=[
 ('Start entering data','A short guide for trainers and managers.','work/help/entry/'),
 ('Use the right ID','Copy IDs so records can be matched later.','work/help/ids/'),
 ('Procedures','Find opening, service and data procedures.','sop/'),
 ('Studio plan','Open the 2D and 3D layout.','studio/'),
 ('Visual walkthroughs','Learn the example screens with illustrated guides.','guide/'),
 ('Files & tools','Find source documents and technical setup.','work/resources/')
]
shell('work/help/','Help','Choose what you need help with.','<div class="cards">'+''.join(tile(n,d,'@@ROOT@@'+p) for n,d,p in help_cards)+'</div><p class="small"><a href="@@ROOT@@work/help/changes/">What changed in this update?</a></p>',crumbs=[('Help','work/help/')],current='Help')
entry='<ol class="steps"><li><strong>Manager: fill Setup first.</strong> Add Locations, Team and Plans. Keep the issued IDs.</li><li><strong>Choose the sheet for your task.</strong> Trainers mainly use Classes, Attendance, Follow-ups and Equipment.</li><li><strong>Start on row 5.</strong> Each row represents one record. Grey ID cells are already filled.</li><li><strong>Copy existing IDs.</strong> Do not create a new Client ID when someone returns for another class.</li><li><strong>Use the dropdowns.</strong> Dates use YYYY-MM-DD; class times use 24-hour HH:MM; amounts use NPR.</li><li><strong>Correct the row.</strong> Keep the ID and update its fields. Do not delete completed records or sort a single column.</li><li><strong>Ask for more IDs when needed.</strong> Do not duplicate a file or restart its numbering. The technical handler will add another batch.</li></ol><section class="soft"><h2>What happens next?</h2><p>Google Sheets saves your edits. We will validate and combine the records later. The website does not yet show automatically updated business reports.</p><a href="@@ROOT@@work/sheets/">Find your sheet →</a></section>'
shell('work/help/entry/','Enter a record','A short guide for the team.',entry,crumbs=[('Help','work/help/'),('Enter a record','work/help/entry/')])
ids='<section class="soft"><h2>One person, one Client ID</h2><p>A client keeps the same ID in every file. For example, a row in Attendance points to that client and to a class. The names can be corrected without breaking those links.</p></section><div class="section table-wrap"><table><thead><tr><th>Copy this ID</th><th>From</th><th>Use it in</th></tr></thead><tbody>'
for label,source,used in [
 ('Location ID','Studio setup / Locations','Team, Clients, Classes, Memberships, Payments, Expenses, Daily close and Equipment'),
 ('Staff ID','Studio setup / Team','Classes, Clients, Expenses, Daily close, Follow-ups and Equipment'),
 ('Plan ID','Studio setup / Plans','Memberships'),
 ('Client ID','Clients','Attendance, Memberships, Payments and Follow-ups'),
 ('Class ID','Classes','Attendance'),
 ('Membership ID','Memberships','Attendance and Payments'),
 ('Payment ID','Payments','The original-payment field on a refund')
]:ids+='<tr><td>'+label+'</td><td>'+source+'</td><td>'+used+'</td></tr>'
ids+='</tbody></table></div><p>Keep the issued IDs in column A. Copy an ID from an existing row only when that row has been filled in. An ID beside an empty row is still unused.</p><p><a href="@@ROOT@@work/sheets/">Open the sheet directory →</a></p>'
shell('work/help/ids/','How IDs work','IDs let us match records across the sheets.',ids,crumbs=[('Help','work/help/'),('How IDs work','work/help/ids/')])
reports='<section class="soft"><h2>Collect the records first</h2><p>The 10 input files are linked and ready for entry. There is no automatic combined report yet.</p></section><section class="section"><h2>Once the sheets are in use</h2><ul class="line-list"><li>Classes and Attendance show bookings, completed visits and no-shows.</li><li>Clients and Memberships show enquiries, purchases and renewal dates.</li><li>Payments and Expenses show cash received, refunds and spending.</li><li>Follow-ups and Daily close show unfinished tasks.</li></ul></section><p>We will check the IDs and missing values before combining the records. The technical setup is on the <a href="@@ROOT@@work/resources/tools/">tools page</a>.</p><details class="details"><summary>View the old report example</summary><div><p>Its figures are fictional.</p><a href="@@ROOT@@reports/">Open the report example →</a></div></details>'
shell('work/reports/','Reports','Combined reports will follow the data collection.',reports,crumbs=[('Reports','work/reports/')])
resource_groups=[
 ('documents','Documents','Source references and editable files.',['recovered-studio_reference','drive','website-sources','business-sources','sop-sources','daily-sheet','guide-originals']),
 ('tools','Technical tools','For the person maintaining the system.',['client-repo','customer-repo','export-runbook','export-code','adapter','architecture','neon','vercel','model','system','automations']),
 ('history','Older files','Preserved references and unavailable originals.',['project-rules','library-rules','portal-rules','client-charter','handoff','a8','routing','local-library','legacy-main','recovered-inventory']),
 ('examples','Examples & planning','The earlier screens and reference studies.',['studio-os','benchmark','readiness','management','reports'])
]
shell('work/resources/','Files & tools','Choose a section. Technical details stay here.','<div class="cards">'+''.join(tile(title,desc,'@@ROOT@@work/resources/'+key+'/') for key,title,desc,_ in resource_groups)+'</div>',crumbs=[('Help','work/help/'),('Files & tools','work/resources/')])
entry_by_id={e['id']:e for e in old['entries']}
for key,title,desc,entry_ids in resource_groups:
    body='<ul class="line-list">'
    if key=='tools':
        for label,url in [('New sheet source map','data-model/collection/sources.json'),('Field and ID definitions','data-model/collection/contract.json'),('Table relationships','data-model/collection/schema.sql'),('Read and validate sheet exports','tools/collect_studio_sheets.py')]:
            body+='<li><a href="@@ROOT@@'+url+'">'+label+'</a></li>'
    for eid in entry_ids:
        e=entry_by_id.get(eid)
        if not e:continue
        body+='<li><a href="'+E(e['url'])+'">'+E(e['title'])+'</a><small>'+E('Original unavailable in this account.' if e['status']=='BLOCKED' else 'Earlier aggregate template; use the new staff sheets for the new workflow.' if eid=='daily-sheet' else e['why'])+'</small></li>'
    body+='</ul>'
    if key=='tools':body+='<details class="details"><summary>Connection status</summary><div><p>Sheet links and the source map are verified. The private API reader is implemented, but its credentials, scheduler and authenticated report service are not configured. Do not publish operational exports in this public repository.</p><p>Use the new 12-table collection contract for staging. It does not silently replace the older private event schemas. Original A8/Local registrar access is unavailable; this update records its own provider receipts without claiming a central ACK.</p></div></details>'
    shell('work/resources/'+key+'/',title,desc,body,crumbs=[('Help','work/help/'),('Files & tools','work/resources/'),(title,'work/resources/'+key+'/')])
changes='<div class="table-wrap"><table><thead><tr><th>Before</th><th>Now</th></tr></thead><tbody><tr><td>Dozens of links on one long page</td><td>Six choices on the home page, with smaller pages below</td></tr><tr><td>Every management screen in the main menu</td><td>Short navigation and examples inside their relevant categories</td></tr><tr><td>Repeated technical notes</td><td>Short instructions, with technical details under Files & tools</td></tr><tr><td>One aggregate daily workbook</td><td>Ten focused input files with matching IDs</td></tr><tr><td>Unclear real versus sample figures</td><td>Staff sheets are the input files; older screens are marked as examples</td></tr></tbody></table></div><p class="small">Combined reporting remains the next connection step.</p>'
shell('work/help/changes/','What changed','A shorter route from a task to the right sheet.',changes,crumbs=[('Help','work/help/'),('What changed','work/help/changes/')])
(ROOT/'data-model/collection/generated-pages.json').write_text(json.dumps({'generated_from':['contract.json','sources.json','navigation.json','workspace/links.json'],'pages':pages},indent=2)+'\n')
print(f'Built {len(pages)} pages from {len(sources)} sheet sources.')

