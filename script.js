import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const startButton=document.querySelector('#startGame');
const placeholder=document.querySelector('.game-placeholder');
const viewport=document.querySelector('#gameViewport');
const status=document.querySelector('#gameStatus');
const coords=document.querySelector('#coords');
const qualitySelect=document.querySelector('#qualitySelect');
const fpsSelect=document.querySelector('#fpsSelect');
let maxFps=60,lastFrame=0;
const qualitySettings={low:{pixelRatio:.75,shadows:false},medium:{pixelRatio:1,shadows:false},high:{pixelRatio:1.25,shadows:true}};
function applyQuality(){if(!renderer)return;const q=qualitySettings[qualitySelect?.value||'medium'];renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,q.pixelRatio));renderer.shadowMap.enabled=q.shadows;resize();}
qualitySelect?.addEventListener('change',applyQuality);
fpsSelect?.addEventListener('change',()=>{maxFps=fpsSelect.value==='unlimited'?0:Number(fpsSelect.value);});
let renderer,scene,camera,raf,started=false,yaw=0,pitch=0,locked=false;
const keys={};
const pedestrians=[];
const policeCars=[];
const clock=new THREE.Clock();

function building(x,z,w,d,h,color){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({color}));
  body.position.y=h/2;g.add(body);
  const roof=new THREE.Mesh(new THREE.BoxGeometry(w*1.03,.35,d*1.03),new THREE.MeshLambertMaterial({color:0x26364b}));
  roof.position.y=h+.15;g.add(roof);
  for(let y=2;y<h-1;y+=2.6) for(let xx=-w/2+.8;xx<w/2-.4;xx+=1.5){
    const win=new THREE.Mesh(new THREE.BoxGeometry(.55,.8,.06),new THREE.MeshBasicMaterial({color:Math.random()>.3?0x9ac9e7:0x34465b}));
    win.position.set(xx,y,d/2+.04);g.add(win);
  }
  g.position.set(x,0,z);scene.add(g);
}
function tree(x,z){
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.16,.22,2,6),new THREE.MeshLambertMaterial({color:0x5b4637}));
  trunk.position.set(x,1,z);scene.add(trunk);
  const crown=new THREE.Mesh(new THREE.SphereGeometry(1.15,7,6),new THREE.MeshLambertMaterial({color:0x315e4c}));
  crown.position.set(x,2.35,z);scene.add(crown);
}
function makePedestrian(x,z,index){
  const group=new THREE.Group();
  const colors=[0x345b80,0x8c5747,0x526c54,0x454b59,0xb18b4d,0x6c557f];
  const shirt=new THREE.Mesh(new THREE.CylinderGeometry(.25,.3,.85,7),new THREE.MeshLambertMaterial({color:colors[index%colors.length]}));
  shirt.position.y=1.18;group.add(shirt);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.2,8,7),new THREE.MeshLambertMaterial({color:0xc99570}));
  head.position.y=1.78;group.add(head);
  for(const side of [-1,1]){
    const leg=new THREE.Mesh(new THREE.BoxGeometry(.13,.62,.15),new THREE.MeshLambertMaterial({color:0x263342}));
    leg.position.set(side*.12,.42,0);group.add(leg);
  }
  group.position.set(x,0,z);
  group.userData={originX:x,originZ:z,phase:index*.8,speed:.35+(index%4)*.09};
  pedestrians.push(group);scene.add(group);
}
function makeCar(x,z,color,police=false){
  const car=new THREE.Group();
  const mat=new THREE.MeshStandardMaterial({color,roughness:.72,metalness:.12});
  const body=new THREE.Mesh(new THREE.BoxGeometry(2.15,.72,4.1),mat);body.position.y=.72;car.add(body);
  const cabin=new THREE.Mesh(new THREE.BoxGeometry(1.62,.78,2.05),new THREE.MeshStandardMaterial({color:0x263b4c,roughness:.35,metalness:.2}));
  cabin.position.set(0,1.42,-.18);car.add(cabin);
  for(const xw of [-1,1]) for(const zw of [-1.35,1.35]){
    const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.38,.38,.22,12),new THREE.MeshStandardMaterial({color:0x11151a}));
    wheel.rotation.z=Math.PI/2;wheel.position.set(xw*1.08,.42,zw);car.add(wheel);
  }
  if(police){
    const bar=new THREE.Mesh(new THREE.BoxGeometry(1.05,.16,.28),new THREE.MeshBasicMaterial({color:0xe8f1ff}));
    bar.position.set(0,1.88,-.15);car.add(bar);
    const red=new THREE.Mesh(new THREE.BoxGeometry(.42,.18,.3),new THREE.MeshBasicMaterial({color:0xff243e}));
    const blue=new THREE.Mesh(new THREE.BoxGeometry(.42,.18,.3),new THREE.MeshBasicMaterial({color:0x247bff}));
    red.position.set(-.28,1.91,-.15);blue.position.set(.28,1.91,-.15);car.add(red,blue);
    car.userData.lights=[red,blue];policeCars.push(car);
  }
  car.position.set(x,0,z);scene.add(car);return car;
}
function makeCity(){
  scene=new THREE.Scene();scene.background=new THREE.Color(0x91b1c8);scene.fog=new THREE.Fog(0x91b1c8,65,185);
  camera=new THREE.PerspectiveCamera(72,viewport.clientWidth/viewport.clientHeight,.1,260);camera.position.set(0,2.1,14);
  scene.add(new THREE.HemisphereLight(0xd7ecff,0x4a5260,2));
  const sun=new THREE.DirectionalLight(0xffe0b4,1.5);sun.position.set(-25,45,25);scene.add(sun);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(240,240),new THREE.MeshLambertMaterial({color:0x58636b}));ground.rotation.x=-Math.PI/2;ground.position.y=-.12;scene.add(ground);
  const road=new THREE.Mesh(new THREE.PlaneGeometry(15,190),new THREE.MeshLambertMaterial({color:0x202a35}));road.rotation.x=-Math.PI/2;road.position.set(0,0,-35);scene.add(road);
  for(let z=-120;z<55;z+=12){const line=new THREE.Mesh(new THREE.PlaneGeometry(.18,5),new THREE.MeshBasicMaterial({color:0xe5dfc5}));line.rotation.x=-Math.PI/2;line.position.set(0,.015,z);scene.add(line);}
  const sidewalkMat=new THREE.MeshLambertMaterial({color:0x92999b});
  for(const x of [-9.2,9.2]){const s=new THREE.Mesh(new THREE.BoxGeometry(3,.25,190),sidewalkMat);s.position.set(x,.08,-35);scene.add(s);}
  for(let z=-105;z<35;z+=18){building(-15,z,8,12,12+Math.random()*22,0x6c7885);building(15,z-7,8,12,15+Math.random()*25,0x77828c);}
  for(let i=0;i<7;i++)building(-42+i*14,-72,8,9,25+Math.random()*38,0x43576a);
  for(let z=-95;z<25;z+=14)for(const x of [-11,11])tree(x,z);
  makeCar(4,-8,0x1c354d);
  makeCar(-3,-35,0xffffff,true);
  for(let i=0;i<14;i++){
    const side=i%2===0?-1:1;
    makePedestrian(side*(9.1+(i%3)*.65),-88+(i*13)%112,i);
  }
}
function resize(){
  if(!renderer)return;
  const w=viewport.clientWidth,h=viewport.clientHeight;
  renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
}
function updateWorld(dt){
  const t=clock.elapsedTime;
  for(const p of pedestrians){
    const u=p.userData;
    p.position.z=u.originZ+Math.sin(t*u.speed+u.phase)*2.6;
    p.position.x=u.originX+Math.sin(t*u.speed*.55+u.phase)*.55;
    p.rotation.y=Math.cos(t*u.speed+u.phase)*.18;
    p.children[2].rotation.x=Math.sin(t*5+u.phase)*.22;
    p.children[3].rotation.x=-Math.sin(t*5+u.phase)*.22;
  }
  for(const car of policeCars){
    const [red,blue]=car.userData.lights;
    const flash=Math.floor(t*5)%2===0;
    red.material.color.setHex(flash?0xff2038:0x40151d);
    blue.material.color.setHex(flash?0x173c78:0x247bff);
  }
}
function move(){
  const speed=keys.ShiftLeft||keys.ShiftRight?.2:.12;
  const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));
  const right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
  if(keys.KeyW||keys.ArrowUp)camera.position.addScaledVector(forward,speed);
  if(keys.KeyS||keys.ArrowDown)camera.position.addScaledVector(forward,-speed);
  if(keys.KeyA||keys.ArrowLeft)camera.position.addScaledVector(right,-speed);
  if(keys.KeyD||keys.ArrowRight)camera.position.addScaledVector(right,speed);
  camera.position.x=Math.max(-48,Math.min(48,camera.position.x));
  camera.position.z=Math.max(-115,Math.min(45,camera.position.z));
  camera.position.y=2.1;camera.rotation.order='YXZ';camera.rotation.set(pitch,yaw,0);
  coords.textContent='POSITION '+Math.round(camera.position.x)+' / '+Math.round(camera.position.z);
}
function loop(now=0){
  raf=requestAnimationFrame(loop);
  if(maxFps&&now-lastFrame<1000/maxFps)return;
  lastFrame=now;const dt=Math.min(clock.getDelta(),.05);
  move();updateWorld(dt);renderer.render(scene,camera);
}
function begin(){
  if(started)return;started=true;placeholder?.remove();
  status.textContent='STADT GELADEN · KLICKE INS SPIEL';
  try{
    renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'low-power'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1));
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.shadowMap.enabled=false;
    applyQuality();viewport.appendChild(renderer.domElement);
    makeCity();resize();loop();
    renderer.domElement.addEventListener('click',()=>renderer.domElement.requestPointerLock?.());
    document.addEventListener('pointerlockchange',()=>{
      locked=document.pointerLockElement===renderer.domElement;
      status.textContent=locked?'MAUS AKTIV · ESC ZUM PAUSIEREN':'KLICKE INS SPIEL ZUM WEITER-SPIELEN';
    });
    document.addEventListener('mousemove',e=>{
      if(!locked)return;yaw-=e.movementX*.002;
      pitch=Math.max(-1.15,Math.min(1.15,pitch-e.movementY*.002));
    });
  }catch(e){
    status.textContent='3D NICHT VERFÜGBAR';
    viewport.innerHTML='<div class="game-placeholder"><div class="placeholder-title">3D-DEMO NICHT<br><em>VERFÜGBAR</em></div><p>Dein Browser oder deine Grafikkarte unterstützt WebGL möglicherweise nicht.</p></div>';
  }
}
startButton?.addEventListener('click',begin);
document.addEventListener('keydown',e=>{keys[e.code]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();});
document.addEventListener('keyup',e=>keys[e.code]=false);
window.addEventListener('resize',resize);
