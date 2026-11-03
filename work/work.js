document.querySelectorAll('[data-copy-link]').forEach(button=>{
 button.hidden=false;
 button.addEventListener('click',async()=>{
  const status=document.querySelector('#copy-status');
  try{await navigator.clipboard.writeText(location.href.split('#')[0]);status.textContent='Link copied. Paste it into your message.';}
  catch{const field=document.querySelector('#share-url');field.hidden=false;field.value=location.href.split('#')[0];field.focus();field.select();status.textContent='Copy the selected link.';}
 });
});
const search=document.querySelector('#find-sheet');
if(search){search.closest('.search').hidden=false;search.addEventListener('input',()=>{
 const q=search.value.trim().toLowerCase();
 for(const group of document.querySelectorAll('[data-sheet-group]')){
  let shown=0;
  for(const card of group.querySelectorAll('[data-find]')){const show=card.dataset.find.toLowerCase().includes(q);card.hidden=!show;if(show)shown++;}
  group.hidden=shown===0;if(q&&shown)group.open=true;
 }
});}
async function refreshLinks(){
 try{const base=new URL(document.body.dataset.root,location.href);const response=await fetch(new URL('data-model/collection/sources.json',base),{cache:'no-store'});if(!response.ok)return;
 const catalog=await response.json();
 for(const a of document.querySelectorAll('[data-sheet-key]')){
  const s=catalog.sources.find(s=>s.key===a.dataset.sheetKey);if(!s)continue;
  const value=a.dataset.sheetTab?s.tables.find(t=>t.key===a.dataset.sheetTab)?.url:s.url;
  if(!value)continue;const url=new URL(value);
  if(url.protocol==='https:'&&url.hostname==='docs.google.com'&&url.pathname.startsWith('/spreadsheets/d/'))a.href=url.href;
 }
 }catch{/* The verified HTML links remain available if the directory cannot refresh. */}
}
refreshLinks();

