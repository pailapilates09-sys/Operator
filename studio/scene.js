import * as THREE from './vendor/three.module.min.js';
import {OrbitControls} from './vendor/OrbitControls.js';
export async function createTwin(container, data, onSelect, options) {
 let renderer;
 const canvas=document.createElement('canvas');
 let context=null;try{context=canvas.getContext('webgl2',{antialias:true});}catch{}
 if(context){renderer=new THREE.WebGLRenderer({canvas,context,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));}
 else{const {SVGRenderer}=await import('./vendor/SVGRenderer.js');renderer=new SVGRenderer();renderer.setQuality('high');}
 renderer.setClearColor(new THREE.Color('#edf1e8'));renderer.outputColorSpace=THREE.SRGBColorSpace;container.append(renderer.domElement);
 renderer.domElement.setAttribute('aria-label','Interactive 3D studio layout preview');renderer.domElement.setAttribute('role','img');
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.1,150);camera.position.set(26,24,15);
 const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(7.5,0,-8.5);controls.minDistance=8;controls.maxDistance=65;controls.maxPolarAngle=Math.PI/2.03;controls.enableDamping=false;
 scene.add(new THREE.HemisphereLight(0xffffff,0x6a7d5d,2.4));const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(7,20,10);scene.add(light);
 let height=2.8,cutaway=true,structure=true,selected=null;const group=new THREE.Group();scene.add(group);const pick=[];
 const render=()=>renderer.render(scene,camera);
 function build(){
  for(const m of [...group.children]){m.geometry.dispose();m.material.dispose();group.remove(m);}pick.length=0;
  for(const o of data.objects){
   if(o.points.length<3)continue;
   if(!options.client&&['lift','stair'].includes(o.kind))continue;
   if(!structure&&o.kind!=='zone')continue;
   const shape=new THREE.Shape();o.points.forEach(([x,y],i)=>i?shape.lineTo(x/1000,y/1000):shape.moveTo(x/1000,y/1000));shape.closePath();
   const depth=o.kind==='column'?height:o.kind==='wall'?(cutaway?.85:height):.035;
   const geo=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:1});geo.rotateX(-Math.PI/2);
   const mat=new THREE.MeshStandardMaterial({color:o.id===selected?'#c3834c':o.color,roughness:.95,metalness:0,side:THREE.DoubleSide});const mesh=new THREE.Mesh(geo,mat);mesh.position.y=o.kind==='zone'?-.04:.003;mesh.userData=o;group.add(mesh);pick.push(mesh);
  }
  // Openings remain unfilled. Plan symbols shown as lines at floor plane only.
  for(const o of data.objects.filter(o=>o.points.length===2)){
   if(!structure)continue;const points=o.points.map(([x,y])=>new THREE.Vector3(x/1000,.07,-y/1000));const g=new THREE.BufferGeometry().setFromPoints(points);const line=new THREE.Line(g,new THREE.LineBasicMaterial({color:o.color}));group.add(line);
  }
  render();
 }
 function resize(){const r=container.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();render();}
 const observer=new ResizeObserver(resize);observer.observe(container);controls.addEventListener('change',render);
 let down;renderer.domElement.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>6)return;const r=renderer.domElement.getBoundingClientRect();const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);const hit=ray.intersectObjects(pick)[0];if(hit)onSelect(hit.object.userData.id);});
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();container.dispatchEvent(new CustomEvent('twin-context-lost',{bubbles:true}));});
 build();controls.update();resize();
 return {resize,select(id){selected=id;for(const m of pick)m.material.color.set(m.userData.id===id?'#c3834c':m.userData.color);render();},zoom(f){camera.position.sub(controls.target).multiplyScalar(f).add(controls.target);controls.update();render();},reset(){camera.position.set(26,24,15);controls.target.set(7.5,0,-8.5);controls.update();render();},height(v){height=v;build();},cutaway(v){cutaway=v;build();},structure(v){structure=v;build();}};
}
