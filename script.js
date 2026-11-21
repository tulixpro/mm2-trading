import * as THREE from './node_modules/three/build/three.module.js';

const startButton=document.querySelector('#startGame');
const placeholder=document.querySelector('.game-placeholder');
const viewport=document.querySelector('#gameViewport');
const status=document.querySelector('#gameStatus');
const coords=document.querySelector('#coords');
const qualitySelect=document.querySelector('#qualitySelect');
const fpsSelect=document.querySelector('#fpsSelect');
let maxFps=60,lastFrame=0;
const qualitySettings={
 low:{pixelRatio:.65,shadows:false,fog:125,exposure:.82,ambient:1.65,label:'NIEDRIG'},
 medium:{pixelRatio:.9,shadows:false,fog:165,exposure:1,ambient:2,label:'MITTEL'},
 high:{pixelRatio:1.25,shadows:true,fog:215,exposure:1.12,ambient:2.15,label:'HOCH'}
};
let sunLight=null,hemiLight=null,flashlight=null,flashlightTarget=null,flashlightOn=false;
function applyQuality(){
 if(!renderer||!scene)return;
 const mode=qualitySelect?.value||'medium',q=qualitySettings[mode];
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,q.pixelRatio));
 renderer.shadowMap.enabled=q.shadows;
 renderer.toneMappingExposure=q.exposure;
 if(scene.fog)scene.fog.far=q.fog;
 if(sunLight){sunLight.intensity=mode==='low'?1.05:mode==='medium'?1.5:1.9;sunLight.castShadow=q.shadows;sunLight.shadow.mapSize.set(1024,1024);sunLight.shadow.camera.left=-65;sunLight.shadow.camera.right=65;sunLight.shadow.camera.top=65;sunLight.shadow.camera.bottom=-65;sunLight.shadow.camera.near=1;sunLight.shadow.camera.far=140;sunLight.shadow.camera.updateProjectionMatrix();}
 if(hemiLight)hemiLight.intensity=q.ambient;
 scene.traverse(obj=>{if(obj.isMesh){obj.castShadow=q.shadows;obj.receiveShadow=q.shadows;}});
 const hint=document.querySelector('#graphicsHint')||document.querySelector('#qualityStatus');
 if(hint)hint.textContent='Grafik: '+q.label+' · '+(q.shadows?'Schatten AN':'Schatten AUS');
 if(viewport)viewport.dataset.graphics=mode;
 resize();
}
qualitySelect?.addEventListener('change',applyQuality);
fpsSelect?.addEventListener('change',()=>{maxFps=fpsSelect.value==='unlimited'?0:Number(fpsSelect.value);});
let renderer,scene,camera,raf,started=false,yaw=0,pitch=0,locked=false;
const keys={};
const pedestrians=[];
const policeCars=[];
const trafficCars=[];
const streetLights=[];
const shops=[];
const inventory={Kaffee:0,Snack:0,Stadtplan:0};
let shopPanel=null,currentShop=null;
const clock=new THREE.Clock();

function building(x,z,w,d,h,color){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({color}));
  body.position.y=h/2;g.add(body);
  const roof=new THREE.Mesh(new THREE.BoxGeometry(w*1.03,.35,d*1.03),new THREE.MeshLambertMaterial({color:0x26364b}));
  roof.position.y=h+.15;g.add(roof);
  for(let y=2;y<h-1;y+=2.6){
    for(let xx=-w/2+.8;xx<w/2-.4;xx+=1.5){
      const lit=Math.random()>.3;
      const winMat=new THREE.MeshStandardMaterial({color:lit?0x9ac9e7:0x34465b,emissive:lit?0x28475c:0x080e16,emissiveIntensity:.28,roughness:.3,metalness:.12});
      const win=new THREE.Mesh(new THREE.BoxGeometry(.55,.8,.06),winMat);
      win.position.set(xx,y,d/2+.04);g.add(win);
      const sideWin=new THREE.Mesh(new THREE.BoxGeometry(.06,.8,.55),winMat);
      sideWin.position.set(w/2+.04,y,xx/w*d*.72);g.add(sideWin);
      if(y>3&&Math.abs(xx)<w*.42){
        const balcony=new THREE.Mesh(new THREE.BoxGeometry(.82,.08,.28),new THREE.MeshStandardMaterial({color:0x77838b,metalness:.35,roughness:.7}));
        balcony.position.set(xx,y-.52,d/2+.2);g.add(balcony);
      }
    }
  }
  g.position.set(x,0,z);scene.add(g);
}
function residentialBuilding(x,z,w,d,h,color){
 const g=new THREE.Group();
 const wall=new THREE.MeshStandardMaterial({color,roughness:.88});
 const trim=new THREE.MeshStandardMaterial({color:0xe1d8c8,roughness:.8});
 const glass=new THREE.MeshStandardMaterial({color:0x83b8cf,roughness:.25,metalness:.12,emissive:0x152b38,emissiveIntensity:.18});
 const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),wall);body.position.y=h/2;g.add(body);
 const roof=new THREE.Mesh(new THREE.BoxGeometry(w+0.35,.35,d+0.35),new THREE.MeshStandardMaterial({color:0x384653}));roof.position.y=h+.16;g.add(roof);
 for(let y=2.2;y<h-1;y+=2.65){
  for(let xx=-w/2+1;xx<w/2-.7;xx+=1.65){
   const win=new THREE.Mesh(new THREE.BoxGeometry(.72,1.05,.08),glass);win.position.set(xx,y,d/2+.06);g.add(win);
   const frame=new THREE.Mesh(new THREE.BoxGeometry(.82,.09,.16),trim);frame.position.set(xx,y-.58,d/2+.1);g.add(frame);
   const balcony=new THREE.Group();
   const floor=new THREE.Mesh(new THREE.BoxGeometry(1.15,.09,.62),trim);floor.position.set(xx,y-.72,d/2+.34);balcony.add(floor);
   const rail=new THREE.Mesh(new THREE.BoxGeometry(1.12,.48,.06),new THREE.MeshStandardMaterial({color:0x657681,metalness:.35}));rail.position.set(xx,y-.47,d/2+.62);balcony.add(rail);
   g.add(balcony);
  }
 }
 const door=new THREE.Mesh(new THREE.BoxGeometry(1.15,2.1,.1),new THREE.MeshStandardMaterial({color:0x263a4b}));door.position.set(0,1.05,d/2+.08);g.add(door);
 const canopy=new THREE.Mesh(new THREE.BoxGeometry(2.1,.18,.9),trim);canopy.position.set(0,2.2,d/2+.38);g.add(canopy);
 const signCanvas=document.createElement('canvas');signCanvas.width=512;signCanvas.height=100;
 const ctx=signCanvas.getContext('2d');ctx.fillStyle='#23394a';ctx.fillRect(0,0,512,100);ctx.fillStyle='#fff';ctx.font='bold 34px Arial';ctx.textAlign='center';ctx.fillText('WOHNEN',256,64);
 const sign=new THREE.Mesh(new THREE.BoxGeometry(2.8,.55,.1),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(signCanvas)}));sign.position.set(0,3,d/2+.1);g.add(sign);
 g.position.set(x,0,z);scene.add(g);
}
function createShop(x,z,side,name,subtitle,color){
 const g=new THREE.Group();
 const wallMat=new THREE.MeshStandardMaterial({color:0xddd8cc,roughness:.86});
 const trimMat=new THREE.MeshStandardMaterial({color:0x273746,metalness:.25,roughness:.55});
 const glassMat=new THREE.MeshStandardMaterial({color:0x8fc5d8,roughness:.18,metalness:.25,transparent:true,opacity:.72});
 const body=new THREE.Mesh(new THREE.BoxGeometry(8,8,10),wallMat);body.position.y=4;g.add(body);
 const frontX=side>0?-4.08:4.08;
 const glass=new THREE.Mesh(new THREE.BoxGeometry(.09,2.65,7.4),glassMat);glass.position.set(frontX,2.35,0);g.add(glass);
 const door=new THREE.Mesh(new THREE.BoxGeometry(.14,2.8,1.35),new THREE.MeshStandardMaterial({color:0x243747,roughness:.25,metalness:.2}));door.position.set(frontX*1.015,1.45,3.15);g.add(door);
 const doorPane=new THREE.Mesh(new THREE.BoxGeometry(.16,1.75,.82),glassMat);doorPane.position.set(frontX*1.03,1.72,3.15);g.add(doorPane);
 const frame=new THREE.Mesh(new THREE.BoxGeometry(.2,.22,8.1),trimMat);frame.position.set(frontX*1.02,3.82,0);g.add(frame);
 const awning=new THREE.Mesh(new THREE.BoxGeometry(1.05,.22,8.4),new THREE.MeshStandardMaterial({color,roughness:.65}));awning.position.set(frontX-side*.48,3.35,0);g.add(awning);
 const signCanvas=document.createElement('canvas');signCanvas.width=1024;signCanvas.height=180;
 const ctx=signCanvas.getContext('2d');ctx.fillStyle='#172536';ctx.fillRect(0,0,1024,180);
 ctx.fillStyle='#ffffff';ctx.font='bold 76px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(name,512,78);
 ctx.fillStyle='#c5d8e7';ctx.font='30px Arial';ctx.fillText(subtitle,512,142);
 const signTexture=new THREE.CanvasTexture(signCanvas);signTexture.colorSpace=THREE.SRGBColorSpace;
 const sign=new THREE.Mesh(new THREE.BoxGeometry(.18,.95,8.2),new THREE.MeshStandardMaterial({map:signTexture,roughness:.65}));
 sign.position.set(frontX*1.04,5.1,0);g.add(sign);
 const interiorMat=new THREE.MeshStandardMaterial({color:color,roughness:.7});
 for(let i=0;i<4;i++){
  const shelf=new THREE.Mesh(new THREE.BoxGeometry(.5,.85,1.05),interiorMat);
  shelf.position.set(-side*2.8,.65,-2.7+i*1.8);g.add(shelf);
 }
 const base=new THREE.Mesh(new THREE.BoxGeometry(8.3,.24,10.3),trimMat);base.position.y=.12;g.add(base);
 g.position.set(x,0,z);scene.add(g);
 shops.push({name,subtitle,x,z,side,products:[{name:'Kaffee',price:4},{name:'Snack',price:3},{name:'Stadtplan',price:8}]});
}
function streetLamp(x,z){
 const pole=new THREE.Mesh(new THREE.CylinderGeometry(.07,.11,5.2,7),new THREE.MeshStandardMaterial({color:0x27323b,metalness:.55,roughness:.5}));
 pole.position.set(x,2.6,z);scene.add(pole);
 const arm=new THREE.Mesh(new THREE.BoxGeometry(.9,.09,.1),new THREE.MeshStandardMaterial({color:0x27323b,metalness:.45}));
 arm.position.set(x+(x<0?.38:-.38),5.05,z);scene.add(arm);
 const bulb=new THREE.Mesh(new THREE.BoxGeometry(.38,.12,.24),new THREE.MeshBasicMaterial({color:0xffe4a8}));
 bulb.position.set(x+(x<0?.72:-.72),4.98,z);scene.add(bulb);streetLights.push(bulb);
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
  jobDestination=new THREE.Vector3(Math.max(-105,Math.min(105,camera.position.x+24)),0,Math.max(-205,Math.min(105,camera.position.z-45)));
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

function buildShopInteraction(){
 shopPanel=document.createElement('div');shopPanel.id='shopPanel';shopPanel.className='ingame-jobs hidden';
 shopPanel.innerHTML='<div class="ingame-jobs-head"><b id="shopTitle">FRANKFURT LIFE / GESCHÄFT</b><button id="closeShop" aria-label="Schließen">×</button></div><h3 id="shopName">Geschäft</h3><p id="shopSubtitle" class="ingame-jobs-hint"></p><div id="shopProducts"></div><div id="shopMessage" role="status">Wähle etwas aus.</div><small>E oder ESC · Schließen</small>';
 viewport.appendChild(shopPanel);
 shopPanel.querySelector('#closeShop').addEventListener('click',()=>shopPanel.classList.add('hidden'));
}
function nearestShop(){
 if(!camera||driving)return null;
 let best=null,bestDistance=Infinity;
 for(const shop of shops){
  const distance=Math.hypot(camera.position.x-shop.x,camera.position.z-shop.z);
  if(distance<bestDistance){bestDistance=distance;best=shop;}
 }
 return bestDistance<8?best:null;
}
function toggleShop(){
 if(!started||!shopPanel)return;
 if(!shopPanel.classList.contains('hidden')){shopPanel.classList.add('hidden');currentShop=null;return;}
 const shop=nearestShop();
 if(!shop){status.textContent='GEHE NÄHER AN EIN GESCHÄFT · E ZUM ÖFFNEN';return;}
 currentShop=shop;
 shopPanel.querySelector('#shopTitle').textContent='FRANKFURT LIFE / '+shop.name;
 shopPanel.querySelector('#shopName').textContent=shop.name;
 shopPanel.querySelector('#shopSubtitle').textContent=shop.subtitle+' · Willkommen!';
 const products=shopPanel.querySelector('#shopProducts');products.replaceChildren();
 for(const item of shop.products){
  const button=document.createElement('button');button.className='ingame-job-choice';
  button.innerHTML='<b>'+item.name+' · '+item.price+' €</b><span>Im Geschäft kaufen</span>';
  button.addEventListener('click',()=>{
   const message=shopPanel.querySelector('#shopMessage');
   if(careerMoney<item.price){message.textContent='Dafür fehlt dir noch Geld. Erledige einen Auftrag mit J.';return;}
   careerMoney-=item.price;inventory[item.name]=(inventory[item.name]||0)+1;
   if(careerHud)careerHud.innerHTML='KONTO: '+careerMoney.toLocaleString('de-DE')+' €<br>AUFTRÄGE: '+completedJobs+'<br>INVENTAR: '+Object.values(inventory).reduce((a,b)=>a+b,0);
   message.textContent=item.name+' gekauft! Im Inventar: '+inventory[item.name];
  });
  products.appendChild(button);
 }
 shopPanel.querySelector('#shopMessage').textContent='Du bist bei '+shop.name+'.';
 shopPanel.classList.remove('hidden');document.exitPointerLock?.();
}
function createTraffic(){
 const trafficSpecs=[
  [0xb9c5d0,'hatch'],[0x253e59,'sedan'],[0xc6a83a,'hatch'],[0xeeeeea,'van'],[0x7b3034,'sportback'],
  [0x374d43,'coupe'],[0x8d969d,'sedan'],[0x1d2732,'hatch'],[0xe0e4e6,'van'],[0x5b6d84,'sportback'],
  [0x9d3030,'sedan'],[0x246f65,'hatch'],[0xd7dadd,'coupe'],[0x424b5c,'van'],[0xb4a06a,'sportback'],
  [0x2e4c70,'sedan'],[0x8c8d91,'hatch'],[0xeee7d9,'van'],[0x4c2835,'coupe'],[0x9aabbb,'sportback']
 ];
 for(let i=0;i<trafficSpecs.length;i++){
  const lane=i<10?-3.2:3.2,direction=i<10?1:-1;
  const [color,model]=trafficSpecs[i],slot=i%10;
  const car=makeCar(lane,-115+slot*17.2,color,false,model);
  car.rotation.y=direction===1?0:Math.PI;
  car.userData.traffic={direction,speed:.05+(i%5)*.009};
  trafficCars.push(car);
 }
}
function plazaLamp(x,z){
 const pole=new THREE.Mesh(new THREE.CylinderGeometry(.06,.1,4.6,8),new THREE.MeshStandardMaterial({color:0x34414a,metalness:.5,roughness:.45}));
 pole.position.set(x,2.3,z);scene.add(pole);
 const head=new THREE.Mesh(new THREE.BoxGeometry(.55,.16,.32),new THREE.MeshStandardMaterial({color:0xffe5a6,emissive:0x7b5424,emissiveIntensity:.55}));
 head.position.set(x,4.55,z);scene.add(head);
}
function createPedestrianDistrict(){
 const paving=new THREE.Mesh(new THREE.PlaneGeometry(20,164),new THREE.MeshStandardMaterial({color:0xb8b6ad,roughness:.94}));
 paving.rotation.x=-Math.PI/2;paving.position.set(32,-.005,-35);scene.add(paving);
 const edgeMat=new THREE.MeshStandardMaterial({color:0x747f83,roughness:.8});
 for(const x of [21.8,42.2]){
  const edge=new THREE.Mesh(new THREE.BoxGeometry(.35,.22,164),edgeMat);edge.position.set(x,.08,-35);scene.add(edge);
 }
 const tileMat=new THREE.MeshStandardMaterial({color:0x999e9c,roughness:.9});
 for(let z=-112;z<48;z+=8){
  const seam=new THREE.Mesh(new THREE.BoxGeometry(19.2,.025,.08),tileMat);seam.position.set(32,.018,z);scene.add(seam);
 }
 // Kleiner Stadtplatz mit Brunnen
 const square=new THREE.Mesh(new THREE.PlaneGeometry(27,24),new THREE.MeshStandardMaterial({color:0xc7c1b2,roughness:.9}));
 square.rotation.x=-Math.PI/2;square.position.set(31.5,.025,-48);scene.add(square);
 const basin=new THREE.Mesh(new THREE.CylinderGeometry(3.1,3.4,.55,24),new THREE.MeshStandardMaterial({color:0x777f82,roughness:.35,metalness:.35}));
 basin.position.set(31.5,.32,-48);scene.add(basin);
 const water=new THREE.Mesh(new THREE.CylinderGeometry(2.72,2.72,.12,24),new THREE.MeshStandardMaterial({color:0x55a8c0,roughness:.18,metalness:.25,transparent:true,opacity:.9}));
 water.position.set(31.5,.64,-48);scene.add(water);
 const jet=new THREE.Mesh(new THREE.CylinderGeometry(.12,.2,1.15,10),new THREE.MeshStandardMaterial({color:0x9db4bd,metalness:.55,roughness:.25}));
 jet.position.set(31.5,1.05,-48);scene.add(jet);
 for(const z of [-105,-82,-24,4,28]){
  for(const x of [24.5,39.5]){
   const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.14,.2,2,7),new THREE.MeshStandardMaterial({color:0x604a38}));
   trunk.position.set(x,1,z);scene.add(trunk);
   const crown=new THREE.Mesh(new THREE.SphereGeometry(1.25,9,7),new THREE.MeshStandardMaterial({color:0x477b58,roughness:.95}));
   crown.position.set(x,2.65,z);scene.add(crown);
  }
 }
 for(const z of [-92,-66,-30,0,25]){
  plazaLamp(22.8,z);plazaLamp(41.2,z);
 }
 // Sitzbänke entlang der Fußgängerzone
 for(const z of [-100,-72,-20,10]){
  for(const x of [26,37]){
   const seat=new THREE.Mesh(new THREE.BoxGeometry(2.1,.18,.62),new THREE.MeshStandardMaterial({color:0x805c3e,roughness:.8}));
   seat.position.set(x,.65,z);scene.add(seat);
   const legs=new THREE.Mesh(new THREE.BoxGeometry(1.8,.65,.12),edgeMat);legs.position.set(x,.34,z);scene.add(legs);
  }
 }
 // Kleine Poller markieren die autofreie Zone
 for(const z of [-114,-108,-2,4,42]){
  for(const x of [22.5,41.5]){
   const bollard=new THREE.Mesh(new THREE.CylinderGeometry(.13,.16,.8,8),new THREE.MeshStandardMaterial({color:0x283c4b,metalness:.45,roughness:.35}));
   bollard.position.set(x,.4,z);scene.add(bollard);
   const cap=new THREE.Mesh(new THREE.CylinderGeometry(.14,.14,.08,8),new THREE.MeshStandardMaterial({color:0xe0b85b,metalness:.25}));
   cap.position.set(x,.82,z);scene.add(cap);
  }
 }
 for(let i=0;i<14;i++){
  const x=25+(i%4)*4.2,z=-108+Math.floor(i/4)*36+(i%3)*3;
  makePedestrian(x,z,24+i);
 }
}
function makeCity(){
  scene=new THREE.Scene();scene.background=new THREE.Color(0x91b1c8);scene.fog=new THREE.Fog(0x91b1c8,115,390);
  camera=new THREE.PerspectiveCamera(68,viewport.clientWidth/viewport.clientHeight,.1,620);camera.position.set(0,2.1,14);
  flashlight=new THREE.SpotLight(0xddeeff,0,48,Math.PI/7,.42,1.35);
  flashlight.position.set(0,0,0);flashlightTarget=new THREE.Object3D();flashlightTarget.position.set(0,0,-1);
  camera.add(flashlight,flashlightTarget);flashlight.target=flashlightTarget;
  hemiLight=new THREE.HemisphereLight(0xd7ecff,0x4a5260,2);scene.add(hemiLight);
  sunLight=new THREE.DirectionalLight(0xffe0b4,1.5);sunLight.position.set(-25,45,25);sunLight.castShadow=false;scene.add(sunLight);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(560,560),new THREE.MeshLambertMaterial({color:0x58636b}));ground.rotation.x=-Math.PI/2;ground.position.y=-.12;scene.add(ground);
  const road=new THREE.Mesh(new THREE.PlaneGeometry(18,360),new THREE.MeshLambertMaterial({color:0x202a35}));road.rotation.x=-Math.PI/2;road.position.set(0,0,-45);scene.add(road);
  for(let z=-220;z<125;z+=12){const line=new THREE.Mesh(new THREE.PlaneGeometry(.18,5),new THREE.MeshBasicMaterial({color:0xe5dfc5}));line.rotation.x=-Math.PI/2;line.position.set(0,.015,z);scene.add(line);}
  const sidewalkMat=new THREE.MeshLambertMaterial({color:0x92999b});
  for(const x of [-9.2,9.2]){const s=new THREE.Mesh(new THREE.BoxGeometry(3.5,.25,360),sidewalkMat);s.position.set(x,.08,-45);scene.add(s);}
  const leftShops=new Map([[-87,['SUPERMARKT','MARKT · FRISCHE WAREN',0x3c966c]],[ -51,['BÄCKEREI','BROT · KAFFEE · KUCHEN',0xc58b43]],[ -15,['MODEHAUS','MODE FÜR JEDEN TAG',0x8a638e]],[21,['ELEKTRO','TECHNIK & ZUBEHÖR',0x397ca5]]]);
  const rightShops=new Map([[-94,['CAFÉ AM MAIN','KAFFEE · SNACKS',0x9b6547]],[ -58,['AUTOWELT','FAHRZEUGE & SERVICE',0x397a91]],[ -22,['SPORTTREFF','SPORT · OUTDOOR',0x62884f]],[14,['KIOSK 24','ZEITUNGEN · GETRÄNKE',0xb68a39]]]);
  for(let z=-105;z<35;z+=18){
    const left=leftShops.get(z);if(left)createShop(-15,z,-1,...left);else building(-15,z,8,12,12+Math.random()*22,0x6c7885);
    const rz=z-7,right=rightShops.get(rz);if(right)createShop(15,rz,1,...right);else building(15,rz,8,12,15+Math.random()*25,0x77828c);
  }
  // Wohnviertel mit Mehrfamilienhäusern, Balkonen und Hauseingängen
  const homeColors=[0xc5b9a5,0xb8c2c5,0xd1c3ae,0x9daeb4,0xc8b6a6,0xb4b9aa];
  for(let i=0;i<6;i++){
    const z=-96+i*25;
    residentialBuilding(-26.5,z,8.5,11,15+(i%3)*3,homeColors[i%homeColors.length]);
    residentialBuilding(45.5,z-7,8.5,11,17+((i+1)%3)*3,homeColors[(i+2)%homeColors.length]);
  }
  for(let i=0;i<7;i++)building(-42+i*14,-72,8,9,25+Math.random()*38,0x43576a);
  for(let z=-95;z<25;z+=14)for(const x of [-11,11])tree(x,z);
  for(let z=-105;z<35;z+=20)for(const x of [-10.4,10.4])streetLamp(x,z);
  makeCar(4,-8,0x1c354d,false,'sportback');
  makeCar(-3,-35,0xffffff,true,'sedan');
  createTraffic();
  // Erweiterte Stadt: zusätzliche Wohn- und Geschäftsquartiere, Nebenstraßen und Plätze.
  const sideRoadMat=new THREE.MeshStandardMaterial({color:0x29333d,roughness:.96});
  const sideWalkMat=new THREE.MeshStandardMaterial({color:0x92999b,roughness:.9});
  for(const x of [-82,-48,48,82]){
    const avenue=new THREE.Mesh(new THREE.PlaneGeometry(11,340),sideRoadMat);
    avenue.rotation.x=-Math.PI/2;avenue.position.set(x,.005,-45);scene.add(avenue);
    for(const sx of [x-7.5,x+7.5]){
      const pavement=new THREE.Mesh(new THREE.BoxGeometry(3,.2,340),sideWalkMat);
      pavement.position.set(sx,.06,-45);scene.add(pavement);
    }
  }
  for(let z=-190;z<=95;z+=38){
    const cross=new THREE.Mesh(new THREE.PlaneGeometry(190,9),sideRoadMat);
    cross.rotation.x=-Math.PI/2;cross.position.set(0,.012,z);scene.add(cross);
    for(const x of [-96,-66,-30,30,66,96]){
      const h=18+((Math.abs(Math.floor(z/38))+Math.abs(Math.floor(x/30)))%5)*7;
      const palette=[0xb7b2a7,0x8c9da5,0xc2b59f,0x697c89,0xa6b0ad];
      if(Math.abs(x)>40){
        residentialBuilding(x,z+12,12,14,h,palette[(Math.floor(Math.abs(x)/30)+Math.floor(Math.abs(z)/38))%palette.length]);
      }else{
        building(x,z+12,12,14,h,palette[(Math.floor(Math.abs(x)/30)+Math.floor(Math.abs(z)/38))%palette.length]);
      }
    }
    for(const x of [-55,-20,20,55])tree(x,z+5);
  }
  for(let z=-190;z<110;z+=26){
    for(const x of [-103,-61,61,103])streetLamp(x,z);
  }
  createPedestrianDistrict();
  for(let i=0;i<24;i++){
    const side=i%2===0?-1:1;
    makePedestrian(side*(9.1+(i%4)*.38),-108+(i*9.7)%128,i);
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
    // Der östliche Stadtplatz ist autofrei; Fahrzeuge bleiben auf den Straßen.
    if(jobCar.position.x>22&&jobCar.position.z>-118&&jobCar.position.z<48)jobCar.position.x=22;
    jobCar.position.x=Math.max(-112,Math.min(112,jobCar.position.x));
    jobCar.position.z=Math.max(-220,Math.min(120,jobCar.position.z));
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
    camera.position.x=Math.max(-112,Math.min(112,camera.position.x));
    camera.position.z=Math.max(-220,Math.min(120,camera.position.z));
    camera.position.y=2.1;
  }
  camera.rotation.order='YXZ';camera.rotation.set(pitch,yaw,0);
  coords.textContent=(driving?'FAHRZEUG ':'POSITION ')+Math.round(camera.position.x)+' / '+Math.round(camera.position.z)+(jobActive&&jobDestination?' · ZIEL '+Math.round((driving?jobCar.position:camera.position).distanceTo(jobDestination))+' M':'');
}
function toggleFlashlight(){
  if(!flashlight)return;
  flashlightOn=!flashlightOn;flashlight.intensity=flashlightOn?3.2:0;
  status.textContent=flashlightOn?'TASCHENLAMPE AN · L ZUM AUSSCHALTEN':'TASCHENLAMPE AUS · L ZUM EINSCHALTEN';
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
    renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1));
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    renderer.shadowMap.enabled=false;
    sunLight=null;hemiLight=null;
    makeCity();buildInGameJobs();buildShopInteraction();applyQuality();viewport.appendChild(renderer.domElement);resize();loop();
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
document.addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='KeyE'&&!e.repeat)toggleShop();if(e.code==='KeyF'&&!e.repeat)toggleVehicle();if(e.code==='KeyJ'&&!e.repeat)toggleJobs();if(e.code==='KeyL'&&!e.repeat)toggleFlashlight();if(e.code==='Escape'&&jobPanel&&!jobPanel.classList.contains('hidden'))jobPanel.classList.add('hidden');if(e.code==='Escape'&&shopPanel&&!shopPanel.classList.contains('hidden'))shopPanel.classList.add('hidden');if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();});
document.addEventListener('keyup',e=>keys[e.code]=false);
window.addEventListener('resize',resize);
