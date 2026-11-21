import * as THREE from './node_modules/three/build/three.module.js';

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
const trafficCars=[];
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
function makeCar(x,z,color,police=false,model='sedan'){
  const car=new THREE.Group();
  const paint=new THREE.MeshStandardMaterial({color,roughness:.38,metalness:.28});
  const glass=new THREE.MeshStandardMaterial({color:0x182b3a,roughness:.18,metalness:.18});
  const black=new THREE.MeshStandardMaterial({color:0x10151b,roughness:.7});
  const chrome=new THREE.MeshStandardMaterial({color:0xb8c4ce,metalness:.8,roughness:.22});
  const light=new THREE.MeshBasicMaterial({color:0xfff0c8});
  const tail=new THREE.MeshBasicMaterial({color:0xff2638});
  const profile={
    hatch:{length:3.9,width:1.82,height:.68,cabin:1.45,roof:1.34,hood:1.25},
    super:{length:4.55,width:2.02,height:.48,cabin:1.05,roof:1.04,hood:1.8},
    sedan:{length:4.7,width:1.9,height:.68,cabin:1.65,roof:1.42,hood:1.5},
    sportback:{length:4.8,width:1.95,height:.62,cabin:1.7,roof:1.35,hood:1.55},
    coupe:{length:4.9,width:1.98,height:.65,cabin:1.5,roof:1.36,hood:1.6},
    van:{length:5.1,width:2.0,height:.9,cabin:2.05,roof:1.8,hood:1.05}
  }[model]||{length:4.5,width:1.9,height:.65,cabin:1.55,roof:1.35,hood:1.5};
  const L=profile.length,W=profile.width;
  const lower=new THREE.Mesh(new THREE.BoxGeometry(W,.48,L),paint);lower.position.y=.58;car.add(lower);
  const hood=new THREE.Mesh(new THREE.BoxGeometry(W*.96,.2,profile.hood),paint);hood.position.set(0,.83,L*.34);car.add(hood);
  const rear=new THREE.Mesh(new THREE.BoxGeometry(W*.94,.22,Math.max(.65,L-profile.hood-1.7)),paint);rear.position.set(0,.79,-L*.34);car.add(rear);
  const cabin=new THREE.Mesh(new THREE.BoxGeometry(W*.78,profile.cabin,L*.43),glass);cabin.position.set(0,1.08,-.12);car.add(cabin);
  const roof=new THREE.Mesh(new THREE.BoxGeometry(W*.72,.12,L*.32),paint);roof.position.set(0,1.08+profile.cabin/2,-.18);car.add(roof);
  const frontGlass=new THREE.Mesh(new THREE.BoxGeometry(W*.76,.04,.58),glass);frontGlass.position.set(0,1.34,L*.16);frontGlass.rotation.x=-.42;car.add(frontGlass);
  const backGlass=new THREE.Mesh(new THREE.BoxGeometry(W*.72,.04,.48),glass);backGlass.position.set(0,1.31,-L*.34);backGlass.rotation.x=.48;car.add(backGlass);
  for(const side of [-1,1]){
    const mirror=new THREE.Mesh(new THREE.BoxGeometry(.2,.13,.24),black);mirror.position.set(side*W*.53,1.03,.48);car.add(mirror);
    for(const zw of [-L*.32,L*.32]){
      const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.37,.37,.2,16),black);wheel.rotation.z=Math.PI/2;wheel.position.set(side*(W*.51),.42,zw);car.add(wheel);
      const rim=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.205,12),chrome);rim.rotation.z=Math.PI/2;rim.position.copy(wheel.position);car.add(rim);
    }
    const head=new THREE.Mesh(new THREE.BoxGeometry(.36,.13,.08),light);head.position.set(side*W*.34,.78,L*.505);car.add(head);
    const rearLight=new THREE.Mesh(new THREE.BoxGeometry(.32,.14,.08),tail);rearLight.position.set(side*W*.34,.78,-L*.505);car.add(rearLight);
  }
  const grille=new THREE.Mesh(new THREE.BoxGeometry(W*.42,.18,.06),black);grille.position.set(0,.64,L*.51);car.add(grille);
  if(model==='super'){
    const splitter=new THREE.Mesh(new THREE.BoxGeometry(W*1.03,.08,.35),black);splitter.position.set(0,.36,L*.53);car.add(splitter);
    const wing=new THREE.Mesh(new THREE.BoxGeometry(W*.78,.07,.25),black);wing.position.set(0,1.03,-L*.48);car.add(wing);
  }
  if(model==='hatch'){
    const spoiler=new THREE.Mesh(new THREE.BoxGeometry(W*.65,.07,.2),black);spoiler.position.set(0,1.35,-L*.43);car.add(spoiler);
  }
  if(police){
    const bar=new THREE.Mesh(new THREE.BoxGeometry(1.05,.13,.25),black);bar.position.set(0,1.58,-.12);car.add(bar);
    const red=new THREE.Mesh(new THREE.BoxGeometry(.42,.15,.25),new THREE.MeshBasicMaterial({color:0xff243e}));
    const blue=new THREE.Mesh(new THREE.BoxGeometry(.42,.15,.25),new THREE.MeshBasicMaterial({color:0x247bff}));
    red.position.set(-.28,1.6,-.12);blue.position.set(.28,1.6,-.12);car.add(red,blue);
    car.userData.lights=[red,blue];policeCars.push(car);
  }
  car.position.set(x,0,z);scene.add(car);return car;
}
const fleet=[
  {id:'golf',name:'Kompakt-Klassiker',model:'hatch',color:0xb51e2b,job:'Paketdienst'},
  {id:'super',name:'Supersportwagen',model:'super',color:0xd7ed12,job:'VIP-Chauffeur'},
  {id:'mercedes',name:'Premium-Limousine',model:'sedan',color:0x9f101d,job:'Business-Fahrer'},
  {id:'audi',name:'Elektro-Sportback',model:'sportback',color:0xc72d24,job:'Kurierdienst'},
  {id:'alpina',name:'Luxus-Coupé',model:'coupe',color:0x075b45,job:'Premium-Transport'},
  {id:'taxi',name:'Taxi-Limousine',model:'sedan',color:0xf0c52d,job:'Taxi-Fahrer'},
  {id:'van',name:'Transporter',model:'van',color:0xe6e8e8,job:'Möbeltransport'},
  {id:'service',name:'Service-Kombi',model:'hatch',color:0x2872b7,job:'Stadtwerke'}
];
const jobs=[
 {name:'Paketdienst',vehicle:'golf',desc:'Liefere drei Pakete in der Innenstadt ab.'},
 {name:'VIP-Chauffeur',vehicle:'super',desc:'Hole einen Gast ab und fahre zum Bankenviertel.'},
 {name:'Business-Fahrer',vehicle:'mercedes',desc:'Bringe einen Geschäftskunden zu seinem Büro am Main.'},
 {name:'Kurierdienst',vehicle:'audi',desc:'Bringe eine Sendung quer durch die Stadt.'},
 {name:'Premium-Transport',vehicle:'alpina',desc:'Fahre einen Kunden komfortabel ans Ziel.'},
 {name:'Taxi-Fahrer',vehicle:'taxi',desc:'Nimm Fahrgäste auf und bringe sie ans Ziel.'},
 {name:'Möbeltransport',vehicle:'van',desc:'Transportiere Möbel zu einer neuen Wohnung.'},
 {name:'Stadtwerke',vehicle:'service',desc:'Fahre zu einer gemeldeten Störung.'}
];
let jobPanel,careerHud,jobActive=false,jobCar=null,jobDestination=null;
let driving=false,carSpeed=0,careerMoney=0,completedJobs=0;
function buildInGameJobs(){
 jobPanel=document.createElement('div');jobPanel.id='inGameJobs';jobPanel.className='ingame-jobs hidden';
 jobPanel.innerHTML='<div class="ingame-jobs-head"><b>FRANKFURT LIFE / JOBZENTRALE</b><button id="closeJobs" aria-label="Schließen">×</button></div><h3>Wähle deinen Beruf</h3><p class="ingame-jobs-hint">Dein Auftrag und das passende Dienstfahrzeug starten direkt in der 3D-Stadt.</p><div id="ingameJobChoices"></div><div id="ingameJobDetail">Wähle einen Job aus.</div><button id="startJob" class="ingame-start" disabled>AUFTRAG ANNEHMEN</button><small>J oder ESC · Menü schließen</small>';
 viewport.appendChild(jobPanel);
 careerHud=document.createElement('div');careerHud.id='careerHud';careerHud.style.cssText='position:absolute;top:14px;right:14px;z-index:8;padding:10px 14px;border:1px solid #ffffff30;border-radius:10px;background:#101b2ddd;color:#fff;font:700 13px/1.6 system-ui;pointer-events:none;';careerHud.innerHTML='KONTO: 0 €<br>AUFTRÄGE: 0';viewport.appendChild(careerHud);
 const choices=jobPanel.querySelector('#ingameJobChoices'),detail=jobPanel.querySelector('#ingameJobDetail'),accept=jobPanel.querySelector('#startJob');
 let selected=0;
 jobs.forEach((job,i)=>{
  const vehicle=fleet.find(v=>v.id===job.vehicle);
  const button=document.createElement('button');button.className='ingame-job-choice'+(i===0?' selected':'');
  button.innerHTML='<b>'+job.name+'</b><span>'+vehicle.name+'</span>';
  button.addEventListener('click',()=>{
   selected=i;choices.querySelectorAll('button').forEach((el,n)=>el.classList.toggle('selected',n===i));
   detail.textContent=job.desc+' Fahrzeug: '+vehicle.name+'.';accept.disabled=false;
  });
  choices.appendChild(button);
 });
 choices.firstChild?.click();
 jobPanel.querySelector('#closeJobs').addEventListener('click',()=>jobPanel.classList.add('hidden'));
 accept.addEventListener('click',()=>{
  const job=jobs[selected],vehicle=fleet.find(v=>v.id===job.vehicle);
  if(jobCar){scene.remove(jobCar);if(jobCar.userData.jobMarker)scene.remove(jobCar.userData.jobMarker);}
  jobCar=makeCar(camera.position.x+3,camera.position.z-5,vehicle.color,false,vehicle.model);
  jobCar.rotation.y=yaw;
  jobDestination=new THREE.Vector3(Math.max(-30,Math.min(30,camera.position.x+18)),0,Math.max(-100,Math.min(25,camera.position.z-35)));
  const marker=new THREE.Mesh(new THREE.CylinderGeometry(1.2,1.2,.15,24),new THREE.MeshBasicMaterial({color:0x36d9c4}));
  marker.position.copy(jobDestination);marker.position.y=.12;scene.add(marker);
  jobCar.userData.jobMarker=marker;
  jobActive=true;
  if(careerHud)careerHud.innerHTML='KONTO: '+careerMoney.toLocaleString('de-DE')+' €<br>AUFTRÄGE: '+completedJobs;
  detail.textContent='AUFTRAG AKTIV: '+job.name+' – '+job.desc+' Fahre zum markierten Ziel. (Fahrzeug ist in der Stadt gespawnt.)';
  status.textContent='JOB AKTIV · '+job.name.toUpperCase();
  jobPanel.classList.add('hidden');
 });
}
function toggleJobs(){
 if(!started||!jobPanel)return;
 jobPanel.classList.toggle('hidden');
 if(!jobPanel.classList.contains('hidden'))document.exitPointerLock?.();
}

function createTraffic(){
  const trafficSpecs=[
    [0xb9c5d0,'hatch'],[0x253e59,'sedan'],[0xc6a83a,'hatch'],[0xeeeeea,'van'],[0x7b3034,'sportback'],
    [0x374d43,'coupe'],[0x8d969d,'sedan'],[0x1d2732,'hatch'],[0xe0e4e6,'van'],[0x5b6d84,'sportback']
  ];
  for(let i=0;i<trafficSpecs.length;i++){
    const lane=i<5?-3.2:3.2;
    const direction=i<5?1:-1;
    const [color,model]=trafficSpecs[i];
    const car=makeCar(lane,-112+(i%5)*31,color,false,model);
    car.rotation.y=direction===1?0:Math.PI;
    car.userData.traffic={direction,speed:.055+(i%4)*.012};
    trafficCars.push(car);
  }
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
  makeCar(4,-8,0x1c354d,false,'sportback');
  makeCar(-3,-35,0xffffff,true,'sedan');
  createTraffic();
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
  for(const car of trafficCars){
    const traffic=car.userData.traffic;
    car.position.z+=traffic.direction*traffic.speed*dt*60;
    if(traffic.direction>0&&car.position.z>52)car.position.z=-122;
    if(traffic.direction<0&&car.position.z<-122)car.position.z=52;
  }
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
  if(driving&&jobCar){
    const accelerating=keys.KeyW||keys.ArrowUp, braking=keys.KeyS||keys.ArrowDown;
    if(accelerating)carSpeed=Math.min(0.42,carSpeed+0.012);
    else if(braking)carSpeed=Math.max(-0.18,carSpeed-0.014);
    else carSpeed*=0.975;
    const steer=(keys.KeyA||keys.ArrowLeft?1:0)-(keys.KeyD||keys.ArrowRight?1:0);
    jobCar.rotation.y+=steer*Math.min(.035,Math.abs(carSpeed)*.11);
    const forward=new THREE.Vector3(Math.sin(jobCar.rotation.y),0,Math.cos(jobCar.rotation.y));
    jobCar.position.addScaledVector(forward,carSpeed);
    if(jobActive&&jobDestination&&jobCar.position.distanceTo(jobDestination)<4){
      jobActive=false;completedJobs++;const reward=250+Math.floor(Math.random()*251);careerMoney+=reward;
      if(jobCar.userData.jobMarker){scene.remove(jobCar.userData.jobMarker);jobCar.userData.jobMarker=null;}
      driving=false;carSpeed=0;
      if(careerHud)careerHud.innerHTML='KONTO: '+careerMoney.toLocaleString('de-DE')+' €<br>AUFTRÄGE: '+completedJobs;
      status.textContent='AUFTRAG ERLEDIGT · +'+reward+' € · F ZUM AUSSTEIGEN';
      jobDestination=null;
    }
    jobCar.position.x=Math.max(-48,Math.min(48,jobCar.position.x));
    jobCar.position.z=Math.max(-115,Math.min(45,jobCar.position.z));
    yaw=jobCar.rotation.y-Math.PI;
    camera.position.copy(jobCar.position).addScaledVector(forward,-6);
    camera.position.y=3.2;
  }else{
    const speed=(keys.ShiftLeft||keys.ShiftRight)?.2:.12;
    const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));
    const right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
    if(keys.KeyW||keys.ArrowUp)camera.position.addScaledVector(forward,speed);
    if(keys.KeyS||keys.ArrowDown)camera.position.addScaledVector(forward,-speed);
    if(keys.KeyA||keys.ArrowLeft)camera.position.addScaledVector(right,-speed);
    if(keys.KeyD||keys.ArrowRight)camera.position.addScaledVector(right,speed);
    camera.position.x=Math.max(-48,Math.min(48,camera.position.x));
    camera.position.z=Math.max(-115,Math.min(45,camera.position.z));
    camera.position.y=2.1;
  }
  camera.rotation.order='YXZ';camera.rotation.set(pitch,yaw,0);
  coords.textContent=(driving?'FAHRZEUG ':'POSITION ')+Math.round(camera.position.x)+' / '+Math.round(camera.position.z)+(jobActive&&jobDestination?' · ZIEL '+Math.round((driving?jobCar.position:camera.position).distanceTo(jobDestination))+' M':'');
}
function toggleVehicle(){
  if(!jobCar){status.textContent='WÄHLE ZUERST EINEN JOB MIT J';return;}
  if(!driving){
    if(camera.position.distanceTo(jobCar.position)>9){status.textContent='GEHE NÄHER AN DEIN DIENSTFAHRZEUG';return;}
    driving=true;carSpeed=0;yaw=jobCar.rotation.y-Math.PI;
    status.textContent='IM FAHRZEUG · WASD FAHREN · F AUSSTEIGEN';
  }else{
    driving=false;carSpeed=0;
    camera.position.set(jobCar.position.x+3,2.1,jobCar.position.z+3);
    status.textContent='AUSGESTIEGEN · F ZUM EINSTEIGEN';
  }
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
    makeCity();buildInGameJobs();applyQuality();viewport.appendChild(renderer.domElement);resize();loop();
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
// In der eigenständigen Windows-Spielansicht direkt in die 3D-Stadt starten.
if(document.body.classList.contains('game-app')) begin();
document.addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='KeyF'&&!e.repeat)toggleVehicle();if(e.code==='KeyJ'&&!e.repeat)toggleJobs();if(e.code==='Escape'&&jobPanel&&!jobPanel.classList.contains('hidden'))jobPanel.classList.add('hidden');if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();});
document.addEventListener('keyup',e=>keys[e.code]=false);
window.addEventListener('resize',resize);
