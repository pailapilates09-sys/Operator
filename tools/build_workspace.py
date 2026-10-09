#!/usr/bin/env python3
"""Refresh the no-JavaScript fallback from workspace/links.json. No dependencies."""
import json
from pathlib import Path
from html import escape
from urllib.parse import urlparse
ROOT=Path(__file__).resolve().parents[1]
data=json.loads((ROOT/'workspace/links.json').read_text())
groups={g['id'] for g in data['groups']}
assert len(groups)==len(data['groups'])
assert len({e['id'] for e in data['entries']})==len(data['entries'])
for e in data['entries']:
    assert e['group'] in groups and e['status'] in {'VERIFIED','PREVIEW','INCOMPLETE','BLOCKED'}
    assert urlparse(e['url']).scheme=='https' and urlparse(e['url']).netloc
E=lambda v:escape(str(v),quote=True)
blocks=[]
for g in data['groups']:
    cards=[]
    for e in data['entries']:
        if e['group']!=g['id']:continue
        search=' '.join(str(e[k]) for k in ['title','why','how','audience','type','status','status_note']).lower()
        cards.append(f"""<article class="resource" id="resource-{E(e['id'])}" data-status="{E(e['status'])}" data-search="{E(search)}">
<div class="resource-meta"><span>{E(e['type'])}</span><span class="badge {e['status'].lower()}">{E(e['status'])}</span></div>
<h3><a href="{E(e['url'])}">{E(e['title'])}</a></h3><p>{E(e['why'])}</p>
<p class="how"><strong>How to use: </strong>{E(e['how'])}</p><p class="metadata">For {E(e['audience'])}</p>
<p class="state-note">{E(e['status_note'])}</p><a class="open" href="{E(e['url'])}">Open {E(e['title'])} →</a></article>""")
    blocks.append(f'<section class="group" id="{E(g["id"])}" data-group="{E(g["id"])}"><h2>{E(g["title"])}</h2><p>{E(g["description"])}</p><div class="cards">{"".join(cards)}</div></section>')
nav=''.join(f'<a href="#{E(g["id"])}">{E(g["title"])}</a>' for g in data['groups'])
options=''.join(f'<option value="{E(g["id"])}">{E(g["title"])}</option>' for g in data['groups'])
page="""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<meta name="description" content="Paila Workspace: every tool, guide, sheet and source in one editable directory.">
<title>Paila Workspace · Tools, links & guides</title><link rel="stylesheet" href="./workspace.css?v=1"></head>
<body><a class="skip" href="#main">Skip to resources</a>
<header class="top"><div class="wrap top-inner"><a class="brand" href="../"><span class="mark">PP</span><span><strong>Paila Pilates</strong><small>TOOLS · DOCUMENTS · GUIDES</small></span></a>
<nav aria-label="Workspace links"><a href="../">Studio OS</a><a href="../guide/">How-to guides</a><a href="https://docs.google.com/spreadsheets/d/13um0MJkeGd3k_pRDQMu3L0FXJp1BErI8KpY7K8V9kZg/edit">Daily Sheet</a></nav></div></header>
<main id="main" class="wrap"><section class="hero"><div><p class="eyebrow">Your studio, in one place</p><h1>Paila Workspace</h1>
<p class="lede">Find the right tool, understand why it matters, and open it. One link to share with your owner, manager or team.</p>
<p class="metadata"><span id="total-count">@@TOTAL@@</span> resources · Directory updated <span id="updated">@@DATE@@ · Asia/Kathmandu</span></p>
<div class="actions"><button class="button" id="copy-link" type="button" hidden>Copy workspace link</button><a class="button secondary" href="https://github.com/pailapilates09-sys/Operator/blob/main/workspace/links.json">Edit directory in GitHub</a></div>
<p id="share-status" class="metadata" role="status" aria-live="polite"></p><input class="share-url" id="share-url" aria-label="Workspace link to copy" readonly hidden></div>
<aside class="status-box" aria-labelledby="connection-title"><span class="badge incomplete">INCOMPLETE · AUTOMATIC CONNECTION</span><h2 id="connection-title">Sheet updates stay in the sheet for now.</h2>
<p>The daily collection framework is available. Studio OS still displays fictional review data. Its exporter and private adapter code exist, but the live scheduler, database, API and authenticated owner connection remain unfinished.</p>
<a href="#sources">Open setup & source links →</a></aside></section>
<section class="daily-routine" aria-labelledby="routine-title"><h2 id="routine-title">A simple daily routine</h2><ol>
<li><strong>Staff record</strong>Fill Daily Close, Class Sessions and Finance Daily using the sheet's Definitions.</li>
<li><strong>Manager reviews</strong>Check Manager View, missing entries and cash differences. Keep source references and stable IDs.</li>
<li><strong>Owner decides</strong>Review evidence and assign follow-up. Use the prototype to discuss workflows; automatic website reporting is still pending.</li></ol></section>
<div class="toolbar" id="filters" hidden><label>Find a resource<input id="search" type="search" placeholder="Try daily sheet, classes, Neon…" autocomplete="off"></label>
<label>Category<select id="category"><option value="">All categories</option>@@OPTIONS@@</select></label>
<label>Status<select id="status"><option value="">All statuses</option><option>VERIFIED</option><option>PREVIEW</option><option>INCOMPLETE</option><option>BLOCKED</option></select></label></div>
<nav class="directory-nav" id="directory-nav" aria-label="Resource categories">@@NAV@@</nav>
<p id="result-count" class="count" role="status" aria-live="polite">@@TOTAL@@ resources</p><p id="load-status" class="metadata" role="status"></p>
<div id="directory">@@DIRECTORY@@</div><div id="empty" class="empty" hidden><p>No matching resources.</p><button class="button secondary" type="button" id="clear-filters">Clear filters</button></div>
<details class="edit-help"><summary>How to keep this directory current</summary>
<p>Open <a href="https://github.com/pailapilates09-sys/Operator/blob/main/workspace/links.json">Edit directory in GitHub</a>, select the pencil, and update an entry's title, URL, purpose, instructions or status. Keep its ID. Add new entries with a unique ID and an existing category. Update the directory date and save through the governed publication workflow.</p>
<p>After GitHub Pages deploys, this page reads the current JSON directory. The linked Google Doc or Sheet is edited in its own application. Changing a directory link does not export business data or connect the backend.</p>
<p>VERIFIED means the stated artifact was read back, within the note shown. PREVIEW means a draft or prototype. INCOMPLETE means required work remains. BLOCKED means a required dependency is unavailable. These labels are a dated directory snapshot, not a live monitoring service.</p></details>
<noscript><p>The saved links work without JavaScript. Enable JavaScript for search and the latest JSON directory.</p></noscript></main>
<footer><div class="wrap"><span>Paila Workspace · Directory v1.0 · A8 local governance</span><a href="../guide/">Open the illustrated How-to guides →</a></div></footer>
<script src="./workspace.js?v=1" defer></script></body></html>"""
page=page.replace('@@DIRECTORY@@',''.join(blocks)).replace('@@NAV@@',nav).replace('@@OPTIONS@@',options).replace('@@TOTAL@@',str(len(data['entries']))).replace('@@DATE@@',E(data['updated']))
(ROOT/'workspace/index.html').write_text(page)
print(f"Built workspace/index.html: {len(data['entries'])} resources in {len(groups)} groups")
