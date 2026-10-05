const groupsNode=document.querySelector('#directory');
const query=document.querySelector('#search');
const category=document.querySelector('#category');
const status=document.querySelector('#status');
const count=document.querySelector('#result-count');
const empty=document.querySelector('#empty');
const message=document.querySelector('#load-status');
const allowedStatuses=new Set(['VERIFIED','PREVIEW','INCOMPLETE','BLOCKED']);
const h=(tag,text,className)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;};
const safeUrl=value=>{const u=new URL(value,location.href);if(u.protocol!=='https:'&&!(u.origin===location.origin&&u.protocol==='http:'))throw new Error('Invalid resource URL');return u.href;};
function validate(data){
 if(!Array.isArray(data.groups)||!Array.isArray(data.entries)||!/^\d{4}-\d{2}-\d{2}$/.test(data.updated))throw new Error('Invalid directory');
 const groupIds=new Set();const ids=new Set();
 for(const g of data.groups){if(!g.id||groupIds.has(g.id)||typeof g.title!=='string')throw new Error('Invalid group');groupIds.add(g.id);}
 for(const e of data.entries){if(!e.id||ids.has(e.id)||!groupIds.has(e.group)||!allowedStatuses.has(e.status)||['title','url','why','how','audience','type','status_note'].some(k=>typeof e[k]!=='string'))throw new Error('Invalid entry');ids.add(e.id);safeUrl(e.url);}
 return data;
}
function render(data){
 const fragment=document.createDocumentFragment();
 for(const group of data.groups){
  const section=h('section',undefined,'group');section.id=group.id;section.dataset.group=group.id;
  section.append(h('h2',group.title),h('p',group.description));const grid=h('div',undefined,'cards');
  for(const e of data.entries.filter(x=>x.group===group.id)){
   const card=h('article',undefined,'resource');card.id='resource-'+e.id;card.dataset.status=e.status;
   card.dataset.search=[e.title,e.why,e.how,e.audience,e.type,e.status,e.status_note].join(' ').toLowerCase();
   const meta=h('div',undefined,'resource-meta');meta.append(h('span',e.type),h('span',e.status,'badge '+e.status.toLowerCase()));
   const heading=h('h3');const title=h('a',e.title);title.href=safeUrl(e.url);heading.append(title);
   const how=h('p',undefined,'how');how.append(h('strong','How to use: '),document.createTextNode(e.how));
   const open=h('a','Open '+e.title+' →','open');open.href=safeUrl(e.url);
   card.append(meta,heading,h('p',e.why),how,h('p','For '+e.audience,'metadata'),h('p',e.status_note,'state-note'),open);grid.append(card);
  }
  section.append(grid);fragment.append(section);
 }
 groupsNode.replaceChildren(fragment);
 category.replaceChildren(h('option','All categories'));category.firstChild.value='';
 for(const g of data.groups){const o=h('option',g.title);o.value=g.id;category.append(o);}
 const nav=document.querySelector('#directory-nav');nav.replaceChildren();
 for(const g of data.groups){const a=h('a',g.title);a.href='#'+g.id;nav.append(a);}
 document.querySelector('#updated').textContent=data.updated+' · Asia/Kathmandu';
 document.querySelector('#total-count').textContent=data.entries.length;
 filter();
}
function filter(){
 let shown=0;const q=query.value.trim().toLowerCase();
 const total=groupsNode.querySelectorAll('.resource').length;
 for(const section of groupsNode.querySelectorAll('.group')){
  let visible=0;
  for(const card of section.querySelectorAll('.resource')){
   const match=(!category.value||category.value===section.dataset.group)&&(!status.value||status.value===card.dataset.status)&&(!q||card.dataset.search.includes(q));
   card.hidden=!match;if(match){visible++;shown++;}
  }
  section.hidden=visible===0;
 }
 count.textContent=shown+' of '+total+' resources';empty.hidden=shown!==0;
}
for(const control of [query,category,status])control.addEventListener(control===query?'input':'change',filter);
document.querySelector('#clear-filters').addEventListener('click',()=>{query.value='';category.value='';status.value='';filter();query.focus();});
document.querySelector('#copy-link').addEventListener('click',async()=>{
 const u=new URL('./',location.href).href;
 try{await navigator.clipboard.writeText(u);document.querySelector('#share-status').textContent='Workspace link copied. Paste it into your message.';}
 catch{const input=document.querySelector('#share-url');input.hidden=false;input.value=u;input.focus();input.select();document.querySelector('#share-status').textContent='Copy the selected workspace link.';}
});
async function load(){
 try{const response=await fetch('./links.json',{cache:'no-store'});if(!response.ok)throw new Error('Directory unavailable');const data=validate(await response.json());render(data);message.textContent='';}
 catch{message.textContent='Showing the saved directory snapshot. Reload to retry the latest directory.';}
}
document.querySelector('#filters').hidden=false;document.querySelector('#copy-link').hidden=false;
filter();load();
