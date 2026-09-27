const root = document.querySelector('[data-studio]');
const client = root.dataset.role === 'client';
const base = new URL('.', import.meta.url);
const $ = (s) => root.querySelector(s);
const ns = 'http://www.w3.org/2000/svg';
function el(tag, attrs = {}, text) { const n = document.createElementNS(ns, tag); for (const [k,v] of Object.entries(attrs)) n.setAttribute(k,v); if (text) n.textContent=text; return n; }
let geometry, svg, model3d, active='2d', selected=null, locked=false;
let view=[-2500,-19500,20500,22000];
const home=[...view];
const opts={labels:true,structure:true,dimensions:client,inside:client,outside:client,g100:true,g500:true,g1000:true,rulers:client};
function pt([x,y]) {return [x,-y];}
function path(o) {return o.points.map(pt).map(p=>p.join(',')).join(' ');}
function midpoint(o) {const a=o.points; return [a.reduce((s,p)=>s+p[0],0)/a.length,a.reduce((s,p)=>s+p[1],0)/a.length];}
const labelAt={'ZONE-MAIN':[4900,8900],'ZONE-BALCONY':[14870,14300],'ZONE-CORE':[12700,6200],'ZONE-TOILET':[12600,1250],'LIFT-01':[14000,10000],'LIFT-02':[13600,7800],'STAIR-01':[13200,5100]};
function select(id) {
 selected=id; const o=geometry.objects.find(x=>x.id===id); if(!o)return;
 $('#selection-title').textContent=o.label;
 $('#selection-text').textContent=client ? (o.note || 'Source-derived traced geometry; exact position and size await verification.') : ({'ZONE-MAIN':'Explore the open floor shown in the architectural plan. The final studio fit-out is still to be confirmed.','ZONE-BALCONY':'An outdoor edge to the studio. Details and access remain subject to confirmation.','ZONE-CORE':'Stairs and lifts are indicated in the architectural source. Visitor routing has not yet been confirmed.','ZONE-TOILET':'The plan includes a toilet area. Its precise arrangement is being reviewed.'}[id] || 'Shown as part of the studio layout preview.');
 $('#selection-id').textContent=client ? `${o.id} · ${o.status.replaceAll('_',' ').toLowerCase()}` : '';
 svg.querySelectorAll('.studio-object').forEach(n=>n.classList.toggle('selected',n.dataset.id===id));
 model3d?.select(id);
}
function render() {
 svg.replaceChildren(); const defs=el('defs'); svg.append(defs);
 const clip=el('clipPath',{id:'floorClip'});
 geometry.objects.filter(o=>o.kind==='zone').forEach(o=>clip.append(el('polygon',{points:path(o)})));defs.append(clip);
 const mask=el('mask',{id:'outsideMask'});mask.append(el('rect',{x:-2500,y:-20000,width:21000,height:23000,fill:'white'}));
 geometry.objects.filter(o=>o.kind==='zone').forEach(o=>mask.append(el('polygon',{points:path(o),fill:'black'})));defs.append(mask);
 for(const o of geometry.objects) {
  if(!opts.structure && o.kind!=='zone')continue;
  if(!client && ['lift','stair'].includes(o.kind))continue;
  const line=o.points.length===2;
  const n=el(line?'polyline':'polygon',{points:path(o),fill:line?'none':o.color,stroke:line?o.color:'#526b58','stroke-width':line?90:25,'stroke-linejoin':'round',class:'studio-object',tabindex:client||o.kind==='zone'?'0':'-1',role:'button','aria-label':o.label});
  n.dataset.id=o.id;n.append(el('title',{},o.label));n.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(o.id)}});svg.append(n);
 }
 for(const inside of [true,false]) {
  if(!opts[inside?'inside':'outside'])continue;
  const g=el('g',{'pointer-events':'none',...(inside?{'clip-path':'url(#floorClip)'}:{mask:'url(#outsideMask)'})});
  for(let i=-2500;i<=20000;i+=100){const major=i%1000===0,medium=i%500===0;if(!(major?opts.g1000:medium?opts.g500:opts.g100))continue; const a={stroke:major?'#54735b':medium?'#75917b':'#aabdab','stroke-width':major?18:medium?10:5,opacity:major?.5:.38};g.append(el('line',{x1:i,y1:-20000,x2:i,y2:2500,...a}));g.append(el('line',{x1:-2500,y1:-i,x2:18000,y2:-i,...a}));}
  svg.append(g);
 }
 if(opts.labels){
  for(const o of geometry.objects.filter(o=>o.kind==='zone'||client&&['lift','stair'].includes(o.kind))){const [x,y]=labelAt[o.id]||midpoint(o);let label=o.label;if(o.id==='ZONE-CORE'&&client)label='Core';const n=el('text',{x,y:-y,'font-size':o.id==='ZONE-MAIN'?420:260,class:'studio-label',...(o.id==='ZONE-BALCONY'?{transform:`rotate(-90 ${x} ${-y})`}:{})},label);svg.append(n)}
 }
 if(opts.rulers){for(let x=0;x<=16000;x+=1000)svg.append(el('text',{x,y:1600,'font-size':180,class:'studio-label'},String(x)));for(let y=0;y<=17000;y+=1000)svg.append(el('text',{x:-1350,y:-y,'font-size':180,class:'studio-label'},String(y)));svg.append(el('text',{x:5500,y:2100,'font-size':220,class:'studio-label'},'X →  ·  Y ↑  ·  millimetres  ·  North unresolved'));}
 if(opts.dimensions){const d=geometry.dimensions.find(d=>d.id==='DIM-X-OVERALL');svg.append(el('line',{x1:0,y1:700,x2:d.value_mm,y2:700,stroke:'#a66033','stroke-width':30}));for(const x of [0,d.value_mm])svg.append(el('line',{x1:x,y1:500,x2:x,y2:900,stroke:'#a66033','stroke-width':30}));svg.append(el('text',{x:d.value_mm/2,y:560,'font-size':260,class:'studio-label'},'15,655 mm · source overall'));}
 const pin=el('g',{id:'pin','pointer-events':'none',visibility:'hidden'});pin.append(el('circle',{r:140,fill:'#bb6532',stroke:'white','stroke-width':40}));pin.append(el('path',{d:'M-350 0H350 M0-350V350',stroke:'#a64c22','stroke-width':35}));svg.append(pin);
 if(selected)select(selected);if(lastPin)drawPin(lastPin);
}
let lastPin=null;
function drawPin(p){lastPin=p;const n=$('#pin');n.setAttribute('transform',`translate(${p[0]} ${-p[1]})`);n.setAttribute('visibility','visible')}
function coords(e){const m=svg.getScreenCTM();return new DOMPoint(e.clientX,e.clientY).matrixTransform(m.inverse());}
function readout(p,prefix=''){const x=Math.round(p[0]),y=Math.round(p[1]);$('#readout').textContent=`${prefix}X ${x} · Y ${y} mm | FF-CELL-X${Math.floor(x/100)}-Y${Math.floor(y/100)}`;}
function setView(){svg.setAttribute('viewBox',view.join(' '));}
function zoom(f,center){const [x,y,w,h]=view;const nw=Math.min(60000,Math.max(1200,w*f));const ratio=nw/w;const c=center||[x+w/2,y+h/2];view=[c[0]+(x-c[0])*ratio,c[1]+(y-c[1])*ratio,nw,h*ratio];setView();}
async function mode(value){
 if(value==='3d'){
  $('#render-status').textContent='Loading the 3D preview…';$('#render-status').hidden=false;
  try{if(!model3d){const {createTwin}=await import('./scene.js');model3d=await createTwin($('#webgl'),geometry,select,{client});}$('#webgl').hidden=false;svg.setAttribute('hidden','');$('#three-settings').hidden=false;model3d.resize();$('#render-status').hidden=true;}
  catch(e){$('#render-status').textContent='3D could not start on this device. The interactive 2D plan remains available.';console.warn('3D preview unavailable',e);return;}
 }else{$('#webgl').hidden=true;svg.removeAttribute('hidden');$('#three-settings').hidden=true;}
 active=value;for(const b of root.querySelectorAll('[data-mode]'))b.setAttribute('aria-pressed',String(b.dataset.mode===value));
 $('#help').textContent=value==='3d'?'Drag to orbit · pinch or scroll to zoom · tap a zone to select.':'Drag to pan · pinch or scroll to zoom · tap a zone to explore.';
}
async function init(){
 const response=await fetch(new URL('geometry.json',base));if(!response.ok)throw new Error('Geometry unavailable');geometry=await response.json();
 svg=$('#plan');render();setView();$('#load-fallback').hidden=true;svg.removeAttribute('hidden');
 $('#geometry-version').textContent=geometry.geometry_version;
 $('#geometry-hash').textContent=client?`Shared geometry ${geometry.canonical_geometry_sha256.slice(0,16)}…`:'';
 const pointer=new Map();let start=null,dragged=false,pinch=null;
 svg.addEventListener('pointerdown',e=>{svg.setPointerCapture(e.pointerId);pointer.set(e.pointerId,[e.clientX,e.clientY]);start={x:e.clientX,y:e.clientY,view:[...view],id:e.target.closest('[data-id]')?.dataset.id};dragged=false;if(pointer.size===2){const a=[...pointer.values()];pinch=Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1]);}});
 svg.addEventListener('pointermove',e=>{const p=coords(e);if(!locked)readout([p.x,-p.y]);if(!pointer.has(e.pointerId))return;pointer.set(e.pointerId,[e.clientX,e.clientY]);if(pointer.size===2){const a=[...pointer.values()],d=Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1]);if(pinch)zoom(pinch/d);pinch=d;dragged=true;return;}if(start){const dx=e.clientX-start.x,dy=e.clientY-start.y;if(Math.hypot(dx,dy)>4)dragged=true;const scale=svg.getScreenCTM().a;view=[start.view[0]-dx/scale,start.view[1]-dy/scale,start.view[2],start.view[3]];setView();}});
 const end=e=>{if(start&&!dragged&&pointer.size===1){const p=coords(e);if(start.id)select(start.id);if(client){locked=true;drawPin([p.x,-p.y]);readout([p.x,-p.y],'Locked · ');}}pointer.delete(e.pointerId);pinch=null;start=null;};svg.addEventListener('pointerup',end);svg.addEventListener('pointercancel',()=>{pointer.clear();start=null;pinch=null;});
 svg.addEventListener('wheel',e=>{e.preventDefault();const p=coords(e);zoom(e.deltaY>0?1.12:.88,[p.x,p.y]);},{passive:false});
 $('#zoom-in').onclick=()=>active==='2d'?zoom(.8):model3d.zoom(.8);$('#zoom-out').onclick=()=>active==='2d'?zoom(1.25):model3d.zoom(1.25);
 $('#fit').onclick=()=>{view=[...home];setView();model3d?.reset();};
 for(const b of root.querySelectorAll('[data-mode]'))b.onclick=()=>mode(b.dataset.mode);
 for(const c of root.querySelectorAll('[data-layer]')){c.checked=opts[c.dataset.layer];c.onchange=()=>{opts[c.dataset.layer]=c.checked;render();if(c.dataset.layer==='structure')model3d?.structure(c.checked);};}
 $('#go-to').onsubmit=e=>{e.preventDefault();const x=Number($('#coord-x').value),y=Number($('#coord-y').value);if(!Number.isFinite(x)||!Number.isFinite(y))return;locked=true;drawPin([x,y]);readout([x,y],'Pinned · ');view=[x-view[2]/2,-y-view[3]/2,view[2],view[3]];setView();};
 $('#unlock').onclick=()=>{locked=false;lastPin=null;$('#pin').setAttribute('visibility','hidden');$('#readout').textContent='Move over the plan for coordinates.';};
 $('#height').oninput=e=>{const h=Number(e.target.value);$('#height-value').textContent=`${h.toFixed(1)} m`;model3d?.height(h);};$('#cutaway').onchange=e=>model3d?.cutaway(e.target.checked);
 for(const o of geometry.objects.filter(o=>o.kind==='zone')){const b=document.createElement('button');b.type='button';b.textContent=o.label;const sw=document.createElement('span');sw.className='studio-swatch';sw.style.background=o.color;b.prepend(sw);b.onclick=()=>select(o.id);$('#legend').append(b);}
 root.addEventListener('twin-context-lost',()=>{mode('2d');$('#render-status').hidden=false;$('#render-status').textContent='3D graphics became unavailable. The 2D plan is still ready to use.';});
 select('ZONE-MAIN');
}
init().catch(e=>{$('#render-status').hidden=false;$('#render-status').textContent='The interactive view could not load. A static plan is shown below; refresh to try again.';console.error(e);});
