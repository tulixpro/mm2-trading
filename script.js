const editionParam=new URLSearchParams(location.search).get('edition');
const classicEdition=editionParam==='sanandreas'||editionParam==='classic';
if(classicEdition){document.body.classList.add('classic-edition');document.title='Frankfurt Life San Andreas – Retro-3D';}else{document.body.classList.add('modern-edition');document.title='Frankfurt Life 3D – Moderne Edition';}
const THREE = await import('./node_modules/three/build/three.module.js').catch(()=>import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js'));

let deferredInstallPrompt=null;
const installAppButton=document.querySelector('#installApp');
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredInstallPrompt=event;if(installAppButton)installAppButton.hidden=false;});
installAppButton?.addEventListener('click',async()=>{if(deferredInstallPrompt){deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;}else{status.textContent='INSTALLATION: CHROME-MENÜ → ZUM STARTBILDSCHIRM HINZUFÜGEN';}});
window.addEventListener('appinstalled',()=>{if(installAppButton)installAppButton.textContent='APP INSTALLIERT';});
const startButton=document.querySelector('#startGame');
const placeholder=document.querySelector('.game-placeholder');
const viewport=document.querySelector('#gameViewport');
const status=document.querySelector('#gameStatus');
const coords=document.querySelector('#coords');
const qualitySelect=document.querySelector('#qualitySelect');
if(classicEdition&&qualitySelect){qualitySelect.value='legacy';qualitySelect.disabled=true;const label=qualitySelect.closest('label');if(label)label.firstChild.textContent='SAN-ANDREAS-GRAFIK ';}
const fpsSelect=document.querySelector('#fpsSelect');
const mouseSelect=document.querySelector('#mouseSelect');
const fovSelect=document.querySelector('#fovSelect');
let maxFps=60,lastFrame=0;
let perfHud=null,perfFrames=[],perfLastCheck=0,autoResolutionScale=1,perfHudTimer=0;
const legacyMode=new URLSearchParams(location.search).get('legacy')==='1';
const cpuCores=navigator.hardwareConcurrency||4;
const memoryGb=navigator.deviceMemory||8;
const lowEndDevice=legacyMode||cpuCores<=4||memoryGb<=4;
const liteMode=classicEdition||lowEndDevice;
const performanceTier=lowEndDevice?'balanced':'full';
let performanceFrame=0;
const qualitySettings={
 minimum:{pixelRatio:.34,shadows:false,fog:92,exposure:.84,ambient:1.35,label:'ULTRA-SPARMODUS'},
 legacy:{pixelRatio:.58,shadows:false,fog:135,exposure:.94,ambient:1.55,label:'RETRO-3D'},
 low:{pixelRatio:.5,shadows:false,fog:118,exposure:.92,ambient:1.55,label:'NIEDRIG'},
 medium:{pixelRatio:.84,shadows:false,fog:180,exposure:1.02,ambient:1.85,label:'MITTEL'},
 high:{pixelRatio:1,shadows:true,shadowMapSize:1536,fog:245,exposure:1.08,ambient:1.75,label:'HOCH · ECHTZEIT-SCHATTEN'},
 maximum:{pixelRatio:1.15,shadows:true,shadowMapSize:2048,fog:270,exposure:1.1,ambient:1.65,label:'MAXIMAL · 2K-SCHATTEN'},
 ultra:{pixelRatio:1.45,shadows:true,shadowMapSize:4096,fog:340,exposure:1.12,ambient:1.55,label:'ULTRA · 4K-SCHATTEN'},
 advanced:{pixelRatio:1.05,shadows:true,shadowMapSize:2048,fog:250,exposure:1.08,ambient:1.7,label:'ERWEITERT · 2K-SCHATTEN'}
};
let sunLight=null,hemiLight=null,flashlight=null,flashlightTarget=null,flashlightOn=false;
function applyQuality(){
 if(!renderer||!scene)return;
 const mode=qualitySelect?.value||'medium',q=qualitySettings[mode]||qualitySettings.medium;
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,(classicEdition?Math.min(q.pixelRatio,.58):q.pixelRatio)*autoResolutionScale));
 renderer.shadowMap.enabled=classicEdition?false:q.shadows;
 renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.shadowMap.autoUpdate=true;
 renderer.toneMappingExposure=classicEdition?.92:q.exposure;
 if(scene.fog)scene.fog.far=classicEdition?125:q.fog;
 if(sunLight){sunLight.intensity=classicEdition?1.2:mode==='minimum'?1.0:mode==='legacy'?1.15:mode==='low'?1.25:mode==='medium'?1.55:mode==='high'?1.9:mode==='ultra'?2.15:2.05;sunLight.castShadow=q.shadows;const shadowResolution=q.shadowMapSize||1024;sunLight.shadow.mapSize.set(shadowResolution,shadowResolution);sunLight.shadow.camera.left=-65;sunLight.shadow.camera.right=65;sunLight.shadow.camera.top=65;sunLight.shadow.camera.bottom=-65;sunLight.shadow.camera.near=1;sunLight.shadow.camera.far=140;sunLight.shadow.camera.updateProjectionMatrix();}
 if(hemiLight)hemiLight.intensity=q.ambient;
 scene.traverse(obj=>{if(obj.isMesh){obj.castShadow=q.shadows;obj.receiveShadow=q.shadows;}});
 const hint=document.querySelector('#graphicsHint')||document.querySelector('#qualityStatus');
 if(hint)hint.textContent=classicEdition?'SAN ANDREAS RETRO-3D · SPEICHERSPARMODUS':'Grafik: '+q.label+' · '+(q.shadows?'Schatten AN':'Schatten AUS');
 if(viewport)viewport.dataset.graphics=mode;
 resize();
}
qualitySelect?.addEventListener('change',()=>{autoResolutionScale=1;localStorage.setItem('flQuality',qualitySelect.value);applyQuality();});
fpsSelect?.addEventListener('change',()=>{maxFps=fpsSelect.value==='unlimited'?0:Number(fpsSelect.value);localStorage.setItem('flFps',fpsSelect.value);});
mouseSelect?.addEventListener('change',()=>{mouseSensitivity=Number(mouseSelect.value)||1;localStorage.setItem('flMouse',mouseSelect.value);});
fovSelect?.addEventListener('change',()=>{cameraFov=Number(fovSelect.value)||68;localStorage.setItem('flFov',fovSelect.value);if(camera){camera.fov=cameraFov;camera.updateProjectionMatrix();}});
const cameraSelect=document.querySelector('#cameraSelect');
cameraSelect?.addEventListener('change',()=>{cameraMode=cameraSelect.value||'follow';localStorage.setItem('flCamera',cameraMode);status.textContent='KAMERA: '+({follow:'VERFOLGER',close:'NAH',hood:'MOTORHAUBE',ego:'EGO-PERSPEKTIVE'}[cameraMode]||'VERFOLGER');});
let renderer,scene,camera,raf,started=false,yaw=0,pitch=0,locked=false;
const keys={};
const keyboardKeys={};
const pedestrians=[];
const policeCars=[];
const trafficCars=[];
const airportBuses=[];
const airportHelicopters=[];
const militaryEscorts=[];
const boats=[];let activeBoat=null,boatSpeed=0,boatHeading=0,waterSurface=null,beachFoam=[];
let airportPlane=null,planeFlying=false,planeSpeed=0,planeHeading=0,planeAltitude=0;
let takeoverTarget=null,takeoverProgress=0,takeoverHud=null,takeoverActor=null,shopSceneOverlay=null,shopScene=null;
let pausePanel=null,gamePaused=false;
const actionEdition=new URLSearchParams(location.search).get('edition')==='action';
if(actionEdition){document.body.classList.add('action-edition');document.title='Frankfurt Life Action – Spiel';}
const taxiVehicles=[];
const streetLights=[];
const shops=[];
const inventory={Kaffee:0,Snack:0,Stadtplan:0,Brot:0,Brezel:0,Croissant:0,Kuchen:0};
let miniMapCanvas=null,miniMapCtx=null,tuningLevel=0,paintLevel=0,turboLevel=0,tuningMods={spoiler:false,lowered:false,tinted:false,rims:false},mouseSensitivity=1,cameraFov=68;
let appetite=65;
let invertCameraY=localStorage.getItem('flInvertY')==='on';
let cameraMode='follow',cutscene=null,cutsceneOverlay=null,cutsceneElapsed=0,introTutorial=null;
let shopPanel=null,currentShop=null;
const clock=new THREE.Clock();
let missionHud=null,jobStops=[],jobStopIndex=0;

// FRANKFURT MOBILE – Smartphone mit Homescreen und animierten App-Seiten
let phonePanel=null,phonePage='home';
const ownedCars=['golf'];
const dealerCars=[
 {id:'golf',name:'City Compact',model:'hatch',color:0xb51e2b,price:0,desc:'Zuverlässig für den Alltag.'},
 {id:'mercedes',name:'Business Sedan',model:'sedan',color:0x9f101d,price:1800,desc:'Komfort für lange Strecken.'},
 {id:'audi',name:'E-Sportback',model:'sportback',color:0xc72d24,price:3200,desc:'Sportlich und modern.'},
 {id:'alpina',name:'Luxury Coupé',model:'coupe',color:0x075b45,price:5200,desc:'Elegantes Oberklasse-Coupé.'},
 {id:'super',name:'Super Sport',model:'super',color:0xd7ed12,price:9500,desc:'Für schnelle Ausfahrten.'},
 {id:'van',name:'Cargo Van',model:'van',color:0xe6e8e8,price:2400,desc:'Viel Platz für Transportjobs.'},
 {id:'bmw-xm-label',name:'XM Label · 748 PS',model:'suv',color:0x263b35,price:185000,performance:{top:250,power:1.58},desc:'Großes Performance-SUV · 748 PS · prozedurales Platzhaltermodell, kein Original-3D-Scan.'},
 {id:'bmw-m3-touring',name:'BMW M3 Competition Touring · 530 PS',model:'sedan',color:0x1c3548,price:118000,performance:{top:250,power:1.42},desc:'530 PS · 650 Nm · 0–100 km/h: 3,6 s · generische Platzhalter-Karosserie, kein lizenziertes BMW-3D-Modell.'},
 {id:'porsche-911-gts',name:'Porsche 911 Carrera GTS · 541 PS',model:'super',color:0x8f171d,price:165000,performance:{top:312,power:1.5},desc:'541 PS Systemleistung · 610 Nm Systemdrehmoment · 0–100 km/h: 3,0 s · generische Platzhalter-Karosserie, kein lizenziertes Porsche-3D-Modell.'}
];
let dealerPanel=null,dealership={x:-28,z:82,name:'Frankfurt Motors'};
/* 0.2.9 gameplay systems */
let flFuel=100,flGameHour=12,flWeather='Klar',flWeatherTimer=0,flSaveTimer=0,flHomeOwned=false,flHomeFurniture=0,flOutfit=0,flTransitTrips=0,flDailyJobs=0,flDailyRides=0,flDailyClaimed=false,flDailyDate='';
let flWeatherLabel=null,flFuelLabel=null,flLightingStep=-1,flStatusTimer=0;
let flRainPoints=null,flRainPositions=null,flWetRoadMaterials=[],flRunoffMeshes=[],flPuddleMeshes=[];
function flSaveGame(showMessage=false){try{localStorage.setItem('frankfurtLifeSave',JSON.stringify({version:1,money:careerMoney,jobs:completedJobs,position:camera?{x:camera.position.x,z:camera.position.z}:null,ownedCars,inventory,appetite,tuningLevel,paintLevel,fuel:flFuel,hour:flGameHour,weather:flWeather,homeOwned:flHomeOwned,homeFurniture:flHomeFurniture,outfit:flOutfit,transitTrips:flTransitTrips,dailyJobs:flDailyJobs,dailyRides:flDailyRides,dailyClaimed:flDailyClaimed,dailyDate:flDailyDate,vehicleDamage:damageLevel,bankHistory:flBankHistory,turboLevel,tuningMods}));if(showMessage&&status)status.textContent='SPIELSTAND GESPEICHERT';}catch(_){if(showMessage&&status)status.textContent='SPEICHERN NICHT VERFÜGBAR';}}
function flLoadGame(){try{const d=JSON.parse(localStorage.getItem('frankfurtLifeSave')||'null');if(!d||d.version!==1)return;careerMoney=Math.max(0,Number(d.money)||0);completedJobs=Math.max(0,Number(d.jobs)||0);if(Array.isArray(d.bankHistory))flBankHistory=d.bankHistory.slice(0,12);if(Array.isArray(d.ownedCars))ownedCars.splice(0,ownedCars.length,...d.ownedCars.filter(id=>dealerCars.some(c=>c.id===id)));if(d.inventory&&typeof d.inventory==='object')Object.assign(inventory,d.inventory);appetite=Number.isFinite(Number(d.appetite))?Math.max(0,Math.min(100,Number(d.appetite))):65;tuningLevel=Math.max(0,Math.min(3,Number(d.tuningLevel)||0));paintLevel=Math.max(0,Number(d.paintLevel)||0);turboLevel=Math.max(0,Math.min(2,Number(d.turboLevel)||0));if(d.tuningMods&&typeof d.tuningMods==='object')tuningMods={...tuningMods,...d.tuningMods};flFuel=Number.isFinite(Number(d.fuel))?Math.max(0,Math.min(100,Number(d.fuel))):100;flGameHour=Number.isFinite(d.hour)?d.hour:12;flWeather=['Klar','Bewölkt','Regen','Nebel'].includes(d.weather)?d.weather:'Klar';flHomeOwned=!!d.homeOwned;flHomeFurniture=Math.max(0,Number(d.homeFurniture)||0);flOutfit=Math.max(0,Number(d.outfit)||0);flTransitTrips=Math.max(0,Number(d.transitTrips)||0);flDailyJobs=Math.max(0,Number(d.dailyJobs)||0);flDailyRides=Math.max(0,Number(d.dailyRides)||0);flDailyClaimed=!!d.dailyClaimed;flDailyDate=typeof d.dailyDate==='string'?d.dailyDate:'';flSavedDamage=Math.max(0,Math.min(4,Number(d.vehicleDamage)||0));flCheckDailyDate();if(d.position&&camera)camera.position.set(Number.isFinite(Number(d.position.x))?Number(d.position.x):0,2.1,Number.isFinite(Number(d.position.z))?Number(d.position.z):14);if(careerHud)flRefreshCareerHud();}catch(_){}}

function flCheckDailyDate(){const today=new Date().toLocaleDateString('en-CA');if(flDailyDate!==today){flDailyDate=today;flDailyJobs=0;flDailyRides=0;flDailyClaimed=false;}}
function flClaimDaily(){flCheckDailyDate();if(flDailyClaimed){status.textContent='TAGESBONUS BEREITS ABGEHOLT';return;}if(flDailyJobs<1||flDailyRides<1){status.textContent='ERLEDIGE BEIDE TAGESZIELE ZUERST';openPhoneApp('daily');return;}flDailyClaimed=true;careerMoney+=250;if(careerHud)flRefreshCareerHud();flSaveGame();status.textContent='TAGESBONUS · +250 €';openPhoneApp('daily');}

function flBuildStatus(){flWeatherLabel=document.createElement('div');flWeatherLabel.style.cssText='position:absolute;left:16px;top:16px;z-index:8;padding:7px 10px;border:1px solid #ffffff35;border-radius:8px;background:#101b2ddd;color:#eaf6ff;font:700 11px system-ui;pointer-events:none';viewport.appendChild(flWeatherLabel);flFuelLabel=document.createElement('div');flFuelLabel.style.cssText='position:absolute;left:16px;top:52px;z-index:8;padding:7px 10px;border:1px solid #ffffff35;border-radius:8px;background:#101b2ddd;color:#eaf6ff;font:700 11px system-ui;pointer-events:none';viewport.appendChild(flFuelLabel);flUpdateStatus();}
function flUpdateStatus(){if(flWeatherLabel)flWeatherLabel.textContent='🕒 '+String(Math.floor(flGameHour)).padStart(2,'0')+':'+String(Math.floor(flGameHour%1*60)).padStart(2,'0')+' · '+flWeather;if(flFuelLabel)flFuelLabel.textContent='⛽ TANK: '+Math.round(flFuel)+'%';}
function flApplyWeather(){if(!scene||!sunLight||!hemiLight)return;const wet=flWeather==='Regen';for(const mat of flWetRoadMaterials){mat.opacity=wet?.34:0;mat.needsUpdate=true;}if(flRainPoints)flRainPoints.visible=wet;const night=flGameHour<6||flGameHour>20,daylight=Math.max(.18,Math.sin((flGameHour-6)/14*Math.PI)),factor=flWeather==='Regen'?.62:flWeather==='Nebel'?.72:flWeather==='Bewölkt'?.82:1;sunLight.intensity=(night?.22:.55+daylight*1.25)*factor;sunLight.color.setHex(night?0x9bb8e8:classicEdition?(flWeather==='Regen'?0xc5a77d:0xffc078):(flWeather==='Regen'?0xaabbd0:0xffe0b4));hemiLight.intensity=(night?.65:1.1+daylight*.85)*factor;const color=night?0x17283d:classicEdition?(flWeather==='Nebel'?0xa99b80:flWeather==='Regen'?0x8c806b:flWeather==='Bewölkt'?0xa69778:0xb99a70):(flWeather==='Nebel'?0xaab6bc:flWeather==='Regen'?0x71899a:flWeather==='Bewölkt'?0x91a2ad:0x91b1c8);scene.background.setHex(color);if(scene.fog)scene.fog.color.setHex(color);}
function flAddWetRoad(width,length,x,z){
  const mat=new THREE.MeshPhongMaterial({color:0x526574,transparent:true,opacity:0,shininess:105,specular:0x8fa8bb,depthWrite:false});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,length),mat);mesh.rotation.x=-Math.PI/2;mesh.position.set(x,.018,z);scene.add(mesh);flWetRoadMaterials.push(mat);
}
function flCreateWeatherEffects(){
  if(!scene||flRainPoints)return;
  const count=liteMode?70:190;flRainPositions=new Float32Array(count*6);
  for(let i=0;i<count;i++){const k=i*6;flRainPositions[k]=(Math.random()-.5)*46;flRainPositions[k+1]=Math.random()*24;flRainPositions[k+2]=(Math.random()-.5)*58;flRainPositions[k+3]=flRainPositions[k]+.12;flRainPositions[k+4]=flRainPositions[k+1]-.62;flRainPositions[k+5]=flRainPositions[k+2]+.05;}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(flRainPositions,3));
  const material=new THREE.LineBasicMaterial({color:0xc7e4f4,transparent:true,opacity:.48,depthWrite:false});
  flRainPoints=new THREE.LineSegments(geometry,material);flRainPoints.visible=flWeather==='Regen';scene.add(flRainPoints);
}
function flUpdateRain(dt){
  if(!camera)return;
  const wet=flWeather==='Regen';
  if(flRainPoints&&wet){
    const p=flRainPoints.geometry.attributes.position.array;
    for(let i=0;i<p.length;i+=6){p[i+1]-=dt*22;p[i+4]-=dt*22;if(p[i+1]<0){p[i]=camera.position.x+(Math.random()-.5)*46;p[i+1]=18+Math.random()*8;p[i+2]=camera.position.z+(Math.random()-.5)*58;p[i+3]=p[i]+.12;p[i+4]=p[i+1]-.62;p[i+5]=p[i+2]+.05;}}
    flRainPoints.geometry.attributes.position.needsUpdate=true;
  }
  const t=clock.elapsedTime;
  for(let i=0;i<flRunoffMeshes.length;i++){
    const item=flRunoffMeshes[i],phase=(t*item.speed+item.offset)%1;
    item.mesh.position.z=item.startZ+phase*item.length;
    item.mesh.material.opacity=wet?(0.16+Math.sin(t*3+i)*.07):0;
  }
  for(let i=0;i<flPuddleMeshes.length;i++){
    const item=flPuddleMeshes[i];
    item.mesh.material.opacity=wet?(item.opacity*(.88+Math.sin(t*1.7+i)*.12)):0;
    item.ripple.material.opacity=wet?(0.12+Math.sin(t*2.2+i)*.09):0;
    const scale=1+Math.sin(t*1.5+i)*.08;item.ripple.scale.set(scale,scale,1);
  }
}
function flBuyHome(){if(flHomeOwned){status.textContent='DU HAST BEREITS EINE WOHNUNG';return;}if(careerMoney<800){status.textContent='DU BENÖTIGST 800 € FÜR DIE ERSTE MIETE';return;}careerMoney-=800;flHomeOwned=true;flSaveGame();if(careerHud)careerHud.innerHTML='KONTO: '+careerMoney.toLocaleString('de-DE')+' €<br>AUFTRÄGE: '+completedJobs;status.textContent='WOHNUNG GEMIETET · 800 € KAUTION';openPhoneApp('housing');}
function flGoHome(){if(!flHomeOwned){flBuyHome();return;}if(driving){status.textContent='STEIGE ZUERST AUS';return;}camera.position.set(-26.5,2.1,-96);status.textContent='ZU HAUSE · WESTEND-WOHNUNG';phonePanel?.classList.add('hidden');}
function flBuyFurniture(){if(!flHomeOwned||careerMoney<180){status.textContent='MIETE ZUERST EINE WOHNUNG ODER SAMMLE 180 €';return;}careerMoney-=180;flHomeFurniture++;flSaveGame();status.textContent='MÖBEL GEKAUFT · AUSSTATTUNG '+flHomeFurniture;openPhoneApp('housing');}
function flChangeOutfit(){flOutfit=(flOutfit+1)%6;const person=pedestrians[0],palette=[0x345b80,0x8c5747,0x526c54,0x454b59,0xb18b4d,0x6c557f];if(person?.userData?.torso?.material?.color)person.userData.torso.material.color.setHex(palette[flOutfit]);status.textContent='OUTFIT-VORSCHAU GEWECHSELT · STIL '+(flOutfit+1);flSaveGame();openPhoneApp('customize');}
function flTransitRide(){if(driving){status.textContent='STEIGE ZUERST AUS, UM ÖPNV ZU NUTZEN';return;}const stops=[{x:82,z:-245,name:'Flughafen'},{x:13,z:-72,name:'Innenstadt'},{x:-26,z:-96,name:'Wohnviertel'},{x:145,z:-145,name:'Ostend'},{x:-145,z:165,name:'Südquartier'}],stop=stops[flTransitTrips%stops.length];camera.position.set(stop.x,2.1,stop.z);flTransitTrips++;flCheckDailyDate();flDailyRides++;status.textContent='ÖPNV · ANGEKOMMEN: '+stop.name;flSaveGame();openPhoneApp('transit');}
function flUpdateSystems(dt){flGameHour=(flGameHour+dt*.075)%24;flWeatherTimer+=dt;flSaveTimer+=dt;flStatusTimer+=dt;if(flWeatherTimer>150){flWeatherTimer=0;const choices=['Klar','Bewölkt','Regen','Nebel'];flWeather=choices[(choices.indexOf(flWeather)+1+Math.floor(Math.random()*3))%choices.length];flApplyWeather();}if(driving&&Math.abs(carSpeed)>.02)flFuel=Math.max(0,flFuel-dt*.012*Math.max(1,Math.abs(carSpeed)*8));if(driving&&flFuel<=0){carSpeed=0;status.textContent='TANK LEER · FAHRE ZUR TANKSTELLE';}if(flSaveTimer>20){flSaveTimer=0;flSaveGame();}const lightStep=Math.floor(flGameHour*4);if(lightStep!==flLightingStep){flLightingStep=lightStep;flApplyWeather();}if(flStatusTimer>.25){flStatusTimer=0;flUpdateStatus();}}


function flCallTaxi(){
 if(driving){status.textContent='STEIGE ZUERST AUS, UM EIN TAXI ZU RUFEN';return;}
 if(taxiVehicles.length){status.textContent='DEIN TAXI IST BEREITS UNTERWEGS';return;}
 const angle=yaw;
 const spawn=new THREE.Vector3(camera.position.x+Math.sin(angle)*42,0,camera.position.z+Math.cos(angle)*42);
 const taxi=makeCar(spawn.x,spawn.z,0xf0c928,false,'sedan');
 taxi.rotation.y=Math.atan2(camera.position.x-spawn.x,camera.position.z-spawn.z);
 taxi.userData.isTaxi=true;
 taxiVehicles.push({group:taxi,state:'approach',speed:.16});
 status.textContent='TAXI BESTELLT · FAHRER IST UNTERWEGS';
 phonePanel?.classList.add('hidden');
}

function buildPhone(){
 phonePanel=document.createElement('section');phonePanel.id='phonePanel';phonePanel.className='phone-overlay hidden';
 phonePanel.innerHTML='<div class="phone-device"><div class="phone-notch"></div><div class="phone-status"><span>● FRANKFURT MOBILE</span><span>5G ▰ 100%</span></div><div class="phone-clock" id="phoneClock">12:00</div><div class="phone-date">SAMSTAG · FRANKFURT AM MAIN</div><div class="phone-appgrid" id="phoneApps"></div><div class="phone-page hidden" id="phonePage"></div><div class="phone-dock"><button data-open="map">⌖<small>Karte</small></button><button data-open="jobs">▣<small>Jobs</small></button><button data-open="garage">🚘<small>Garage</small></button><button data-open="bank">€<small>Bank</small></button></div><button class="phone-home" id="phoneHome" aria-label="Startbildschirm"></button><button class="phone-exit" id="phoneExit">Schließen ×</button></div>';
 viewport.appendChild(phonePanel);
 buildQuickAccessWheel();
 phonePanel.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>openPhoneApp(b.dataset.open)));
 phonePanel.querySelector('#phoneHome').addEventListener('click',()=>showPhoneHome());
 phonePanel.querySelector('#phoneExit').addEventListener('click',()=>phonePanel.classList.add('hidden'));
 showPhoneHome();
}
function showPhoneHome(){
 const clockEl=phonePanel?.querySelector('#phoneClock');
 const dateEl=phonePanel?.querySelector('.phone-date');
 if(clockEl&&dateEl){const now=new Date();clockEl.textContent=now.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'});dateEl.textContent=now.toLocaleDateString('de-DE',{weekday:'long',day:'2-digit',month:'long'}).toUpperCase()+' · FRANKFURT AM MAIN';}
 phonePage='home';const grid=phonePanel.querySelector('#phoneApps'),page=phonePanel.querySelector('#phonePage');
 page.classList.add('hidden');grid.classList.remove('hidden');
 const apps=[['map','🗺️','Karte'],['jobs','💼','Missionen'],['bank','🏦','Bank'],['garage','🚘','Garage'],['housing','🏠','Wohnen'],['transit','🚋','ÖPNV'],['news','📰','News'],['camera','📷','Kamera'],['services','🛠️','Service'],['settings','⚙️','Einstellungen'],['inventory','🎒','Inventar'],['customize','👕','Outfit'],['daily','🎯','Tagesziele'],['save','💾','Speichern'],['help','❔','Hilfe'],['dealer','🚗','Autohändler'],['taxi','🚕','Taxi rufen']];
 grid.innerHTML=apps.map(a=>'<button class="phone-app" data-app="'+a[0]+'"><b>'+a[1]+'</b><span>'+a[2]+'</span></button>').join('');
 grid.querySelectorAll('[data-app]').forEach(b=>b.addEventListener('click',()=>openPhoneApp(b.dataset.app)));
}
function openPhoneApp(app){
 if(!phonePanel)return;
 phonePage=app;const grid=phonePanel.querySelector('#phoneApps'),page=phonePanel.querySelector('#phonePage');
 grid.classList.add('hidden');page.classList.remove('hidden');
 const pos=camera?Math.round(camera.position.x)+' / '+Math.round(camera.position.z):'–';
 const pages={
 map:'<div class="phone-page-head">Frankfurt · Stadtkarte</div><div class="phone-map-tools"><span>● GPS LIVE</span><button data-action="recenter">Zentrieren</button></div><div class="phone-map phone-map-large"><canvas id="phoneMapCanvas" width="720" height="1040"></canvas></div><div class="phone-map-legend"><span>● Du</span><span>● Geschäfte</span><span>■ Autohaus</span><span>● Missionsziel</span></div><p>GPS-Position: '+pos+' · Stadtgebiet 360 × 660 m</p>',
 jobs:'<div class="phone-page-head">Missionen</div><div class="phone-stat">Aktive Aufträge <b>'+(jobActive?'1':'0')+'</b></div><div class="phone-stat">Erledigt <b>'+completedJobs+'</b></div><p>Öffne die Jobzentrale und wähle deinen nächsten Auftrag.</p><button data-action="jobs">Jobzentrale öffnen</button>',
 bank:'<div class="phone-page-head">🏦 Frankfurt Bank <small>SPIELKONTO</small></div><div class="phone-bank-card"><small>VERFÜGBARES GUTHABEN</small><strong>'+careerMoney.toLocaleString('de-DE')+' €</strong><span>FRANKFURT LIFE · VIRTUELLES KONTO</span></div><div class="phone-stat">Abgeschlossene Missionen <b>'+completedJobs+'</b></div><h4>Geld senden</h4><label class="bank-field">Empfänger<select id="bankRecipient"><option>Mia Becker</option><option>Jonas Weber</option><option>Lena Fischer</option><option>Tom Schneider</option><option>Stadtkasse</option></select></label><label class="bank-field">Betrag in Spiel-Euro<input id="bankAmount" type="number" min="1" max="5000" step="1" placeholder="z. B. 100"></label><button class="bank-send" data-action="bankSend">Überweisung ausführen</button><p class="bank-note">Nur Spielgeld – keine echten Zahlungen.</p><h4>Letzte Überweisungen</h4>'+(flBankHistory.length?flBankHistory.map(t=>'<div class="phone-stat"><span>'+t.recipient+'<small>'+t.time+'</small></span><b>−'+t.amount.toLocaleString('de-DE')+' €</b></div>').join(''):'<p>Noch keine Überweisungen.</p>'),
 garage:'<div class="phone-page-head">Meine Garage</div><p>Eigene Fahrzeuge: '+ownedCars.length+'</p>'+ownedCars.map(id=>'<div class="phone-stat">'+(dealerCars.find(v=>v.id===id)?.name||id)+' <b>✓</b></div>').join('')+'<button data-action="dealer">Autohändler öffnen</button>',
 taxi:'<div class="phone-page-head">Taxi-Service</div><p>Bestelle ein Taxi zu deinem aktuellen Standort. Das Taxi fährt im Spiel zu dir.</p><button data-action="taxi">Taxi bestellen</button>',
 dealer:'<div class="phone-page-head">Frankfurt Motors</div><p>Fahrzeuge ansehen und kaufen – besuche auch den Showroom in der Stadt.</p><button data-action="dealer">Showroom öffnen</button>',
 inventory:'<div class="phone-page-head">Inventar & Essen</div><div class="phone-stat">Sättigung <b>'+appetite+'%</b></div>'+['Brot','Brezel','Croissant','Kuchen','Kaffee','Snack','Pizza','Pasta','Limo','Burger-Menü','Schnitzel','Salat','Cola'].map(name=>'<div class="phone-stat"><span>'+name+' · '+(inventory[name]||0)+'</span><button data-eat="'+name+'">Verzehren</button></div>').join(''),
 housing:'<div class="phone-page-head">Meine Wohnung</div><div class="phone-stat">Status <b>'+(flHomeOwned?'Gemietet':'Noch keine Wohnung')+'</b></div><div class="phone-stat">Möbel <b>'+flHomeFurniture+'</b></div><p>Miete deine erste Wohnung im Westend und ergänze nach und nach Möbel.</p><button data-action="homebuy">'+(flHomeOwned?'Wohnung gemietet':'Wohnung mieten · 800 €')+'</button><button data-action="gohome">Nach Hause fahren</button><button data-action="furniture">Möbel kaufen · 180 €</button>',
 transit:'<div class="phone-page-head">Frankfurt ÖPNV</div><div class="phone-stat">Linie 1 <b>Innenstadt</b></div><div class="phone-stat">Flughafen-Express <b>Airport</b></div><div class="phone-stat">Linie 2 <b>Westend – Ostend</b></div><div class="phone-stat">Fahrten <b>'+flTransitTrips+'</b></div><p>Wähle eine Haltestelle und fahre zum nächsten Stadtteil.</p><button data-action="transitride">Fahrt starten</button>',
 news:'<div class="phone-page-head">Stadt-News</div><div class="phone-stat">Neue Jobs in der Innenstadt</div><div class="phone-stat">Frankfurt Motors eröffnet</div><p>Bleib auf dem Laufenden.</p>',
 camera:'<div class="phone-page-head">Kamera</div><p>Fotomodus – richte die Kamera in der Stadt aus und mach einen Screenshot mit Windows.</p>',
 services:'<div class="phone-page-head">Stadtservice</div><div class="phone-stat">Mängel melden <b>Online</b></div><div class="phone-stat">Fundbüro <b>Offen</b></div>',
 settings:'<div class="phone-page-head">Einstellungen</div><div class="phone-setting"><label for="phoneQuality">Grafikqualität</label><select id="phoneQuality"><option value="minimum">Minimal (sehr schwache PCs)</option><option value="low">Niedrig</option><option value="medium">Mittel</option><option value="high">Hoch</option><option value="maximum">Maximal</option></select></div><div class="phone-setting"><label for="phoneFps">Bildrate</label><select id="phoneFps"><option value="30">30 FPS</option><option value="60">60 FPS</option><option value="unlimited">Unbegrenzt</option></select></div><div class="phone-setting"><label for="phoneMouse">Maus-Empfindlichkeit</label><select id="phoneMouse"><option value="0.65">Langsam</option><option value="1">Normal</option><option value="1.5">Schnell</option></select></div><div class="phone-setting"><label for="phoneFov">Sichtfeld</label><select id="phoneFov"><option value="60">60°</option><option value="68">68°</option><option value="78">78°</option><option value="88">88°</option></select></div><div class="phone-setting"><label for="phoneCamera">Kameraperspektive</label><select id="phoneCamera"><option value="follow">Verfolger</option><option value="close">Nah</option><option value="hood">Motorhaube</option><option value="ego">Ego-Perspektive</option></select></div><div class="phone-setting"><label for="phoneMapVisible">GPS-Minimap</label><select id="phoneMapVisible"><option value="on">Anzeigen</option><option value="off">Ausblenden</option></select></div><div class="phone-setting"><label for="phoneBrightness">Bildschirmhelligkeit</label><select id="phoneBrightness"><option value="0.8">Dunkler</option><option value="1" selected>Normal</option><option value="1.15">Hell</option><option value="1.3">Sehr hell</option></select></div><div class="phone-setting"><label for="phoneInvertY">Kamera Y-Achse</label><select id="phoneInvertY"><option value="off">Normal</option><option value="on">Invertiert</option></select></div><div class="phone-setting"><label for="phoneMapSize">Minimap-Größe</label><select id="phoneMapSize"><option value="small">Klein</option><option value="medium">Mittel</option><option value="large">Groß</option></select></div><div class="phone-setting"><label for="phoneCoordsVisible">Koordinaten anzeigen</label><select id="phoneCoordsVisible"><option value="on">Anzeigen</option><option value="off">Ausblenden</option></select></div><p>Die Änderungen werden direkt übernommen und gespeichert.</p>',
 customize:'<div class="phone-page-head">Charakter & Outfit</div><div class="phone-stat">Aktueller Stil <b>'+(flOutfit+1)+'/6</b></div><p>Wechsle zwischen sechs Outfit-Farbvarianten.</p><button data-action="outfit">Outfit wechseln</button>',
 daily:'<div class="phone-page-head">Tagesziele</div><p>Schaffe die zwei Aufgaben des Tages und erhalte 250 €.</p><div class="phone-stat">Auftrag abschließen <b>'+(flDailyJobs>0?'✓':'0/1')+'</b></div><div class="phone-stat">ÖPNV-Fahrt machen <b>'+(flDailyRides>0?'✓':'0/1')+'</b></div><div class="phone-stat">Tagesbonus <b>'+(flDailyClaimed?'Abgeholt':'250 €')+'</b></div><button data-action="dailyclaim">Bonus abholen</button>',
 save:'<div class="phone-page-head">Spielstand</div><p>Dein Fortschritt wird automatisch gespeichert. Du kannst jederzeit manuell sichern.</p><div class="phone-stat">Kontostand <b>'+careerMoney.toLocaleString('de-DE')+' €</b></div><div class="phone-stat">Benzin <b>'+Math.round(flFuel)+'%</b></div><button data-action="save">Jetzt speichern</button>',
 help:'<div class="phone-page-head">Hilfe & Steuerung</div><p>WASD bewegen · Maus umsehen · Shift sprinten · J Missionen · F Auto · C Kamera wechseln · E Interaktion · F1 Handy.</p>'
 };
 page.innerHTML='<button class="phone-back" data-action="home">‹ Apps</button>'+(pages[app]||'');
 if(app==='map'){const mc=page.querySelector('#phoneMapCanvas');if(mc)drawCityMap(mc.getContext('2d'),mc.width,mc.height,true);}
 if(app==='settings'){
  const pairs=[['phoneQuality',qualitySelect],['phoneFps',fpsSelect],['phoneMouse',mouseSelect],['phoneFov',fovSelect],['phoneCamera',cameraSelect]];
  for(const [id,source] of pairs){const el=page.querySelector('#'+id);if(el&&source)el.value=source.value;el?.addEventListener('change',()=>{if(source){source.value=el.value;source.dispatchEvent(new Event('change'));}});}
  const vis=page.querySelector('#phoneMapVisible');if(vis){vis.value=localStorage.getItem('flMiniMap')==='off'?'off':'on';vis.addEventListener('change',()=>{localStorage.setItem('flMiniMap',vis.value);const m=document.querySelector('#miniMap');if(m)m.style.display=vis.value==='off'?'none':'';});}
  const brightness=page.querySelector('#phoneBrightness');if(brightness){brightness.value=localStorage.getItem('flBrightness')||'1';const apply=()=>{localStorage.setItem('flBrightness',brightness.value);viewport.style.filter='brightness('+brightness.value+')';};apply();brightness.addEventListener('change',apply);}
  const invert=page.querySelector('#phoneInvertY');if(invert){invert.value=invertCameraY?'on':'off';invert.addEventListener('change',()=>{invertCameraY=invert.value==='on';localStorage.setItem('flInvertY',invert.value);});}
  const mapSize=page.querySelector('#phoneMapSize');if(mapSize){mapSize.value=localStorage.getItem('flMapSize')||'medium';const apply=()=>{const m=document.querySelector('#miniMap');if(m)m.style.width=({small:'130px',medium:'190px',large:'250px'}[mapSize.value]);localStorage.setItem('flMapSize',mapSize.value);};apply();mapSize.addEventListener('change',apply);}
  const coordsVisible=page.querySelector('#phoneCoordsVisible');if(coordsVisible){coordsVisible.value=localStorage.getItem('flCoordsVisible')==='off'?'off':'on';const apply=()=>{const c=document.querySelector('#miniMapCoords');if(c)c.style.display=coordsVisible.value==='off'?'none':'';localStorage.setItem('flCoordsVisible',coordsVisible.value);};apply();coordsVisible.addEventListener('change',apply);}
  const mini=document.querySelector('#miniMap');if(mini&&localStorage.getItem('flMapSize'))mini.style.width=({small:'130px',medium:'190px',large:'250px'}[localStorage.getItem('flMapSize')]);const coordsLabel=document.querySelector('#miniMapCoords');if(coordsLabel&&localStorage.getItem('flCoordsVisible')==='off')coordsLabel.style.display='none';if(localStorage.getItem('flMiniMap')==='off'&&mini)mini.style.display='none';
 }
 if(app==='map'){page.querySelector('[data-action="recenter"]')?.addEventListener('click',()=>openPhoneApp('map'));}
 page.querySelectorAll('[data-eat]').forEach(b=>b.addEventListener('click',()=>{const name=b.dataset.eat;if((inventory[name]||0)<1){b.textContent='Nicht vorhanden';return;}inventory[name]--;appetite=Math.min(100,appetite+({Brot:18,Brezel:15,Croissant:16,Kuchen:20,Kaffee:7,Snack:12,Pizza:28,Pasta:25,Limo:6,'Burger-Menü':24,Schnitzel:26,Salat:15,Cola:5}[name]||10));openPhoneApp('inventory');}));
 page.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>{const action=b.dataset.action;if(action==='home')showPhoneHome();if(action==='bankSend'){const recipient=page.querySelector('#bankRecipient')?.value,amount=page.querySelector('#bankAmount')?.value;flBankTransfer(recipient,amount);}if(action==='taxi')flCallTaxi();if(action==='jobs'){phonePanel.classList.add('hidden');toggleJobs();}if(action==='dealer'){phonePanel.classList.add('hidden');openDealer();}if(action==='homebuy')flBuyHome();if(action==='gohome')flGoHome();if(action==='furniture')flBuyFurniture();if(action==='transitride')flTransitRide();if(action==='outfit')flChangeOutfit();if(action==='dailyclaim')flClaimDaily();if(action==='save'){flSaveGame(true);openPhoneApp('save');}}));
}
function togglePhone(){
 if(!started||!phonePanel)return;
 phonePanel.classList.toggle('hidden');
 if(!phonePanel.classList.contains('hidden')){showPhoneHome();document.exitPointerLock?.();}
}
function buildQuickAccessWheel(){
 const wheel=document.createElement('div');wheel.id='quickAccessWheel';wheel.className='quick-wheel hidden';
 wheel.innerHTML='<div class="quick-wheel-core"><b>FRANKFURT</b><small>QUICK ACCESS · Q</small></div><button data-quick="phone"><b>📱</b><span>Handy</span></button><button data-quick="map"><b>🗺️</b><span>Karte</span></button><button data-quick="light"><b>🔦</b><span>Licht</span></button><button data-quick="camera"><b>🎥</b><span>Kamera</span></button><button class="quick-wheel-close" data-quick="close" aria-label="Schließen">×</button>';
 viewport.appendChild(wheel);
 wheel.querySelectorAll('[data-quick]').forEach(btn=>btn.addEventListener('click',()=>{
  const action=btn.dataset.quick;wheel.classList.add('hidden');
  if(action==='phone')togglePhone();
  if(action==='map'){if(phonePanel?.classList.contains('hidden'))togglePhone();openPhoneApp('map');}
  if(action==='light')toggleFlashlight();
  if(action==='camera')cycleCamera();
 }));
}
function toggleQuickAccessWheel(){
 const wheel=document.querySelector('#quickAccessWheel');
 if(!wheel||!started||!phonePanel?.classList.contains('hidden'))return;
 wheel.classList.toggle('hidden');
 if(!wheel.classList.contains('hidden'))document.exitPointerLock?.();
}
function buildDealership(){
 const g=new THREE.Group();
 const wall=new THREE.MeshStandardMaterial({color:0x263d50,roughness:.45,metalness:.25});
 const glass=new THREE.MeshStandardMaterial({color:0x8fc8dc,transparent:true,opacity:.36,metalness:.25,roughness:.18});
 const base=new THREE.Mesh(new THREE.BoxGeometry(24,8,16),wall);base.position.y=4;g.add(base);
 const front=new THREE.Mesh(new THREE.BoxGeometry(.15,5,14),glass);front.position.set(12.1,3.3,0);g.add(front);
 const canopy=new THREE.Mesh(new THREE.BoxGeometry(2, .35,17),new THREE.MeshStandardMaterial({color:0x28b8c6,metalness:.3}));canopy.position.set(12.7,6.2,0);g.add(canopy);
 const signCanvas=document.createElement('canvas');signCanvas.width=900;signCanvas.height=180;
 const ctx=signCanvas.getContext('2d');ctx.fillStyle='#10283a';ctx.fillRect(0,0,900,180);ctx.fillStyle='#6de6ed';ctx.font='bold 82px Arial';ctx.textAlign='center';ctx.fillText('FRANKFURT MOTORS',450,115);
 const sign=new THREE.Mesh(new THREE.BoxGeometry(.2,2.6,13),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(signCanvas)}));sign.position.set(12.3,8.4,0);g.add(sign);
 g.position.set(dealership.x,0,dealership.z);scene.add(g);
 for(let i=0;i<3;i++){const car=makeCar(dealership.x-5+i*5,dealership.z-2,[0xb51e2b,0x075b45,0xd7ed12][i],false,['hatch','coupe','super'][i]);car.rotation.y=Math.PI/2;dealerDisplayCars.push(car);}
}
const dealerDisplayCars=[];
function nearestDealer(){return camera&&!driving&&Math.hypot(camera.position.x-dealership.x,camera.position.z-dealership.z)<16;}
function buildDealerPanel(){
 dealerPanel=document.createElement('div');dealerPanel.id='dealerPanel';dealerPanel.className='ingame-jobs hidden';
 dealerPanel.innerHTML='<div class="ingame-jobs-head"><b>FRANKFURT MOTORS / SHOWROOM</b><button id="dealerClose">×</button></div><h3>Finde dein Auto</h3><p class="ingame-jobs-hint">Kaufe Fahrzeuge mit deinem verdienten Geld. Dein Startwagen ist kostenlos.</p><div id="dealerCars"></div><div id="dealerMessage">Willkommen bei Frankfurt Motors.</div><small>E oder ESC · Schließen</small>';
 viewport.appendChild(dealerPanel);dealerPanel.querySelector('#dealerClose').addEventListener('click',()=>dealerPanel.classList.add('hidden'));
}
function openDealer(){
 if(!dealerPanel)return;
 const list=dealerPanel.querySelector('#dealerCars');list.replaceChildren();
 for(const car of dealerCars){
  const owned=ownedCars.includes(car.id),button=document.createElement('button');button.className='ingame-job-choice';
  button.innerHTML='<b>'+car.name+' · '+(car.price?car.price.toLocaleString('de-DE')+' €':'GRATIS')+'</b><span>'+car.desc+(owned?' · IN GARAGE':'')+'</span>';
  button.addEventListener('click',()=>{
   const msg=dealerPanel.querySelector('#dealerMessage');
   if(!owned&&careerMoney<car.price){msg.textContent='Nicht genug Geld. Verdiene Geld mit Missionen.';return;}
   if(!owned){careerMoney-=car.price;ownedCars.push(car.id);flSaveGame();
   if(careerHud)careerHud.innerHTML='KONTO: '+careerMoney.toLocaleString('de-DE')+' €<br>AUFTRÄGE: '+completedJobs+'<br>★ RUF: '+Math.min(5,1+Math.floor(completedJobs/2))+'/5';msg.textContent=car.name+' gekauft! Es steht jetzt in deiner Garage.';button.querySelector('span').textContent=car.desc+' · IN GARAGE';}
   else{if(jobCar)scene.remove(jobCar);jobCar=makeCar(camera.position.x+3,camera.position.z-5,car.color,false,car.model,car.performance);jobCar.rotation.y=yaw;applyCarTuning(jobCar);damageLevel=flSavedDamage;applyCarDamage(jobCar,damageLevel);if(damageLevel)refreshDamageHud();msg.textContent=car.name+' bereitgestellt. Gehe hin und drücke F.';}
  });list.appendChild(button);
 }
 dealerPanel.classList.remove('hidden');document.exitPointerLock?.();
}


function building(x,z,w,d,h,color){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness:.88,metalness:.035}));
  body.position.y=h/2;g.add(body);
  if(liteMode){const simpleRoof=new THREE.Mesh(new THREE.BoxGeometry(w*1.03,.35,d*1.03),new THREE.MeshStandardMaterial({color:0x26364b,roughness:.82,metalness:.08}));simpleRoof.position.y=h+.15;g.add(simpleRoof);g.position.set(x,0,z);scene.add(g);return;}
  const roof=new THREE.Mesh(new THREE.BoxGeometry(w*1.03,.35,d*1.03),new THREE.MeshLambertMaterial({color:0x26364b}));
  roof.position.y=h+.15;g.add(roof);
  const facadeGlass=[0x9fc6d8,0x789caf,0x496779].map((tint,i)=>new THREE.MeshPhysicalMaterial({color:tint,roughness:.12+i*.035,metalness:.18,clearcoat:1,clearcoatRoughness:.08,envMapIntensity:1.35,emissive:i===2?0x07121a:0x142b3a,emissiveIntensity:.12}));
  const windowFrame=new THREE.MeshStandardMaterial({color:0x293943,metalness:.72,roughness:.3});
  const sillMat=new THREE.MeshStandardMaterial({color:0x9ba8ad,metalness:.48,roughness:.42});
  for(let y=2;y<h-1;y+=2.6){
    for(let xx=-w/2+.8;xx<w/2-.4;xx+=1.5){
      const lit=Math.random()>.3,glassMat=facadeGlass[lit?Math.floor(Math.random()*2):2];
      const win=new THREE.Mesh(new THREE.BoxGeometry(.62,.92,.075),glassMat);
      win.position.set(xx,y,d/2+.045);g.add(win);
      // Slim metal mullions, projecting stone sills and top lintels create a layered facade.
      for(const dx of [-.34,.34]){const mullion=new THREE.Mesh(new THREE.BoxGeometry(.035,.98,.105),windowFrame);mullion.position.set(xx+dx,y,d/2+.055);g.add(mullion);}
      const crossbar=new THREE.Mesh(new THREE.BoxGeometry(.62,.035,.105),windowFrame);crossbar.position.set(xx,y,d/2+.055);g.add(crossbar);
      const sill=new THREE.Mesh(new THREE.BoxGeometry(.72,.07,.18),sillMat);sill.position.set(xx,y-.51,d/2+.09);g.add(sill);
      const sideWin=new THREE.Mesh(new THREE.BoxGeometry(.075,.92,.62),glassMat);
      sideWin.position.set(w/2+.045,y,xx/w*d*.72);g.add(sideWin);
      if(y>3&&Math.abs(xx)<w*.42){
        const balcony=new THREE.Mesh(new THREE.BoxGeometry(.82,.08,.28),new THREE.MeshStandardMaterial({color:0x77838b,metalness:.35,roughness:.7}));
        balcony.position.set(xx,y-.57,d/2+.2);g.add(balcony);
        const rail=new THREE.Mesh(new THREE.BoxGeometry(.82,.055,.055),windowFrame);rail.position.set(xx,y-.2,d/2+.34);g.add(rail);
      }
    }
  }
  // Fassadenrahmen, Gesimse und Dachtechnik geben den Blockgebäuden mehr Tiefe.
  const trimMat=new THREE.MeshStandardMaterial({color:0xd2d0c7,roughness:.82});
  for(const side of [-1,1]){
    const pilaster=new THREE.Mesh(new THREE.BoxGeometry(.16,h,.18),trimMat);
    pilaster.position.set(side*(w/2-.12),h/2,d/2+.1);g.add(pilaster);
  }
  for(let y=3;y<h;y+=5.2){
    const band=new THREE.Mesh(new THREE.BoxGeometry(w+.12,.12,.18),trimMat);
    band.position.set(0,y,d/2+.1);g.add(band);
  }
  const roofUnitsMat=new THREE.MeshStandardMaterial({color:0x68747b,metalness:.35,roughness:.7});
  for(let n=0;n<2;n++){
    const unit=new THREE.Mesh(new THREE.BoxGeometry(1.05,.65,.85),roofUnitsMat);
    unit.position.set((n-.5)*w*.38,h+.48,0);g.add(unit);
    const vent=new THREE.Mesh(new THREE.BoxGeometry(.72,.06,.62),new THREE.MeshStandardMaterial({color:0x303b43,metalness:.25}));
    vent.position.set(unit.position.x,h+.83,0);g.add(vent);
  }
  const entry=new THREE.Mesh(new THREE.BoxGeometry(1.1,2.1,.1),new THREE.MeshStandardMaterial({color:0x263746,roughness:.45,metalness:.15}));
  entry.position.set(0,1.05,d/2+.12);g.add(entry);
  g.position.set(x,0,z);scene.add(g);
}
const flEnterableHomes=[];
let flInsideHome=false,flHomeExitPosition=null,flHomeInterior=null,flHomeDoorPivot=null,flHomeDoorPhase='closed',flHomeDoorProgress=0,flHomeDoorAction=null;
function flBuildHomeInterior(){
 if(flHomeInterior)return flHomeInterior;
 const room=new THREE.Group();
 const mat=(color,roughness=.8)=>new THREE.MeshStandardMaterial({color,roughness});
 const addBox=(w,h,d,color,x,y,z,roughness=.8)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color,roughness));m.position.set(x,y,z);room.add(m);return m;};
 addBox(13,.22,11,0x8b7765,0,-.12,0);
 addBox(13,3.4,.2,0xe5dfd4,0,1.6,-5.4);
 addBox(.2,3.4,11,0xd8d2c8,-6.5,1.6,0);addBox(.2,3.4,11,0xd8d2c8,6.5,1.6,0);
 addBox(13,.18,11,0xf2eee6,0,3.35,0);
 addBox(5,.035,3.2,0x526477,-.5,.02,1);
 addBox(3.5,.72,1.15,0x52606a,-1,.42,-.2);addBox(3.5,.85,.3,0x43515d,-1,.95,-.65);
 addBox(2,.14,1.1,0x76543b,-.5,.48,1.2);
 for(const x of [-1.35,.35])addBox(.09,.45,.09,0x4b382b,x,.23,1.2);
 addBox(4,.95,.8,0xb9b7ae,3.9,.48,-3.9);addBox(4.1,.12,.9,0x454c52,3.9,1.02,-3.9,.35);
 addBox(.85,2,.8,0xbfc8ce,5.4,1,-4.7,.25);
 addBox(2.5,.48,3,0x6e8497,3.7,.28,2.8);addBox(1.1,.2,.55,0xece8df,3.7,.62,1.8);
 const lamp=new THREE.PointLight(0xffdfb0,1.45,18);lamp.position.set(0,2.9,0);room.add(lamp);
 const ceilingLamp=new THREE.Mesh(new THREE.SphereGeometry(.16,16,10),new THREE.MeshStandardMaterial({color:0xffedc7,emissive:0xffcf83,emissiveIntensity:1.3}));
 ceilingLamp.position.set(0,3.12,0);room.add(ceilingLamp);
 // Hinged door: pivot at the left edge, so it swings naturally into the room.
 flHomeDoorPivot=new THREE.Group();flHomeDoorPivot.position.set(-.6,0,5.35);room.add(flHomeDoorPivot);
 addBox(1.2,2.2,.12,0x263746,.6,1.05,0);
 const knob=new THREE.Mesh(new THREE.SphereGeometry(.055,12,8),mat(0xc49a51,.25));knob.position.set(1.04,1.02,-.08);flHomeDoorPivot.add(knob);
 // Wall picture and small side table add depth to the living room.
 addBox(1.45,.95,.055,0x8b674c,-3.1,2.15,-5.27);
 addBox(.85,.08,.75,0x674b37,5.35,.48,.5);addBox(.08,.9,.08,0x49382c,5.05,.2,.5);
 room.position.set(420,0,420);room.visible=false;scene.add(room);flHomeInterior=room;return room;
}
function flToggleHome(){
 if(!started||!camera||driving||planeFlying||activeBoat||flHomeDoorPhase!=='closed')return false;
 if(flInsideHome){flHomeDoorAction='exit';flHomeDoorPhase='opening';flHomeDoorProgress=0;status.textContent='TÜR ÖFFNET SICH …';return true;}
 let home=null,best=Infinity;
 for(const h of flEnterableHomes){const d=Math.hypot(camera.position.x-h.x,camera.position.z-(h.z+h.depth/2+.8));if(d<best){best=d;home=h;}}
 if(!home||best>4.5)return false;
 flHomeExitPosition=camera.position.clone();flBuildHomeInterior().visible=true;
 flHomeDoorAction='enter';flHomeDoorPhase='opening';flHomeDoorProgress=0;status.textContent='TÜR ÖFFNET SICH …';
 document.exitPointerLock?.();return true;
}
function flUpdateHomeDoor(dt){
 if(!flHomeDoorPivot||flHomeDoorPhase==='closed')return;
 const speed=2.2;
 if(flHomeDoorPhase==='opening'){
  flHomeDoorProgress=Math.min(1,flHomeDoorProgress+dt*speed);
  const eased=flHomeDoorProgress*flHomeDoorProgress*(3-2*flHomeDoorProgress);
  flHomeDoorPivot.rotation.y=-1.35*eased;
  if(flHomeDoorProgress>=1){
   if(flHomeDoorAction==='enter'){camera.position.set(420,1.7,423.8);flInsideHome=true;status.textContent='WOHNUNG · E ZUM VERLASSEN';}
   else{flInsideHome=false;if(flHomeExitPosition)camera.position.copy(flHomeExitPosition);status.textContent='DU BIST WIEDER DRAUSSEN';}
   flHomeDoorPhase='holding';flHomeDoorProgress=0;
  }
 }else if(flHomeDoorPhase==='holding'){
  flHomeDoorProgress+=dt;
  if(flHomeDoorProgress>.45){flHomeDoorPhase='closing';flHomeDoorProgress=0;}
 }else if(flHomeDoorPhase==='closing'){
  flHomeDoorProgress=Math.min(1,flHomeDoorProgress+dt*speed);
  const eased=flHomeDoorProgress*flHomeDoorProgress*(3-2*flHomeDoorProgress);
  flHomeDoorPivot.rotation.y=-1.35*(1-eased);
  if(flHomeDoorProgress>=1){flHomeDoorPivot.rotation.y=0;flHomeDoorPhase='closed';flHomeDoorAction=null;if(!flInsideHome&&flHomeInterior)flHomeInterior.visible=false;}
 }
}
function residentialBuilding(x,z,w,d,h,color){
 const g=new THREE.Group();
 const wall=new THREE.MeshStandardMaterial({color,roughness:.88});
 const trim=new THREE.MeshStandardMaterial({color:0xe1d8c8,roughness:.8});
 const glass=new THREE.MeshStandardMaterial({color:0x83b8cf,roughness:.25,metalness:.12,emissive:0x152b38,emissiveIntensity:.18});
 const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),wall);body.position.y=h/2;g.add(body);
 if(liteMode){const simpleRoof=new THREE.Mesh(new THREE.BoxGeometry(w+.35,.35,d+.35),new THREE.MeshStandardMaterial({color:0x384653}));simpleRoof.position.y=h+.16;g.add(simpleRoof);g.position.set(x,0,z);scene.add(g);flEnterableHomes.push({x,z,depth:d});return;}
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
 g.position.set(x,0,z);scene.add(g);flEnterableHomes.push({x,z,depth:d});
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
  // Small visible packages and bottles make the shop shelves feel stocked.
  for(let k=0;k<3;k++){
   const pack=new THREE.Mesh(new THREE.BoxGeometry(.22,.32,.22),new THREE.MeshStandardMaterial({color:[0xc64e36,0xe2c65b,0x4b8e76,0x4774a1][(i+k)%4],roughness:.58}));
   pack.position.set(-side*2.8+(k-1)*.24,1.13,-2.7+i*1.8);g.add(pack);
  }
 }
 const checkout=new THREE.Mesh(new THREE.BoxGeometry(1.15,1.05,2.1),new THREE.MeshStandardMaterial({color:0x55483b,roughness:.52}));
 checkout.position.set(frontX*.48,.66,3.0);g.add(checkout);
 const checkoutTop=new THREE.Mesh(new THREE.BoxGeometry(1.22,.09,2.18),new THREE.MeshStandardMaterial({color:0x252a2d,metalness:.18,roughness:.32}));
 checkoutTop.position.set(frontX*.48,1.22,3.0);g.add(checkoutTop);
 const register=new THREE.Mesh(new THREE.BoxGeometry(.38,.2,.28),new THREE.MeshStandardMaterial({color:0x182d3b,metalness:.25,roughness:.3}));
 register.position.set(frontX*.48,1.36,2.72);g.add(register);
 const ceilingLight=new THREE.PointLight(0xffe2b7,.8,13);ceilingLight.position.set(0,6.6,0);g.add(ceilingLight);
 const base=new THREE.Mesh(new THREE.BoxGeometry(8.3,.24,10.3),trimMat);base.position.y=.12;g.add(base);
 g.position.set(x,0,z);scene.add(g);
 const products=name.startsWith('TANKSTELLE')?[{name:'Benzin 25%',price:90,kind:'fuel'},{name:'Benzin 50%',price:170,kind:'fuel'},{name:'Benzin 100%',price:300,kind:'fuel'},{name:'Wasser',price:2},{name:'Schokoriegel',price:3},{name:'Chips',price:3},{name:'Stadtplan',price:8}]:name.startsWith('BÄCKEREI')?[{name:'Brot',price:4},{name:'Brezel',price:3},{name:'Croissant',price:4},{name:'Kuchen',price:5},{name:'Kaffee',price:4}]:name.startsWith('PIZZERIA')?[{name:'Pizza',price:9},{name:'Pasta',price:8},{name:'Limo',price:3}]:name.startsWith('RESTAURANT')?[{name:'Burger-Menü',price:12},{name:'Schnitzel',price:16},{name:'Salat',price:9},{name:'Cola',price:3},{name:'Kaffee',price:4}]:name==='TUNINGWERK'?[{name:'Motor-Upgrade · Stufe 1–3',price:850,kind:'tuning',id:'engine'},{name:'Turbo-Kit',price:1450,kind:'tuning',id:'turbo'},{name:'Sonderlackierung',price:280,kind:'tuning',id:'paint'},{name:'Sportfelgen',price:420,kind:'tuning',id:'wheels'},{name:'Heckspoiler',price:620,kind:'tuning',id:'spoiler'},{name:'Sportfahrwerk · tieferlegen',price:780,kind:'tuning',id:'lowered'},{name:'Scheibentönung',price:340,kind:'tuning',id:'tint'},{name:'Unfallschäden reparieren',price:Math.max(120,damageLevel*260),kind:'tuning',id:'repair'}]:name==='WESTEND MARKT'?[{name:'Brot',price:4},{name:'Snack',price:3},{name:'Kaffee',price:4},{name:'Cola',price:3},{name:'Wasser',price:2},{name:'Stadtplan',price:8},{name:'Regenschirm',price:12},{name:'Batterien',price:6}]:name==='CITY SPORT'?[{name:'Laufschuhe',price:65},{name:'Sporttasche',price:35},{name:'Fußball',price:22},{name:'Fahrradhelm',price:28},{name:'Wasser',price:2}]:name==='OSTEND CAFÉ'?[{name:'Kaffee',price:4},{name:'Croissant',price:4},{name:'Kuchen',price:5},{name:'Limo',price:3}]:name==='SÜDQUARTIER KIOSK'?[{name:'Snack',price:3},{name:'Cola',price:3},{name:'Wasser',price:2},{name:'Stadtplan',price:8},{name:'Regenschirm',price:12}]:[{name:'Kaffee',price:4},{name:'Snack',price:3},{name:'Stadtplan',price:8}];
 shops.push({name,subtitle,x,z,side,products});
}

function buildFuelPumps(){
 const pumpMat=new THREE.MeshStandardMaterial({color:0xe6edf0,roughness:.42,metalness:.25});
 const darkMat=new THREE.MeshStandardMaterial({color:0x263746,roughness:.55,metalness:.35});
 const screenMat=new THREE.MeshStandardMaterial({color:0x102c39,emissive:0x145365,emissiveIntensity:.55});
 const hoseMat=new THREE.MeshStandardMaterial({color:0x15191d,roughness:.8});
 for(const z of [137.5,142,146.5]){
  const pump=new THREE.Group();
  const base=new THREE.Mesh(new THREE.BoxGeometry(1.05,.18,1.15),darkMat);base.position.y=.09;pump.add(base);
  const body=new THREE.Mesh(new THREE.BoxGeometry(.82,1.65,.82),pumpMat);body.position.y=1.0;pump.add(body);
  const screen=new THREE.Mesh(new THREE.BoxGeometry(.035,.38,.46),screenMat);screen.position.set(.425,1.42,0);pump.add(screen);
  const display=new THREE.Mesh(new THREE.BoxGeometry(.04,.08,.3),darkMat);display.position.set(.45,1.12,0);pump.add(display);
  const hose=new THREE.Mesh(new THREE.TorusGeometry(.22,.035,6,12,Math.PI*1.35),hoseMat);hose.rotation.y=Math.PI/2;hose.position.set(.48,.83,.35);pump.add(hose);
  const nozzle=new THREE.Mesh(new THREE.BoxGeometry(.12,.3,.1),darkMat);nozzle.position.set(.55,.83,.12);pump.add(nozzle);
  const canopy=new THREE.Mesh(new THREE.BoxGeometry(1.25,.1,1.3),new THREE.MeshStandardMaterial({color:0x277b92,roughness:.5}));canopy.position.y=1.88;pump.add(canopy);
  pump.position.set(7.4,0,z);scene.add(pump);
 }
}
function tryRefuelAtPump(){
 if(!driving||!jobCar)return false;
 const d=Math.hypot(jobCar.position.x-7.4,jobCar.position.z-142);
 if(d>7.5)return false;
 if(Math.abs(carSpeed)>.025){status.textContent='HALTE AN DER ZAPFSÄULE AN, UM ZU TANKEN';return true;}
 if(flFuel>=99.9){status.textContent='TANK IST BEREITS VOLL';return true;}
 const amount=Math.min(25,100-flFuel);
 const cost=Math.ceil(amount*2.2);
 if(careerMoney<cost){status.textContent='ZU WENIG GELD · '+cost+' € FÜR '+Math.round(amount)+'% BENZIN';return true;}
 careerMoney-=cost;flFuel=Math.min(100,flFuel+amount);
 if(careerHud)careerHud.innerHTML='KONTO: '+careerMoney.toLocaleString('de-DE')+' €<br>AUFTRÄGE: '+completedJobs+'<br>★ RUF: '+Math.min(5,1+Math.floor(completedJobs/2))+'/5';
 flUpdateStatus();flSaveGame();
 status.textContent='GETANKT · +'+Math.round(amount)+'% · −'+cost+' € · TANK '+Math.round(flFuel)+'%';
 return true;
}
function createTransitStop(x,z,label){
 const g=new THREE.Group();
 const metal=new THREE.MeshStandardMaterial({color:0x334653,metalness:.55,roughness:.42});
 const glass=new THREE.MeshStandardMaterial({color:0x83c5d7,transparent:true,opacity:.28,roughness:.2});
 const roof=new THREE.MeshStandardMaterial({color:0x263d4c,roughness:.65});
 const postGeo=new THREE.BoxGeometry(.12,2.35,.12);
 for(const px of [-1.55,1.55]){const post=new THREE.Mesh(postGeo,metal);post.position.set(px,1.17,0);g.add(post);}
 const canopy=new THREE.Mesh(new THREE.BoxGeometry(3.35,.16,1.55),roof);canopy.position.set(0,2.35,0);g.add(canopy);
 const back=new THREE.Mesh(new THREE.BoxGeometry(3.05,1.75,.055),glass);back.position.set(0,1.25,-.65);g.add(back);
 const bench=new THREE.Mesh(new THREE.BoxGeometry(2.15,.12,.48),new THREE.MeshStandardMaterial({color:0x9b7954,roughness:.8}));bench.position.set(0,.55,.15);g.add(bench);
 const sign=new THREE.Mesh(new THREE.BoxGeometry(.55,.78,.1),new THREE.MeshStandardMaterial({color:0x167d91,roughness:.6}));sign.position.set(-1.9,2.15,.05);g.add(sign);
 const pole=new THREE.Mesh(new THREE.CylinderGeometry(.035,.045,1.45,6),metal);pole.position.set(2,1.55,.45);g.add(pole);
 const board=new THREE.Mesh(new THREE.BoxGeometry(.8,.5,.08),new THREE.MeshStandardMaterial({color:0xf1f4ef,roughness:.75}));board.position.set(2,2.35,.45);g.add(board);
 g.position.set(x,0,z);scene.add(g);
}
function buildTransitStops(){
 createTransitStop(13,-72,'INNENSTADT');
 createTransitStop(-26,-96,'WESTEND');
 createTransitStop(145,-145,'OSTEND');
 createTransitStop(-145,165,'SÜDQUARTIER');
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
  const group=new THREE.Group();
  const bark=new THREE.MeshStandardMaterial({color:0x594333,roughness:1});
  const leafColors=[0x294f3b,0x356447,0x416f4b,0x527c50];
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.13,.24,2.55,8),bark);trunk.position.y=1.27;group.add(trunk);
  for(let i=0;i<4;i++){
    const branch=new THREE.Mesh(new THREE.CylinderGeometry(.045,.085,.95,6),bark);
    branch.position.set(Math.cos(i*Math.PI/2)*.34,2.05,Math.sin(i*Math.PI/2)*.34);
    branch.rotation.z=(i%2?-.48:.48);branch.rotation.x=Math.sin(i*2)*.35;group.add(branch);
  }
  const crownMat=leafColors.map(color=>new THREE.MeshStandardMaterial({color,roughness:.94}));
  const clusters=[
    [0,3.05,0,1.05],[.65,2.8,.08,.78],[-.62,2.83,.12,.82],
    [.08,2.85,.62,.78],[-.12,2.86,-.62,.8],[.05,3.68,.04,.7],
    [.48,3.35,-.35,.58],[-.48,3.32,.35,.62]
  ];
  for(let i=0;i<clusters.length;i++){const [cx,cy,cz,r]=clusters[i];const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(r,1),crownMat[i%crownMat.length]);crown.position.set(cx,cy,cz);crown.scale.set(1,.88,1);group.add(crown);}
  group.position.set(x,0,z);scene.add(group);
}
function makePedestrian(x,z,index){
  const group=new THREE.Group();
  const shirts=[0x345b80,0x8c5747,0x526c54,0x454b59,0xb18b4d,0x6c557f,0x287d83,0x9a493f,0x526b91,0x737b4c];
  const pants=[0x263342,0x343b49,0x4b4039,0x202b31,0x5b6067],skins=[0xc99570,0x9b684d,0xe0b18d,0x704832,0xb77f5d,0xe8c7a6],hairs=[0x30251f,0x5b3b27,0x17191d,0x9b7548,0x77716b];
  const shirtMat=new THREE.MeshStandardMaterial({color:shirts[index%shirts.length],roughness:.9}),pantsMat=new THREE.MeshStandardMaterial({color:pants[index%pants.length],roughness:.95}),skinMat=new THREE.MeshStandardMaterial({color:skins[(index*3)%skins.length],roughness:.88}),hairMat=new THREE.MeshStandardMaterial({color:hairs[(index*7)%hairs.length],roughness:1}),shoeMat=new THREE.MeshStandardMaterial({color:index%3===0?0xe5e7e8:0x20252b,roughness:.8});
  const torso=new THREE.Mesh(new THREE.BoxGeometry(.55,.76,.32),shirtMat);torso.position.y=1.18;group.add(torso);
  const hips=new THREE.Mesh(new THREE.BoxGeometry(.43,.2,.29),pantsMat);hips.position.y=.72;group.add(hips);
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(.085,.095,.18,8),skinMat);neck.position.y=1.62;group.add(neck);
  const head=new THREE.Group(),face=new THREE.Mesh(new THREE.SphereGeometry(.205,12,10),skinMat);face.scale.set(.9,1.08,.88);head.add(face);
  const hair=new THREE.Mesh(new THREE.SphereGeometry(.211,12,8,0,Math.PI*2,0,Math.PI*.56),hairMat);hair.position.y=.075;head.add(hair);
  const eyeMat=new THREE.MeshStandardMaterial({color:0x20252b,roughness:1});
  for(const side of [-1,1]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.022,6,5),eyeMat);eye.position.set(side*.073,.025,.18);head.add(eye);}
  const nose=new THREE.Mesh(new THREE.SphereGeometry(.035,7,6),skinMat);nose.scale.set(.72,.8,.8);nose.position.set(0,-.025,.19);head.add(nose);head.position.y=1.83;group.add(head);
  const arms=[],legs=[];
  for(const side of [-1,1]){
    const arm=new THREE.Group();arm.position.set(side*.34,1.43,0);
    const upper=new THREE.Mesh(new THREE.CapsuleGeometry(.075,.35,3,6),shirtMat);upper.position.y=-.22;arm.add(upper);
    const hand=new THREE.Mesh(new THREE.SphereGeometry(.085,7,6),skinMat);hand.position.y=-.48;arm.add(hand);group.add(arm);arms.push(arm);
    const leg=new THREE.Group();leg.position.set(side*.14,.67,0);
    const lower=new THREE.Mesh(new THREE.CapsuleGeometry(.085,.34,3,6),pantsMat);lower.position.y=-.23;leg.add(lower);
    const shoe=new THREE.Mesh(new THREE.BoxGeometry(.17,.12,.28),shoeMat);shoe.position.set(0,-.47,.055);leg.add(shoe);group.add(leg);legs.push(leg);
  }
  if(index%5===0){const bag=new THREE.Mesh(new THREE.BoxGeometry(.25,.32,.13),new THREE.MeshStandardMaterial({color:0x654a36,roughness:.95}));bag.position.set(-.36,1.05,-.02);group.add(bag);}
  if(index%7===0){const cap=new THREE.Mesh(new THREE.CylinderGeometry(.19,.2,.07,10),new THREE.MeshStandardMaterial({color:shirts[(index+3)%shirts.length]}));cap.position.y=2.08;group.add(cap);}
  group.position.set(x,0,z);group.userData={originX:x,originZ:z,phase:index*.8,speed:.35+(index%4)*.09,arms,legs,torso,head};pedestrians.push(group);scene.add(group);
}
function makeCar(x,z,color,police=false,model='sedan',performanceOverride=null){
  const car=new THREE.Group();
  const paint=new THREE.MeshPhysicalMaterial({color,roughness:.2,metalness:.68,clearcoat:1,clearcoatRoughness:.055,envMapIntensity:1.85});
  const glass=new THREE.MeshPhysicalMaterial({color:0x182b3a,roughness:.075,metalness:.03,clearcoat:1,clearcoatRoughness:.08,transparent:true,opacity:.2,depthWrite:false,envMapIntensity:1.2});
  const black=new THREE.MeshStandardMaterial({color:0x10151b,roughness:.58});
  const mirrorFinish=new THREE.MeshPhysicalMaterial({color:0x263744,metalness:.88,roughness:.12,clearcoat:1,clearcoatRoughness:.045,envMapIntensity:1.8});
  const chrome=new THREE.MeshStandardMaterial({color:0xb8c4ce,metalness:.8,roughness:.22});
  const light=new THREE.MeshStandardMaterial({color:0xfff1d2,emissive:0xffd58a,emissiveIntensity:.65,roughness:.2,metalness:.08});
  const tail=new THREE.MeshStandardMaterial({color:0xff2638,emissive:0x9d0718,emissiveIntensity:.8,roughness:.25});
  const lens=new THREE.MeshPhysicalMaterial({color:0xd9e6ed,transparent:true,opacity:.34,roughness:.08,metalness:.12,clearcoat:1});
  const badgeDark=new THREE.MeshStandardMaterial({color:0x101820,metalness:.78,roughness:.2});
  const badgeBlue=new THREE.MeshStandardMaterial({color:0x1678c8,metalness:.42,roughness:.28});
  const badgeWhite=new THREE.MeshStandardMaterial({color:0xeaf2f6,metalness:.22,roughness:.32});
  const headlights=[],customRims=[];
  const profile={
    hatch:{length:3.9,width:1.82,height:.68,cabin:1.45,roof:1.34,hood:1.25},
    super:{length:4.55,width:2.02,height:.48,cabin:1.05,roof:1.04,hood:1.8},
    sedan:{length:4.7,width:1.9,height:.68,cabin:1.65,roof:1.42,hood:1.5},
    sportback:{length:4.8,width:1.95,height:.62,cabin:1.7,roof:1.35,hood:1.55},
    coupe:{length:4.9,width:1.98,height:.65,cabin:1.5,roof:1.36,hood:1.6},
    van:{length:5.1,width:2.0,height:.9,cabin:2.05,roof:1.8,hood:1.05},
    suv:{length:5.1,width:2.05,height:.86,cabin:1.82,roof:1.62,hood:1.45}
  }[model]||{length:4.5,width:1.9,height:.65,cabin:1.55,roof:1.35,hood:1.5};
  const L=profile.length,W=profile.width;
  const vehiclePerformance={
    hatch:{top:175,power:.82},sedan:{top:215,power:1.0},
    sportback:{top:245,power:1.12},coupe:{top:265,power:1.2},
    super:{top:335,power:1.55},van:{top:155,power:.72},
    suv:{top:250,power:1.58}
  }[model]||{top:190,power:.95};
  if(performanceOverride){vehiclePerformance.top=performanceOverride.top||vehiclePerformance.top;vehiclePerformance.power=performanceOverride.power||vehiclePerformance.power;}
  car.userData.maxSpeedKmh=vehiclePerformance.top;
  car.userData.enginePower=vehiclePerformance.power;
  car.userData.maxForwardSpeed=.47*(vehiclePerformance.top/240)*vehiclePerformance.power;
  const lower=new THREE.Mesh(new THREE.BoxGeometry(W,.48,L),paint);lower.position.y=.58;car.add(lower);
  const hood=new THREE.Mesh(new THREE.BoxGeometry(W*.96,.2,profile.hood),paint);hood.position.set(0,.83,L*.34);car.add(hood);
  const rear=new THREE.Mesh(new THREE.BoxGeometry(W*.94,.22,Math.max(.65,L-profile.hood-1.7)),paint);rear.position.set(0,.79,-L*.34);car.add(rear);
  const cabin=new THREE.Mesh(new THREE.BoxGeometry(W*.78,profile.cabin,L*.43),glass);cabin.position.set(0,1.08,-.12);cabin.material.opacity=.24;car.add(cabin);
  // Sichtbare NPC-Fahrer sitzen in jedem KI-Fahrzeug hinter dem Lenkrad.
  const driver=new THREE.Group();
  const driverSkin=new THREE.MeshStandardMaterial({color:0xc58f6c,roughness:.9});
  const driverShirt=new THREE.MeshStandardMaterial({color:[0x345b80,0x526c54,0x8c5747,0x454b59][Math.abs(Math.round(x*7+z*3))%4],roughness:.95});
  const driverHair=new THREE.MeshStandardMaterial({color:0x30251f,roughness:1});
  const driverBody=new THREE.Mesh(new THREE.BoxGeometry(.38,.42,.24),driverShirt);driverBody.position.set(-W*.18,1.02,.27);driver.add(driverBody);
  const driverHead=new THREE.Mesh(new THREE.SphereGeometry(.145,9,8),driverSkin);driverHead.position.set(-W*.18,1.34,.34);driver.add(driverHead);
  const driverHairCap=new THREE.Mesh(new THREE.SphereGeometry(.15,9,6,0,Math.PI*2,0,Math.PI*.55),driverHair);driverHairCap.position.set(-W*.18,1.39,.34);driver.add(driverHairCap);
  for(const side of [-1,1]){const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.055,.25,3,5),driverShirt);arm.position.set(-W*.18+side*.2,1.03,.43);arm.rotation.x=-.85;arm.rotation.z=side*.28;driver.add(arm);const hand=new THREE.Mesh(new THREE.SphereGeometry(.055,6,5),driverSkin);hand.position.set(-W*.18+side*.2,1.13,.56);driver.add(hand);}
  driver.userData.isNpcDriver=true;car.userData.npcDriver=driver;car.add(driver);
  const roof=new THREE.Mesh(new THREE.BoxGeometry(W*.72,.12,L*.32),paint);roof.position.set(0,1.08+profile.cabin/2,-.18);car.add(roof);
  // Sichtbarer Innenraum: Sitze, Kopfstützen, Mittelkonsole und Armaturenbrett.
  const upholstery=new THREE.MeshStandardMaterial({color:0x252b32,roughness:.92});
  const seatAccent=new THREE.MeshStandardMaterial({color:0x46515c,roughness:.82});
  const dashMat=new THREE.MeshStandardMaterial({color:0x171d24,roughness:.72});
  const screenMat=new THREE.MeshBasicMaterial({color:0x4ac6d8});
  const cabinFloor=new THREE.Mesh(new THREE.BoxGeometry(W*.68,.09,L*.34),black);
  cabinFloor.position.set(0,.76,-.12);car.add(cabinFloor);
  for(const side of [-1,1]){
    for(const z of [.16,-.48]){
      const seatBase=new THREE.Mesh(new THREE.BoxGeometry(.58,.16,.58),upholstery);
      seatBase.position.set(side*W*.19,.91,z);car.add(seatBase);
      const seatBack=new THREE.Mesh(new THREE.BoxGeometry(.58,.62,.17),upholstery);
      seatBack.position.set(side*W*.19,1.19,z-.19);seatBack.rotation.x=-.08;car.add(seatBack);
      const headrest=new THREE.Mesh(new THREE.BoxGeometry(.32,.2,.16),seatAccent);
      headrest.position.set(side*W*.19,1.58,z-.18);car.add(headrest);
      const seatStripe=new THREE.Mesh(new THREE.BoxGeometry(.035,.42,.025),seatAccent);
      seatStripe.position.set(side*W*.19,1.2,z-.095);car.add(seatStripe);
    }
    const doorPanel=new THREE.Mesh(new THREE.BoxGeometry(.09,.22,L*.27),upholstery);
    doorPanel.position.set(side*W*.37,.91,-.13);car.add(doorPanel);
    const innerHandle=new THREE.Mesh(new THREE.BoxGeometry(.045,.035,.18),chrome);
    innerHandle.position.set(side*W*.405,1.02,-.04);car.add(innerHandle);
  }
  const dashboard=new THREE.Mesh(new THREE.BoxGeometry(W*.72,.22,.3),dashMat);
  dashboard.position.set(0,1.02,.48);car.add(dashboard);
  const instrumentPanel=new THREE.Mesh(new THREE.BoxGeometry(.48,.13,.035),black);
  instrumentPanel.position.set(-.25,1.16,.48);car.add(instrumentPanel);
  const centerScreen=new THREE.Mesh(new THREE.BoxGeometry(.28,.17,.035),screenMat);
  centerScreen.position.set(.12,1.17,.48);car.add(centerScreen);
  const consoleBase=new THREE.Mesh(new THREE.BoxGeometry(.3,.12,.62),dashMat);
  consoleBase.position.set(0,.91,-.08);car.add(consoleBase);  const gearLever=new THREE.Mesh(new THREE.CylinderGeometry(.035,.045,.22,8),chrome);
  gearLever.position.set(-.02,1.08,.04);car.add(gearLever);
  const steeringColumn=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.32,10),black);
  steeringColumn.rotation.x=Math.PI/2;steeringColumn.position.set(-.42,1.08,.43);car.add(steeringColumn);
  const steeringWheel=new THREE.Mesh(new THREE.TorusGeometry(.19,.025,8,20),black);
  steeringWheel.position.set(-.42,1.2,.59);car.add(steeringWheel);
  const wheelHub=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,.055,10),chrome);
  wheelHub.rotation.x=Math.PI/2;wheelHub.position.set(-.42,1.2,.59);car.add(wheelHub);
  for(let n=0;n<3;n++){
    const spoke=new THREE.Mesh(new THREE.BoxGeometry(.025,.32,.025),chrome);
    spoke.position.set(-.42,1.2,.59);spoke.rotation.z=n*Math.PI/3;car.add(spoke);
  }
  const frontGlass=new THREE.Mesh(new THREE.BoxGeometry(W*.76,.04,.58),glass);frontGlass.position.set(0,1.34,L*.16);frontGlass.rotation.x=-.42;car.add(frontGlass);
  const backGlass=new THREE.Mesh(new THREE.BoxGeometry(W*.72,.04,.48),glass);backGlass.position.set(0,1.31,-L*.34);backGlass.rotation.x=.48;car.add(backGlass);
  for(const side of [-1,1]){
    const mirror=new THREE.Mesh(new THREE.BoxGeometry(.2,.13,.24),mirrorFinish);mirror.position.set(side*W*.53,1.03,.48);car.add(mirror);
    const mirrorGlass=new THREE.Mesh(new THREE.BoxGeometry(.012,.085,.17),new THREE.MeshPhysicalMaterial({color:0x9bb5c5,metalness:.95,roughness:.09,clearcoat:1,clearcoatRoughness:.025}));mirrorGlass.position.set(side*(W*.53+.103),1.035,.48);car.add(mirrorGlass);
    for(const zw of [-L*.32,L*.32]){
      const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.37,.37,.24,32),black);wheel.rotation.z=Math.PI/2;wheel.position.set(side*(W*.51),.42,zw);car.add(wheel);
      const tyreShoulder=new THREE.Mesh(new THREE.TorusGeometry(.315,.055,10,32),black);tyreShoulder.rotation.y=Math.PI/2;tyreShoulder.position.copy(wheel.position);car.add(tyreShoulder);
      const rim=new THREE.Mesh(new THREE.CylinderGeometry(.235,.235,.245,24),chrome);rim.rotation.z=Math.PI/2;rim.position.copy(wheel.position);car.add(rim);customRims.push(rim);
    }
    const head=new THREE.Mesh(new THREE.BoxGeometry(.42,.15,.09),light);head.position.set(side*W*.34,.78,L*.512);car.add(head);headlights.push(head);
    const headLens=new THREE.Mesh(new THREE.BoxGeometry(.44,.17,.035),lens);headLens.position.set(side*W*.34,.78,L*.535);car.add(headLens);
    const drl=new THREE.Mesh(new THREE.BoxGeometry(.34,.025,.018),new THREE.MeshBasicMaterial({color:0xffffff}));drl.position.set(side*W*.34,.735,L*.556);car.add(drl);
    const rearLight=new THREE.Mesh(new THREE.BoxGeometry(.38,.15,.09),tail);rearLight.position.set(side*W*.34,.78,-L*.512);car.add(rearLight);
    const rearLens=new THREE.Mesh(new THREE.BoxGeometry(.4,.17,.025),lens);rearLens.position.set(side*W*.34,.78,-L*.54);car.add(rearLens);
  }
  const grille=new THREE.Mesh(new THREE.BoxGeometry(W*.48,.2,.075),black);grille.position.set(0,.64,L*.51);car.add(grille);
  for(let slat=0;slat<7;slat++){const bar=new THREE.Mesh(new THREE.BoxGeometry(.025,.15,.025),black);bar.position.set((slat-3)*W*.055,.64,L*.535);car.add(bar);}
  // Eigenständiges Frankfurt-Life-Roundel statt eines kopierten Herstellerlogos.
  const badge=new THREE.Group();
  const badgeBase=new THREE.Mesh(new THREE.CylinderGeometry(.105,.105,.035,32),badgeDark);badgeBase.rotation.x=Math.PI/2;badge.add(badgeBase);
  const badgeFace=new THREE.Mesh(new THREE.CircleGeometry(.082,32),badgeBlue);badgeFace.position.z=.02;badge.add(badgeFace);
  const badgeCrossV=new THREE.Mesh(new THREE.BoxGeometry(.025,.15,.009),badgeWhite);badgeCrossV.position.z=.028;badge.add(badgeCrossV);
  const badgeCrossH=new THREE.Mesh(new THREE.BoxGeometry(.15,.025,.009),badgeWhite);badgeCrossH.position.z=.028;badge.add(badgeCrossH);
  const badgeRing=new THREE.Mesh(new THREE.TorusGeometry(.097,.009,8,32),chrome);badgeRing.position.z=.024;badge.add(badgeRing);
  badge.position.set(0,.79,L*.548);car.add(badge);
  const rearBadge=badge.clone();rearBadge.position.set(0,.82,-L*.548);rearBadge.rotation.y=Math.PI;car.add(rearBadge);
  // Kleine Karosserie-Details: Türgriffe, Seitenschweller und Auspuffrohre.
  for(const side of [-1,1]){
    const handle=new THREE.Mesh(new THREE.BoxGeometry(.055,.07,.28),chrome);handle.position.set(side*W*.505,.91,-.12);car.add(handle);
    const sill=new THREE.Mesh(new THREE.BoxGeometry(.09,.16,L*.58),black);sill.position.set(side*W*.5,.39,0);car.add(sill);
    const archTrim=new THREE.Mesh(new THREE.TorusGeometry(.39,.045,6,16,Math.PI),black);archTrim.rotation.z=Math.PI;archTrim.rotation.y=Math.PI/2;archTrim.position.set(side*W*.52,.43,L*.32);car.add(archTrim);
  }
  const exhaust=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.18,10),chrome);exhaust.rotation.x=Math.PI/2;exhaust.position.set(W*.3,.36,-L*.52);car.add(exhaust);
  const bumper=new THREE.Mesh(new THREE.BoxGeometry(W*1.02,.16,.16),chrome);bumper.position.set(0,.39,L*.51);car.add(bumper);
  const crackMat=new THREE.LineBasicMaterial({color:0xd9f4ff,transparent:true,opacity:.85});
  const crackPoints=[new THREE.Vector3(-.45,1.34,.19),new THREE.Vector3(-.1,1.15,.2),new THREE.Vector3(.1,1.3,.2),new THREE.Vector3(.42,1.17,.2)];
  const crack=new THREE.Line(new THREE.BufferGeometry().setFromPoints(crackPoints),crackMat);crack.visible=false;car.add(crack);
  const scratchMat=new THREE.LineBasicMaterial({color:0xd6d0c6,transparent:true,opacity:.72});
  const scratches=[0,1,2,3].map(i=>{const z=-.8+i*.48;const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-W*.48,.7,z),new THREE.Vector3(-W*.49,.78,z+.22),new THREE.Vector3(-W*.48,.72,z+.38)]),scratchMat);line.visible=false;car.add(line);return line;});
  const dentMat=new THREE.MeshStandardMaterial({color:0x45464b,roughness:.9});
  const sideDents=[-1,1].map(side=>{const dent=new THREE.Mesh(new THREE.SphereGeometry(.22,8,6),dentMat);dent.scale.set(.08,.22,.48);dent.position.set(side*W*.505,.69,.12);dent.visible=false;car.add(dent);return dent;});
  const frontBumper=new THREE.Mesh(new THREE.BoxGeometry(W*1.02,.16,.18),black);frontBumper.position.set(0,.42,L*.52);car.add(frontBumper);
  const rearBumper=new THREE.Mesh(new THREE.BoxGeometry(W*1.02,.16,.18),black);rearBumper.position.set(0,.42,-L*.52);car.add(rearBumper);
  const hoodDent=new THREE.Mesh(new THREE.SphereGeometry(.55,12,8),new THREE.MeshStandardMaterial({color:0x20252b,roughness:.95}));hoodDent.scale.set(1,.08,.55);hoodDent.position.set(0,.94,L*.32);hoodDent.visible=false;car.add(hoodDent);
  const smoke=new THREE.Mesh(new THREE.SphereGeometry(.32,8,6),new THREE.MeshBasicMaterial({color:0x5d6268,transparent:true,opacity:.5}));smoke.position.set(0,1.8,-L*.28);smoke.visible=false;car.add(smoke);
  car.userData.damageParts={paint,bumper,crack,frontBumper,rearBumper,hoodDent,smoke,scratches,sideDents,headlights,originalColor:paint.color.getHex()};
  // Zusätzliche Rad- und Karosseriedetails für eine deutlich ausgearbeitete Silhouette.
  const rubber=new THREE.MeshStandardMaterial({color:0x090c10,roughness:.96});
  const rimDark=new THREE.MeshStandardMaterial({color:0x26313b,metalness:.72,roughness:.3});
  const brakeMetal=new THREE.MeshStandardMaterial({color:0x89939c,metalness:.86,roughness:.28});
  for(const side of [-1,1]){
    for(const z of [-L*.32,L*.32]){
      const wheelCenter=new THREE.Vector3(side*W*.51,.42,z);
      const rimRing=new THREE.Mesh(new THREE.TorusGeometry(.245,.025,8,24),chrome);
      rimRing.rotation.y=Math.PI/2;rimRing.position.copy(wheelCenter);car.add(rimRing);
      const hub=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.215,12),rimDark);
      hub.rotation.z=Math.PI/2;hub.position.copy(wheelCenter);car.add(hub);
      for(let spoke=0;spoke<5;spoke++){
        const angle=spoke*Math.PI*2/5;
        const spokeMesh=new THREE.Mesh(new THREE.BoxGeometry(.045,.27,.045),brakeMetal);
        spokeMesh.position.set(wheelCenter.x,wheelCenter.y+Math.sin(angle)*.105,wheelCenter.z+Math.cos(angle)*.105);
        spokeMesh.rotation.x=angle;spokeMesh.rotation.y=Math.PI/2;car.add(spokeMesh);
      }
      const caliper=new THREE.Mesh(new THREE.BoxGeometry(.08,.2,.13),new THREE.MeshStandardMaterial({color:model==='super'?0xc32e35:0x8b3333,metalness:.35,roughness:.5}));
      caliper.position.set(wheelCenter.x+side*.12,wheelCenter.y+.12,wheelCenter.z-.13);car.add(caliper);
    }
    const mirrorStem=new THREE.Mesh(new THREE.BoxGeometry(.09,.06,.2),black);
    mirrorStem.position.set(side*W*.49,1.04,.49);car.add(mirrorStem);
    const indicator=new THREE.Mesh(new THREE.BoxGeometry(.035,.045,.22),new THREE.MeshBasicMaterial({color:0xffb52e}));
    indicator.position.set(side*W*.505,.86,L*.18);car.add(indicator);
    const lowerSill=new THREE.Mesh(new THREE.BoxGeometry(.11,.12,L*.62),black);
    lowerSill.position.set(side*W*.49,.35,0);car.add(lowerSill);
  }
  // Präzisere Haubenkanten, seitliche Luftauslässe und dunkle Diffusor-Akzente.
  for(const side of [-1,1]){
    const hoodCrease=new THREE.Mesh(new THREE.BoxGeometry(.025,.018,L*.27),chrome);hoodCrease.position.set(side*W*.31,.94,L*.31);car.add(hoodCrease);
    const fenderVent=new THREE.Mesh(new THREE.BoxGeometry(.035,.16,.3),black);fenderVent.position.set(side*W*.505,.77,.63);car.add(fenderVent);
    for(let vent=0;vent<3;vent++){const fin=new THREE.Mesh(new THREE.BoxGeometry(.018,.012,.22),chrome);fin.position.set(side*W*.526,.76,.55+vent*.065);car.add(fin);}
  }
  const frontIntake=new THREE.Mesh(new THREE.BoxGeometry(W*.62,.13,.045),black);
  frontIntake.position.set(0,.48,L*.525);car.add(frontIntake);
  for(const side of [-1,1]){
    const intakeFin=new THREE.Mesh(new THREE.BoxGeometry(.045,.11,.05),chrome);
    intakeFin.position.set(side*W*.22,.49,L*.53);car.add(intakeFin);
  }
  const rearDiffuser=new THREE.Mesh(new THREE.BoxGeometry(W*.7,.12,.22),black);
  rearDiffuser.position.set(0,.34,-L*.52);car.add(rearDiffuser);
  for(const side of [-1,1]){
    const exhaustTip=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.12,12),chrome);
    exhaustTip.rotation.x=Math.PI/2;exhaustTip.position.set(side*W*.31,.37,-L*.55);car.add(exhaustTip);
  }
  if(model==='super'){
    const splitter=new THREE.Mesh(new THREE.BoxGeometry(W*1.03,.08,.35),black);splitter.position.set(0,.36,L*.53);car.add(splitter);
    const wing=new THREE.Mesh(new THREE.BoxGeometry(W*.78,.07,.25),black);wing.position.set(0,1.03,-L*.48);car.add(wing);
  }
  if(model==='hatch'){
    const spoiler=new THREE.Mesh(new THREE.BoxGeometry(W*.65,.07,.2),black);spoiler.position.set(0,1.35,-L*.43);car.add(spoiler);
  }
  // Eigenständige Karosserie-Details je Fahrzeugklasse.
  const addDetail=(geometry,material,x,y,z,rx=0,ry=0,rz=0)=>{
    const part=new THREE.Mesh(geometry,material);part.position.set(x,y,z);part.rotation.set(rx,ry,rz);car.add(part);return part;
  };
  const accent=new THREE.MeshStandardMaterial({color:model==='sportback'?0x39b9d4:0x343d46,metalness:.65,roughness:.3});
  const trim=new THREE.MeshStandardMaterial({color:0x111820,roughness:.72});
  const rubberSeal=new THREE.MeshStandardMaterial({color:0x080b0f,roughness:.88});
  const carbon=new THREE.MeshStandardMaterial({color:0x202830,metalness:.48,roughness:.38});
  const reflector=new THREE.MeshStandardMaterial({color:0xe8f2f7,metalness:.82,roughness:.16});
  const redReflector=new THREE.MeshStandardMaterial({color:0xb51d2b,metalness:.42,roughness:.25});
  // Zusätzliche feinere Bauteile: Scheibendichtungen, Säulen, Türfugen und Glasdetails.
  for(const side of [-1,1]){
    for(const z of [-.48,.18]){
      addDetail(new THREE.BoxGeometry(.035,.46,.045),carbon,side*W*.405,1.25,z);
    }
    addDetail(new THREE.BoxGeometry(.035,.38,.045),carbon,side*W*.405,1.25,-.12);
    addDetail(new THREE.BoxGeometry(.055,.035,L*.3),rubberSeal,side*W*.405,1.48,-.12);
    addDetail(new THREE.BoxGeometry(.055,.035,L*.3),rubberSeal,side*W*.405,1.025,-.12);
    // Türfugen und dezente Seitenreflektoren.
    for(const z of [-.28,.28]){
      const seam=addDetail(new THREE.BoxGeometry(.012,.48,.012),rubberSeal,side*W*.502,.79,z);
      seam.material= new THREE.MeshBasicMaterial({color:0x20252b});
    }
    addDetail(new THREE.BoxGeometry(.025,.075,.18),redReflector,side*W*.505,.68,-L*.43);
    addDetail(new THREE.BoxGeometry(.025,.045,.16),reflector,side*W*.505,.68,L*.42);
    // Außenspiegel mit separater Spiegelfläche.
    addDetail(new THREE.BoxGeometry(.025,.075,.15),reflector,side*W*.565,1.055,.48);
  }
  // Frontscheibenwischer und feine Dichtlippen.
  for(const side of [-1,1]){
    const wiper=addDetail(new THREE.BoxGeometry(.018,.018,.52),black,side*.19,1.31,L*.17,-.42,0,side*.08);
    wiper.material=black;
  }
  // Park-Sensoren und Abschleppösen als kleine, sichtbare Karosseriedetails.
  for(const side of [-1,1]){
    for(const offset of [-.31,0,.31]){
      const sensor=addDetail(new THREE.CircleGeometry(.025,12),chrome,side*W*.34,.43,L*.535,0,0,0);
      sensor.scale.setScalar(.72);
      sensor.position.x=offset;
    }
  }
  // Mehr Tiefe an den Leuchten: Reflektoren und getrennte LED-Segmente.
  for(const side of [-1,1]){
    addDetail(new THREE.BoxGeometry(.12,.07,.018),reflector,side*W*.34,.79,L*.548);
    addDetail(new THREE.BoxGeometry(.13,.035,.018),redReflector,side*W*.34,.79,-L*.548);
    for(let led=0;led<3;led++){
      addDetail(new THREE.BoxGeometry(.025,.018,.012),light,side*W*.34-.04+led*.04,.78,L*.55);
    }
  }
  // Seitenschweller und Stoßfänger erhalten zusätzliche mehrlagige Kanten.
  addDetail(new THREE.BoxGeometry(W*.94,.055,.12),carbon,0,.31,L*.5);
  addDetail(new THREE.BoxGeometry(W*.94,.055,.12),carbon,0,.31,-L*.5);
  // Seitenscheiben und klar erkennbare Fensterrahmen.
  for(const side of [-1,1]){
    const sideWindow=addDetail(new THREE.BoxGeometry(.035,.39,L*.29),glass,side*W*.397,1.25,-.12,0,0,0);
    addDetail(new THREE.BoxGeometry(.045,.045,L*.31),accent,side*W*.405,1.49,-.12);
    addDetail(new THREE.BoxGeometry(.045,.045,L*.31),accent,side*W*.405,1.02,-.12);
  }
  // Vier ausgearbeitete Radläufe mit separaten Kotflügel-Akzenten.
  for(const side of [-1,1])for(const z of [-L*.32,L*.32]){
    const arch=addDetail(new THREE.TorusGeometry(.405,.055,7,20,Math.PI),paint,side*W*.515,.43,z,0,Math.PI/2,Math.PI);
    arch.scale.set(1,1,1);
  }
  if(model==='sedan'||model==='sportback'){
    addDetail(new THREE.BoxGeometry(W*.52,.24,.075),model==='sportback'?accent:chrome,0,.68,L*.515);
    for(let i=-2;i<=2;i++)addDetail(new THREE.BoxGeometry(.035,.2,.025),model==='sportback'?trim:black,i*W*.085,.68,L*.56);
    addDetail(new THREE.BoxGeometry(W*.72,.055,.12),chrome,0,.94,-L*.51);
  }
  if(model==='coupe'){
    addDetail(new THREE.BoxGeometry(W*.78,.12,.38),paint,0,.93,-L*.39);
    addDetail(new THREE.BoxGeometry(W*.72,.07,.16),accent,0,1.18,-L*.46);
    for(const side of [-1,1])addDetail(new THREE.BoxGeometry(.16,.09,.42),black,side*W*.39,.66,L*.05);
  }
  if(model==='van'){
    for(const side of [-1,1]){
      addDetail(new THREE.BoxGeometry(.045,.5,L*.34),accent,side*W*.505,.94,-L*.22);
      addDetail(new THREE.BoxGeometry(.05,.08,.72),chrome,side*W*.51,.68,-L*.22);
      addDetail(new THREE.BoxGeometry(.045,.34,.72),glass,side*W*.505,1.38,-L*.22);
    }
    addDetail(new THREE.BoxGeometry(W*.78,.09,.12),chrome,0,1.76,-L*.49);
  }
  if(model==='super'){
    addDetail(new THREE.BoxGeometry(W*.72,.08,.72),trim,0,.68,-L*.28);
    for(const side of [-1,1]){
      addDetail(new THREE.BoxGeometry(.18,.06,.65),accent,side*W*.38,.69,L*.05);
      addDetail(new THREE.BoxGeometry(.32,.07,.16),light,side*W*.34,.78,L*.555);
    }
    addDetail(new THREE.BoxGeometry(W*.88,.12,.22),black,0,.36,-L*.53);
  }
  if(police){
    const bar=new THREE.Mesh(new THREE.BoxGeometry(1.05,.13,.25),black);bar.position.set(0,1.58,-.12);car.add(bar);
    const red=new THREE.Mesh(new THREE.BoxGeometry(.42,.15,.25),new THREE.MeshBasicMaterial({color:0xff243e}));
    const blue=new THREE.Mesh(new THREE.BoxGeometry(.42,.15,.25),new THREE.MeshBasicMaterial({color:0x247bff}));
    red.position.set(-.28,1.6,-.12);blue.position.set(.28,1.6,-.12);car.add(red,blue);
    car.userData.lights=[red,blue];policeCars.push(car);
  }
  const tuningSpoiler=new THREE.Group();const spoilerWing=new THREE.Mesh(new THREE.BoxGeometry(W*.76,.075,.25),new THREE.MeshStandardMaterial({color:0x111820,metalness:.48,roughness:.32}));spoilerWing.position.y=1.38; tuningSpoiler.add(spoilerWing);for(const side of [-1,1]){const support=new THREE.Mesh(new THREE.BoxGeometry(.07,.25,.08),black);support.position.set(side*W*.24,1.25,0);tuningSpoiler.add(support);}tuningSpoiler.position.z=-L*.47;tuningSpoiler.visible=false;car.add(tuningSpoiler);
  car.userData.tuningParts={spoiler:tuningSpoiler,glass,rims:customRims};
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
 {name:'Stadtwerke',vehicle:'service',desc:'Fahre zu einer gemeldeten Störung.'},
 {name:'Flughafen-Shuttle',vehicle:'van',desc:'Bringe Reisende pünktlich zum Terminal und hole die nächste Gruppe ab.'},
 {name:'Hotel-Concierge',vehicle:'mercedes',desc:'Fahre Gäste zwischen Hotel, Innenstadt und Mainufer.'},
 {name:'Fahrradkurier',vehicle:'golf',desc:'Stelle wichtige Dokumente an drei Adressen im Zentrum zu.'},
 {name:'Pannenhilfe',vehicle:'service',desc:'Fahre zu einem liegengebliebenen Fahrzeug und liefere Werkzeug.'},
 {name:'Event-Logistik',vehicle:'van',desc:'Transportiere Veranstaltungsmaterial zum Gelände am Main.'},
 {name:'Nacht-Express',vehicle:'audi',desc:'Liefere eine eilige Sendung durch die beleuchtete Innenstadt.'}
];
let jobPanel,careerHud,jobActive=false,jobCar=null,jobDestination=null;
let driving=false,carSpeed=0,carSlip=0,carYawRate=0,careerMoney=0,completedJobs=0;
let damageLevel=0,damageHud=null,damageFlash=0,cameraLookOffset=0,damageCooldown=0,flSavedDamage=0;
let speedometerHud=null,speedometerLastGear=1;
const emergencyVehicles=[];
const breakableProps=[];let lookDrag=false,lastPointerX=0,lastPointerY=0;
function buildCutsceneUI(){
 cutsceneOverlay=document.createElement('div');cutsceneOverlay.id='cutsceneOverlay';cutsceneOverlay.className='cutscene-overlay hidden';
 cutsceneOverlay.innerHTML='<div class="cinema-top"></div><div class="cinema-bottom"><div class="cinema-kicker">FRANKFURT LIFE · AUFTRAG</div><div id="cinemaTitle">EIN NEUER TAG IN FRANKFURT</div><p id="cinemaCaption">Dein nächster Auftrag beginnt.</p></div><button id="skipCutscene">ÜBERSPRINGEN ⏭</button><div class="cinema-count" id="cinemaCount">SZENE 1 / 3</div>';
 viewport.appendChild(cutsceneOverlay);cutsceneOverlay.querySelector('#skipCutscene').addEventListener('click',finishCutscene);
}
function buildIntroTutorialUI(){
 introTutorial=document.createElement('section');introTutorial.id='introTutorial';introTutorial.className='tutorial-overlay hidden';
 introTutorial.innerHTML='<div class="tutorial-bars top"></div><div class="tutorial-scene-tag">FRANKFURT LIFE · DAS ERSTE MAL IN FRANKFURT</div><div class="tutorial-content"><div class="tutorial-eyebrow" id="tutorialEyebrow">WILLKOMMEN</div><h1 id="tutorialTitle">DEINE STADT. DEIN ALLTAG.</h1><p id="tutorialText">Frankfurt wartet auf dich. Lerne kurz die wichtigsten Dinge kennen, bevor du losziehst.</p><div class="tutorial-progress" id="tutorialProgress"><i class="active"></i><i></i><i></i><i></i></div><div class="tutorial-actions"><button id="tutorialSkip">TUTORIAL ÜBERSPRINGEN</button><button id="tutorialNext">WEITER <span>→</span></button></div></div><div class="tutorial-bars bottom"></div><div class="tutorial-scene-count" id="tutorialSceneCount">INTRO · 01 / 04</div>';
 viewport.appendChild(introTutorial);
 introTutorial.querySelector('#tutorialNext').addEventListener('click',nextIntroTutorial);
 introTutorial.querySelector('#tutorialSkip').addEventListener('click',finishIntroTutorial);
}
const introTutorialScenes=[
 {tag:'KAPITEL 01 · WILLKOMMEN',title:'DEINE STADT. DEIN ALLTAG.',text:'Du bist neu in Frankfurt. Erkunde Viertel, entdecke Geschäfte und lerne die Stadt Schritt für Schritt kennen.'},
 {tag:'KAPITEL 02 · BEWEGUNG',title:'GEH LOS UND ERKUNDE.',text:'Bewege dich mit WASD oder den Pfeiltasten. Mit der Maus schaust du dich um. Drücke F, wenn du in dein bereitgestelltes Fahrzeug ein- oder aussteigen möchtest.'},
 {tag:'KAPITEL 03 · DEIN WEG',title:'JOBS. AUTOS. NEUE ZIELE.',text:'Mit J öffnest du die Jobzentrale. Wähle einen Beruf, nimm einen Auftrag an und folge dem Zielmarker. Mit C wechselst du die Kameraperspektive.'},
 {tag:'KAPITEL 04 · DEIN SMARTPHONE',title:'ALLES IN DEINER HAND.',text:'Mit F1 öffnest du dein Smartphone. Dort findest du Karte, Garage, Bank, ÖPNV und Taxi. Mit Q öffnest du das Quick-Access-Rad. Viel Spaß in Frankfurt!'}
];
function showIntroTutorialScene(index){
 if(!introTutorial)return;
 const sceneData=introTutorialScenes[index];
 introTutorial.querySelector('#tutorialEyebrow').textContent=sceneData.tag;
 introTutorial.querySelector('#tutorialTitle').textContent=sceneData.title;
 introTutorial.querySelector('#tutorialText').textContent=sceneData.text;
 introTutorial.querySelector('#tutorialSceneCount').textContent='INTRO · 0'+(index+1)+' / 04';
 introTutorial.querySelectorAll('.tutorial-progress i').forEach((el,n)=>el.classList.toggle('active',n<=index));
 const next=introTutorial.querySelector('#tutorialNext');next.innerHTML=index===introTutorialScenes.length-1?'STADT BETRETEN <span>→</span>':'WEITER <span>→</span>';
 const content=introTutorial.querySelector('.tutorial-content');content.classList.remove('tutorial-scene-change');void content.offsetWidth;content.classList.add('tutorial-scene-change');
}
function startIntroTutorial(){
 if(localStorage.getItem('flIntroTutorialDone')==='yes'||!introTutorial)return;
 introTutorial.classList.remove('hidden');document.exitPointerLock?.();showIntroTutorialScene(0);
}
function nextIntroTutorial(){
 const next=Number(introTutorial.dataset.scene||0)+1;
 if(next>=introTutorialScenes.length){finishIntroTutorial();return;}
 introTutorial.dataset.scene=String(next);showIntroTutorialScene(next);
}
function finishIntroTutorial(){
 if(!introTutorial)return;
 localStorage.setItem('flIntroTutorialDone','yes');introTutorial.dataset.scene='0';introTutorial.classList.add('hidden');
 status.textContent='WILLKOMMEN IN FRANKFURT · VIEL SPASS!';
}
function startCutscene(jobName){if(!cutsceneOverlay||!camera||!jobCar)return;cutscene={target:jobCar.position.clone(),jobName};cutsceneElapsed=0;cutsceneOverlay.classList.remove('hidden');document.exitPointerLock?.();cutsceneOverlay.querySelector('#cinemaTitle').textContent='EIN NEUER AUFTRAG';cutsceneOverlay.querySelector('#cinemaCaption').textContent='Frankfurt schläft nie. Heute bist du unterwegs: '+jobName+'.';cutsceneOverlay.querySelector('#cinemaCount').textContent='SZENE 1 / 3 · STADTÜBERBLICK';}
function finishCutscene(){if(!cutscene)return;cutscene=null;cutsceneOverlay?.classList.add('hidden');if(jobCar){camera.position.set(jobCar.position.x+4,3.1,jobCar.position.z+7);yaw=jobCar.rotation.y-Math.PI;}status.textContent='MISSION BEREIT · STEIGE MIT F INS AUTO';}
function updateCutscene(dt){if(!cutscene||!camera)return;cutsceneElapsed+=dt;const t=cutsceneElapsed,car=cutscene.target;if(t<1.5){const k=t/1.5;camera.position.set(car.x+22*(1-k)+5*k,13*(1-k)+4*k,car.z+22*(1-k)+10*k);camera.lookAt(car.x,1,car.z);cutsceneOverlay.querySelector('#cinemaCount').textContent='SZENE 1 / 3 · STADTÜBERBLICK';}else if(t<3){const k=(t-1.5)/1.5;camera.position.set(car.x+5,4,car.z+10-5*k);camera.lookAt(car.x,1,car.z);cutsceneOverlay.querySelector('#cinemaCount').textContent='SZENE 2 / 3 · DEIN FAHRZEUG';cutsceneOverlay.querySelector('#cinemaCaption').textContent='Dein Fahrzeug steht bereit. Mach dich auf den Weg.';}else if(t<4.3){camera.position.set(car.x+2,2.4,car.z+5);camera.lookAt(car.x,1,car.z);cutsceneOverlay.querySelector('#cinemaCount').textContent='SZENE 3 / 3 · AUF DIE STRASSE';}else finishCutscene();}
function buildInGameJobs(){
 jobPanel=document.createElement('div');jobPanel.id='inGameJobs';jobPanel.className='ingame-jobs hidden';
 jobPanel.innerHTML='<div class="ingame-jobs-head"><b>FRANKFURT LIFE / JOBZENTRALE</b><button id="closeJobs" aria-label="Schließen">×</button></div><h3>Wähle deinen Beruf</h3><p class="ingame-jobs-hint">Dein Auftrag und das passende Dienstfahrzeug starten direkt in der 3D-Stadt.</p><div id="ingameJobChoices"></div><div id="ingameJobDetail">Wähle einen Job aus.</div><button id="startJob" class="ingame-start" disabled>AUFTRAG ANNEHMEN</button><small>J oder ESC · Menü schließen</small>';
 viewport.appendChild(jobPanel);
 buildCutsceneUI();
 buildIntroTutorialUI();
 careerHud=document.createElement('div');careerHud.id='careerHud';careerHud.style.cssText='position:absolute;top:14px;right:14px;z-index:8;padding:10px 14px;border:1px solid #ffffff30;border-radius:10px;background:#101b2ddd;color:#fff;font:700 13px/1.6 system-ui;pointer-events:none;';careerHud.innerHTML='KONTO: 0 €<br>AUFTRÄGE: 0<br>★ RUF: 1/5';viewport.appendChild(careerHud);flRefreshCareerHud();
 missionHud=document.createElement('div');missionHud.id='missionHud';missionHud.className='mission-hud hidden';viewport.appendChild(missionHud);
 takeoverHud=document.createElement('div');takeoverHud.id='takeoverHud';takeoverHud.className='takeover-hud hidden';takeoverHud.innerHTML='<b>FILMISCHE EINSTIEGSSEQUENZ</b><span>Kurzer, nicht-grafischer Filmschnitt: Die Person steigt aus und geht zur Seite …</span><div><i></i></div>';viewport.appendChild(takeoverHud);
 damageHud=document.createElement('div');damageHud.id='damageHud';damageHud.className='damage-hud hidden';viewport.appendChild(damageHud);
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
  jobCar.rotation.y=yaw;applyCarTuning(jobCar);damageLevel=flSavedDamage;applyCarDamage(jobCar,damageLevel);if(damageLevel)refreshDamageHud();
  const startX=camera.position.x,startZ=camera.position.z;
  jobStops=selected===0?[[startX+24,startZ-45],[startX-28,startZ-75],[startX+35,startZ-105]]:[[startX+26,startZ-48],[startX-32,startZ-82]];
  jobStops=jobStops.map(([x,z])=>new THREE.Vector3(Math.max(-105,Math.min(105,x)),0,Math.max(-205,Math.min(105,z))));
  jobStopIndex=0;jobDestination=jobStops[0];
  const marker=new THREE.Group();
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.35,.12,8,32),new THREE.MeshBasicMaterial({color:0x36e6d4}));
  ring.rotation.x=Math.PI/2;ring.position.y=.25;marker.add(ring);
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(.12,.5,5,12,1,true),new THREE.MeshBasicMaterial({color:0x36d9c4,transparent:true,opacity:.24,side:THREE.DoubleSide}));
  beam.position.y=2.7;marker.add(beam);marker.position.copy(jobDestination);scene.add(marker);
  jobCar.userData.jobMarker=marker;jobActive=true;
  if(missionHud){missionHud.classList.remove('hidden');missionHud.innerHTML='<b>MISSION AKTIV</b><span>'+job.name+'</span><small id="missionProgress">STOPP 1 / '+jobStops.length+' · Fahre zum Marker</small><div class="mission-track"><i></i></div>';}

  if(careerHud)careerHud.innerHTML='KONTO: '+careerMoney.toLocaleString('de-DE')+' €<br>AUFTRÄGE: '+completedJobs;
  detail.textContent='AUFTRAG AKTIV: '+job.name+' – '+job.desc+' Fahre zum markierten Ziel. (Fahrzeug ist in der Stadt gespawnt.)';
  status.textContent='JOB AKTIV · '+job.name.toUpperCase();
  jobPanel.classList.add('hidden');startCutscene(job.name);
 });
}
function toggleJobs(){
 if(!started||!jobPanel)return;
 jobPanel.classList.toggle('hidden');
 if(!jobPanel.classList.contains('hidden'))document.exitPointerLock?.();
}

function buildMiniMap(){
 const wrap=document.createElement('div');wrap.id='miniMap';wrap.innerHTML='<button class="mini-map-title" id="openFullMap">FRANKFURT · GPS ↗ KARTE ÖFFNEN</button><canvas id="miniMapCanvas" width="220" height="220"></canvas><div class="mini-map-coords" id="miniMapCoords">SEKTOR 01</div>';viewport.appendChild(wrap);
 miniMapCanvas=wrap.querySelector('canvas');miniMapCtx=miniMapCanvas.getContext('2d');wrap.querySelector('#openFullMap').addEventListener('click',()=>{togglePhone();openPhoneApp('map');});
}
function drawCityMap(ctx,w,h,large=false){
 if(!ctx)return;
 const c=ctx;const px=x=>(x+440)/880*w,py=z=>(z+430)/760*h;c.clearRect(0,0,w,h);c.fillStyle='#197fa5';c.fillRect(0,0,w,h);c.fillStyle='#314b48';c.fillRect(0,0,w,py(250));c.fillStyle='#d8c18d';c.fillRect(0,py(250),w,py(330)-py(250));
 // Blocks and local streets across the expanded playable district.
 c.fillStyle='#3b5650';
 for(let x=-405;x<420;x+=30)for(let z=-410;z<245;z+=34){c.fillRect(px(x+2),py(z+2),Math.max(2,px(x+27)-px(x+2)),Math.max(2,py(z+30)-py(z+2)));}
 c.strokeStyle='#9da9a0';c.lineCap='square';c.lineWidth=large?12:7;
 for(const x of [-365,-305,-245,-160,-130,-82,-48,0,48,82,130,160,245,305,365]){c.beginPath();c.moveTo(px(x),0);c.lineTo(px(x),h);c.stroke();}
 for(let z=-390;z<=210;z+=40){c.beginPath();c.moveTo(0,py(z));c.lineTo(w,py(z));c.stroke();}
 c.strokeStyle='#d8d0ad';c.lineWidth=large?2.5:1.5;c.setLineDash([8,7]);c.beginPath();c.moveTo(px(0),0);c.lineTo(px(0),h);c.stroke();c.setLineDash([]);
 // Main river ribbon and district labels.
 c.fillStyle='#347f9c';c.fillRect(0,py(108),w,Math.max(7,py(126)-py(108)));
 c.fillStyle='#d9e6dc';c.font='bold '+(large?15:11)+'px Arial';
 c.fillText('MAIN',px(8),py(119));
 c.fillStyle='#e4d8ad';c.font='bold '+(large?12:9)+'px Arial';
 c.fillText('INNENSTADT',px(-165),py(-90));c.fillText('WOHNVIERTEL',px(95),py(-210));c.fillText('WESTEND',px(-160),py(35));c.fillText('OSTEND',px(105),py(35));c.fillText('SÜDQUARTIER',px(-45),py(175));c.fillText('STRAND & BUCHT',px(-55),py(285));c.fillText('NORDVIERTEL',px(-80),py(-365));c.fillText('LUXUSMEILE',px(265),py(150));
 // Shops and major destinations.
 c.fillStyle='#f1bd59';
 for(const shop of shops){c.beginPath();c.arc(px(shop.x),py(shop.z),large?4:2.5,0,Math.PI*2);c.fill();}
 c.fillStyle='#c8a4f5';c.fillRect(px(dealership.x)-4,py(dealership.z)-4,8,8);
 if(activeBoat){c.fillStyle='#f4e7ad';c.beginPath();c.arc(px(activeBoat.position.x),py(activeBoat.position.z),large?5:3,0,Math.PI*2);c.fill();}if(jobDestination){c.fillStyle='#ffd36b';c.beginPath();c.arc(px(jobDestination.x),py(jobDestination.z),large?6:4,0,Math.PI*2);c.fill();}
 const player=driving&&jobCar?jobCar.position:camera?.position;
 if(player){c.save();c.translate(px(player.x),py(player.z));c.rotate(-yaw);c.fillStyle='#65e6ff';c.strokeStyle='#081522';c.lineWidth=2;c.beginPath();c.moveTo(0,-(large?10:7));c.lineTo(large?7:5,large?8:5);c.lineTo(0,large?5:3);c.lineTo(large?-7:-5,large?8:5);c.closePath();c.fill();c.stroke();c.restore();}
}

function drawMiniMap(){
 if(!miniMapCtx||!camera)return;
 drawCityMap(miniMapCtx,220,220,false);
 const label=document.querySelector('#miniMapCoords');if(label)label.textContent=Math.round(camera.position.x)+' / '+Math.round(camera.position.z);
}

function startShopFilmScene(){if(!currentShop||!shopSceneOverlay)return;shopPanel.classList.add('scene-active');shopScene={elapsed:0,stage:-1,name:currentShop.name};shopSceneOverlay.classList.remove('hidden');document.exitPointerLock?.();updateShopFilmScene(0);}
function updateShopFilmScene(dt){if(!shopScene)return;shopScene.elapsed+=dt;const stage=Math.min(2,Math.floor(shopScene.elapsed/2.15));if(stage!==shopScene.stage){shopScene.stage=stage;const titles=['EIN UNERWARTETER MOMENT','ALARMSTIMMUNG IM LADEN','FILMSCHNITT · SZENE BEENDET'];const captions=['Die Kamera fährt in einer kurzen Einstellung durch '+shopScene.name+'.','Lichtsignale und Musik markieren die fiktive Action-Szene. Die Handlung bleibt abstrakt und ohne Gewalt.','Die Szene blendet aus. Du kannst wieder frei durch die Stadt gehen.'];const title=shopSceneOverlay.querySelector('#shopSceneTitle'),caption=shopSceneOverlay.querySelector('#shopSceneCaption'),step=shopSceneOverlay.querySelector('#shopSceneStep');if(title)title.textContent=titles[stage];if(caption)caption.textContent=captions[stage];if(step)step.textContent='SZENE '+(stage+1)+' / 3';}if(shopScene.elapsed>=6.6)finishShopFilmScene();}
function finishShopFilmScene(){if(!shopScene)return;shopScene=null;shopSceneOverlay?.classList.add('hidden');shopPanel?.classList.remove('scene-active');shopPanel?.classList.add('hidden');currentShop=null;if(status)status.textContent='FILMISCHE SHOP-SZENE BEENDET · KEINE SPIELWELT-AKTION';}

function buildShopInteraction(){
 shopPanel=document.createElement('div');shopPanel.id='shopPanel';shopPanel.className='ingame-jobs hidden';
 shopPanel.innerHTML='<div class="ingame-jobs-head"><b id="shopTitle">FRANKFURT LIFE / GESCHÄFT</b><button id="closeShop" aria-label="Schließen">×</button></div><h3 id="shopName">Geschäft</h3><p id="shopSubtitle" class="ingame-jobs-hint"></p><div id="shopProducts"></div><button id="shopFilmScene" class="shop-film-scene">🎬 FILMISCHE SHOP-ACTION-SZENE</button><div id="shopMessage" role="status">Wähle etwas aus.</div><small>E oder ESC · Schließen</small><div id="shopSceneOverlay" class="shop-scene-overlay hidden"><div class="shop-scene-frame"><span>FRANKFURT LIFE · FILM-MODUS</span><h2 id="shopSceneTitle">SHOP-SZENE</h2><p id="shopSceneCaption">Eine fiktive, nicht-grafische Filmszene.</p><small id="shopSceneStep">SZENE 1 / 3</small><button id="shopSceneSkip">SZENE ÜBERSPRINGEN</button></div></div>';
 viewport.appendChild(shopPanel);
 shopPanel.querySelector('#closeShop').addEventListener('click',()=>{shopPanel.classList.add('hidden');currentShop=null;});shopPanel.querySelector('#shopFilmScene').addEventListener('click',startShopFilmScene);shopSceneOverlay=shopPanel.querySelector('#shopSceneOverlay');shopPanel.querySelector('#shopSceneSkip').addEventListener('click',finishShopFilmScene);
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
  const stockCount=inventory[item.name]||0;
  button.innerHTML='<b>'+item.name+' · '+item.price.toLocaleString('de-DE')+' €</b><span>'+(item.kind==='tuning'?'Werkstatt-Service':item.kind==='fuel'?'Tankfüllung':'Kaufen · Im Inventar: '+stockCount)+'</span>';
  button.addEventListener('click',()=>{
   const message=shopPanel.querySelector('#shopMessage');
   if(careerMoney<item.price){message.textContent='Dafür fehlt dir noch Geld. Erledige einen Auftrag mit J.';return;}
   careerMoney-=item.price;
   if(['Brot','Brezel','Croissant','Kuchen','Kaffee','Snack','Pizza','Pasta','Limo','Burger-Menü','Schnitzel','Salat','Cola'].includes(item.name)){inventory[item.name]=(inventory[item.name]||0)+1;message.textContent=item.name+' gekauft · im Inventar: '+inventory[item.name];}
   else if(item.kind==='fuel'){flFuel=Math.min(100,flFuel+(item.name.includes('25')?25:item.name.includes('50')?50:100));message.textContent='Getankt · Tankfüllung '+Math.round(flFuel)+'%';flUpdateStatus();}
   else if(item.kind==='tuning'){
    if(!jobCar){message.textContent='Wähle zuerst ein Auto über die Garage oder einen Auftrag.';careerMoney+=item.price;return;}
    if(item.id==='repair'){if(damageLevel===0){message.textContent='Dein Fahrzeug ist bereits unbeschädigt.';careerMoney+=item.price;}else{damageLevel=0;applyCarDamage(jobCar,0);flSavedDamage=0;message.textContent='Reparatur abgeschlossen · Fahrzeugzustand 100 %';flSaveGame();}}else if(item.id==='engine'){if(tuningLevel>=3){careerMoney+=item.price;message.textContent='Motor bereits auf Maximalstufe.';}else{tuningLevel++;message.textContent='Motor-Upgrade eingebaut · Leistungsstufe '+tuningLevel+'/3';}}
    else if(item.id==='turbo'){if(turboLevel>=2){careerMoney+=item.price;message.textContent='Turbo bereits auf Maximalstufe.';}else{turboLevel++;message.textContent='Turbo-Kit installiert · Stufe '+turboLevel+'/2';}}
    else if(item.id==='paint'){paintLevel++;const colors=[0x1687d9,0x19a875,0xd4a62a,0x9b58bd,0xb51e2b,0xf0f0e8,0x171b22,0x6d202b];const color=colors[paintLevel%colors.length];if(jobCar.userData.damageParts){jobCar.userData.damageParts.originalColor=color;jobCar.userData.damageParts.paint.color.setHex(color);}message.textContent='Neue Lackierung montiert · Farbton '+(paintLevel%colors.length+1)+'/8';}
    else if(item.id==='wheels'){tuningMods.rims=true;applyCarTuning(jobCar);message.textContent='Sportfelgen montiert!';}
    else if(item.id==='spoiler'){if(tuningMods.spoiler){careerMoney+=item.price;message.textContent='Heckspoiler bereits montiert.';}else{tuningMods.spoiler=true;applyCarTuning(jobCar);message.textContent='Heckspoiler montiert!';}}
    else if(item.id==='lowered'){if(tuningMods.lowered){careerMoney+=item.price;message.textContent='Sportfahrwerk bereits eingebaut.';}else{tuningMods.lowered=true;applyCarTuning(jobCar);message.textContent='Sportfahrwerk montiert · Fahrzeug tiefergelegt.';}}
    else if(item.id==='tint'){if(tuningMods.tinted){careerMoney+=item.price;message.textContent='Scheiben sind bereits getönt.';}else{tuningMods.tinted=true;applyCarTuning(jobCar);message.textContent='Scheiben dezent getönt.';}}
   }else{inventory[item.name]=(inventory[item.name]||0)+1;message.textContent=item.name+' gekauft! Im Inventar: '+inventory[item.name];}
   if(careerHud)careerHud.innerHTML='KONTO: '+careerMoney.toLocaleString('de-DE')+' €<br>AUFTRÄGE: '+completedJobs+'<br>★ RUF: '+Math.min(5,1+Math.floor(completedJobs/2))+'/5';
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
 // Zusätzliche Fahrzeuge auf dem Hauptstraßenzug sorgen für sichtbareren Stadtverkehr.
 if(!liteMode)for(let i=0;i<8;i++){
  const direction=i<4?1:-1,lane=direction>0?-6.1:6.1;
  const car=makeCar(lane,-103+(i%4)*42,[0x263746,0xb9c5d0,0x7b3034,0xe0e4e6][i%4],false,['sedan','hatch','sportback','van'][i%4]);
  car.rotation.y=direction>0?0:Math.PI;
  car.userData.traffic={direction,speed:.045+(i%3)*.012};
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
 for(let i=0;i<(liteMode?5:14);i++){
  const x=25+(i%4)*4.2,z=-108+Math.floor(i/4)*36+(i%3)*3;
  makePedestrian(x,z,24+i);
 }
}

function buildFrankfurtLandmarks(){
 const stone=new THREE.MeshStandardMaterial({color:0xc5b69b,roughness:.88}),darkStone=new THREE.MeshStandardMaterial({color:0x756a5d,roughness:.9}),glass=new THREE.MeshStandardMaterial({color:0x7899a9,metalness:.35,roughness:.22}),roof=new THREE.MeshStandardMaterial({color:0x394553,roughness:.82});
 // Mainufer und Wasserband mit Uferpromenaden
 const water=new THREE.Mesh(new THREE.PlaneGeometry(250,30),new THREE.MeshStandardMaterial({color:0x397e99,roughness:.22,metalness:.25}));
 water.rotation.x=-Math.PI/2;water.position.set(0,-.025,-168);scene.add(water);
 for(const z of [-185,-151]){
  const bank=new THREE.Mesh(new THREE.BoxGeometry(250,.32,2.4),stone);bank.position.set(0,.12,z);scene.add(bank);
  for(let x=-110;x<115;x+=18)tree(x,z+(z< -170?-2:2));
 }
 // Eiserner-Steg-inspirierte Fußgängerbrücke
 const bridge=new THREE.Group();
 const deck=new THREE.Mesh(new THREE.BoxGeometry(34,.45,3.2),darkStone);deck.position.y=2.2;bridge.add(deck);
 for(const x of [-15,15]){const tower=new THREE.Mesh(new THREE.BoxGeometry(.55,8,.55),roof);tower.position.set(x,6,0);bridge.add(tower);}
 for(let x=-14;x<=14;x+=2){const cable=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,7,6),new THREE.MeshStandardMaterial({color:0xb6b8b3,metalness:.7}));cable.position.set(x,5.3,0);cable.rotation.z=(x/15)*.38;bridge.add(cable);}
 bridge.position.set(0,0,-168);scene.add(bridge);
 // Bankenviertel-Silhouette mit schlanken Glastürmen
 const towers=[[-66,-120,14,13,68],[-48,-105,12,12,54],[-30,-126,13,13,82],[-10,-110,12,12,48],[12,-128,13,12,72],[34,-112,12,12,58],[54,-132,14,13,76],[74,-108,12,12,50]];
 for(const [x,z,w,d,h] of towers){
  const g=new THREE.Group();const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),glass);body.position.y=h/2;g.add(body);
  for(let y=5;y<h;y+=5){const band=new THREE.Mesh(new THREE.BoxGeometry(w+.08,.12,d+.08),new THREE.MeshStandardMaterial({color:0xb4c6cc,metalness:.5,roughness:.3}));band.position.y=y;g.add(band);}
  const crown=new THREE.Mesh(new THREE.BoxGeometry(w*.72,.9,d*.72),roof);crown.position.y=h+.4;g.add(crown);g.position.set(x,0,z);scene.add(g);
 }
 // Main Tower-artiger Aussichtsturm
 const tower=new THREE.Group();const shaft=new THREE.Mesh(new THREE.BoxGeometry(9,82,9),glass);shaft.position.y=41;tower.add(shaft);
 const deck1=new THREE.Mesh(new THREE.BoxGeometry(13,2,13),darkStone);deck1.position.y=70;tower.add(deck1);
 const deck2=new THREE.Mesh(new THREE.BoxGeometry(11,1.5,11),darkStone);deck2.position.y=75;tower.add(deck2);
 const spire=new THREE.Mesh(new THREE.ConeGeometry(1.2,13,8),roof);spire.position.y=83;tower.add(spire);tower.position.set(-82,0,-72);scene.add(tower);
 // Römerberg: Fachwerk-Rathaus mit Giebeln
 for(let i=0;i<3;i++){
  const g=new THREE.Group();const base=new THREE.Mesh(new THREE.BoxGeometry(9,9,7),stone);base.position.y=4.5;g.add(base);
  const upper=new THREE.Mesh(new THREE.BoxGeometry(8.2,5.5,7.2),new THREE.MeshStandardMaterial({color:0x9a5c42,roughness:.9}));upper.position.y=11.2;g.add(upper);
  for(let y=9;y<15;y+=1.7){const beam=new THREE.Mesh(new THREE.BoxGeometry(8.4,.18,7.35),darkStone);beam.position.y=y;g.add(beam);}
  for(let x=-3;x<=3;x+=2){const beam=new THREE.Mesh(new THREE.BoxGeometry(.16,5.5,7.4),darkStone);beam.position.set(x,11.2,0);g.add(beam);}
  const gable=new THREE.Mesh(new THREE.ConeGeometry(5.4,5.2,4),roof);gable.rotation.y=Math.PI/4;gable.position.set(0,16.5,0);g.add(gable);
  g.position.set(35+i*10,0,-38);scene.add(g);
 }
 // Kaiserdom-inspirierter Kirchturm
 const church=new THREE.Group();const nave=new THREE.Mesh(new THREE.BoxGeometry(16,13,22),stone);nave.position.y=6.5;church.add(nave);
 const steeple=new THREE.Mesh(new THREE.BoxGeometry(6,28,6),darkStone);steeple.position.y=20;church.add(steeple);
 const spire2=new THREE.Mesh(new THREE.ConeGeometry(4.2,18,8),roof);spire2.position.y=43;church.add(spire2);
 church.position.set(58,0,-55);scene.add(church);
 // Stadtbeschilderung
 const signs=[[-18,-18,'ZEIL'],[18,-92,'BANKENVIERTEL'],[48,-34,'RÖMERBERG'],[-30,-155,'MAINUFER']];
 for(const [x,z,label] of signs){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d');
  ctx.fillStyle='#164d70';ctx.fillRect(0,0,512,128);ctx.strokeStyle='#e5f4f5';ctx.lineWidth=7;ctx.strokeRect(5,5,502,118);ctx.fillStyle='#fff';ctx.font='bold 54px Arial';ctx.textAlign='center';ctx.fillText(label,256,82);
  const board=new THREE.Mesh(new THREE.BoxGeometry(5,.95,.12),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(canvas)}));board.position.set(x,4,z);scene.add(board);
 }
}
function makeEmergencyVehicle(x,z,kind){
 const isFire=kind==='fire';const car=makeCar(x,z,isFire?0xc51f28:0xf4f4ef,true,isFire?'van':'sedan');
 car.rotation.y=Math.PI/2;
 if(isFire){
  const tank=new THREE.Mesh(new THREE.BoxGeometry(1.85,1.2,2.5),new THREE.MeshStandardMaterial({color:0xc51f28,roughness:.58}));tank.position.set(0,1.65,-.45);car.add(tank);
  const stripe=new THREE.Mesh(new THREE.BoxGeometry(1.92,.2,2.6),new THREE.MeshStandardMaterial({color:0xf0d34d,metalness:.2}));stripe.position.set(0,1.35,-.45);car.add(stripe);
  const ladder=new THREE.Mesh(new THREE.BoxGeometry(.22,.18,3.1),new THREE.MeshStandardMaterial({color:0xe0dfd5,metalness:.6}));ladder.position.set(0,2.35,-.45);car.add(ladder);
  car.userData.emergencyKind='fire';
 }else{
  const stripe=new THREE.Mesh(new THREE.BoxGeometry(1.96,.18,2.8),new THREE.MeshStandardMaterial({color:0x2468a4,metalness:.25}));stripe.position.set(0,.95,-.2);car.add(stripe);
  car.userData.emergencyKind='police';
 }
 car.userData.emergencyLights=car.userData.lights;
 emergencyVehicles.push(car);return car;
}
function buildEmergencyServices(){
 const wall=new THREE.MeshStandardMaterial({color:0xb9c4c8,roughness:.82}),blue=new THREE.MeshStandardMaterial({color:0x24527a,roughness:.72}),red=new THREE.MeshStandardMaterial({color:0xb7282d,roughness:.72});
 const station=new THREE.Group();const base=new THREE.Mesh(new THREE.BoxGeometry(25,7,15),wall);base.position.y=3.5;station.add(base);
 for(let i=0;i<3;i++){const door=new THREE.Mesh(new THREE.BoxGeometry(.18,4.6,6.2),i===2?red:blue);door.position.set(-12.6,2.7,-5+i*5);station.add(door);}
 const roofline=new THREE.Mesh(new THREE.BoxGeometry(26,.4,16),blue);roofline.position.y=7.2;station.add(roofline);
 station.position.set(83,0,58);scene.add(station);
 makeEmergencyVehicle(75,49,'police');makeEmergencyVehicle(82,49,'police');makeEmergencyVehicle(90,49,'fire');
 const fireSign=new THREE.Mesh(new THREE.BoxGeometry(9,1.2,.18),new THREE.MeshStandardMaterial({color:0x183c5b}));fireSign.position.set(83,8,50.35);scene.add(fireSign);
}

const trafficSignals=[];

function buildAirportAndBuses(){
 // Flughafenareal am nordöstlichen Stadtrand
 const asphalt=new THREE.MeshStandardMaterial({color:0x303943,roughness:.96});
 const concrete=new THREE.MeshStandardMaterial({color:0x92999b,roughness:.9});
 const terminalMat=new THREE.MeshStandardMaterial({color:0x647b8b,roughness:.72});
 const glass=new THREE.MeshStandardMaterial({color:0x75b9d0,metalness:.18,roughness:.2,transparent:true,opacity:.62});
 const white=new THREE.MeshStandardMaterial({color:0xe9edf0,roughness:.45});
 const yellow=new THREE.MeshStandardMaterial({color:0xf0c94e,roughness:.65});
 const runway=new THREE.Mesh(new THREE.PlaneGeometry(34,150),asphalt);
 runway.rotation.x=-Math.PI/2;runway.position.set(135,.012,-220);scene.add(runway);
 const apron=new THREE.Mesh(new THREE.PlaneGeometry(72,48),concrete);
 apron.rotation.x=-Math.PI/2;apron.position.set(116,.02,-245);scene.add(apron);
 for(let z=-288;z<-150;z+=12){const mark=new THREE.Mesh(new THREE.PlaneGeometry(.65,6),white);mark.rotation.x=-Math.PI/2;mark.position.set(135,.025,z);scene.add(mark);}
 const terminal=new THREE.Group();
 const hall=new THREE.Mesh(new THREE.BoxGeometry(32,7,15),terminalMat);hall.position.y=3.5;terminal.add(hall);
 const roof=new THREE.Mesh(new THREE.BoxGeometry(34,.65,17),white);roof.position.y=7.25;terminal.add(roof);
 for(let x=-13;x<=13;x+=4.3){const pane=new THREE.Mesh(new THREE.BoxGeometry(3.2,4.5,.12),glass);pane.position.set(x,3.8,7.58);terminal.add(pane);}
 const canopy=new THREE.Mesh(new THREE.BoxGeometry(35,.35,3),white);canopy.position.set(0,2.8,9);terminal.add(canopy);
 const sign=new THREE.Mesh(new THREE.BoxGeometry(11,1.25,.2),new THREE.MeshBasicMaterial({color:0x10283a}));sign.position.set(0,6.1,7.7);terminal.add(sign);
 terminal.position.set(105,0,-260);scene.add(terminal);
 // Parkiertes Passagierflugzeug als gut sichtbares Low-Poly-Modell
 airportPlane=new THREE.Group();
 const plane=airportPlane;
 const fuselage=new THREE.Mesh(new THREE.CylinderGeometry(.95,.95,19,12),white);fuselage.rotation.x=Math.PI/2;fuselage.position.y=3.4;plane.add(fuselage);
 const nose=new THREE.Mesh(new THREE.ConeGeometry(.95,3.4,12),white);nose.rotation.x=Math.PI/2;nose.position.set(0,3.4,11.15);plane.add(nose);
 const tail=new THREE.Mesh(new THREE.ConeGeometry(.95,2.6,12),white);tail.rotation.x=-Math.PI/2;tail.position.set(0,3.4,-10.8);plane.add(tail);
 const wing=new THREE.Mesh(new THREE.BoxGeometry(29,.28,3.5),white);wing.position.set(0,3.25,-.8);plane.add(wing); const tailWing=new THREE.Mesh(new THREE.BoxGeometry(10,.22,2),white);tailWing.position.set(0,4.6,-8.2);plane.add(tailWing);
 const fin=new THREE.Mesh(new THREE.BoxGeometry(.28,4.2,3.8),new THREE.MeshStandardMaterial({color:0x2873a0,roughness:.5}));fin.position.set(0,5.25,-8.3);plane.add(fin);
 const stripe=new THREE.Mesh(new THREE.BoxGeometry(.08,.12,15),new THREE.MeshBasicMaterial({color:0x2873a0}));stripe.position.set(0,4.05,0);plane.add(stripe);
 for(const x of [-9,9]){const engine=new THREE.Mesh(new THREE.CylinderGeometry(.72,.72,3.2,12),new THREE.MeshStandardMaterial({color:0x58636b,metalness:.4,roughness:.55}));engine.rotation.x=Math.PI/2;engine.position.set(x,2.35,-.6);plane.add(engine);}
 for(const x of [-1.3,1.3]){const gear=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,1.5,8),new THREE.MeshStandardMaterial({color:0x333b42,metalness:.5}));gear.position.set(x,1.1,1.5);plane.add(gear);}
 plane.position.set(133,0,-245);scene.add(plane);
 // Zwei stilisierte Begleitjets für die geskriptete Verfolgungssequenz während der Flugmission.
 for(let i=0;i<2;i++){
  const jet=new THREE.Group();const jetMat=new THREE.MeshStandardMaterial({color:i===0?0x566779:0x39495c,metalness:.42,roughness:.42});
  const fus=new THREE.Mesh(new THREE.ConeGeometry(.62,6.8,8),jetMat);fus.rotation.x=-Math.PI/2;jet.add(fus);
  const wings=new THREE.Mesh(new THREE.BoxGeometry(6.4,.16,1.8),jetMat);wings.position.z=-.4;jet.add(wings);
  const tailPlane=new THREE.Mesh(new THREE.BoxGeometry(2.5,.12,1),jetMat);tailPlane.position.z=-2.5;jet.add(tailPlane);
  const finJet=new THREE.Mesh(new THREE.BoxGeometry(.12,1.05,1.3),jetMat);finJet.position.set(0,.48,-2.45);jet.add(finJet);
  const canopyJet=new THREE.Mesh(new THREE.SphereGeometry(.42,10,8),new THREE.MeshStandardMaterial({color:0x8bd8ef,transparent:true,opacity:.6}));canopyJet.scale.set(.75,.48,1.5);canopyJet.position.z=.85;jet.add(canopyJet);
  jet.visible=false;jet.position.set(133+(i?12:-12),5,-278);scene.add(jet);militaryEscorts.push(jet);
 }
 // Geparkter Rettungs-/Rundflughelikopter am Flughafen mit animiertem Rotor
 const heli=new THREE.Group();
 const heliBodyMat=new THREE.MeshStandardMaterial({color:0x1d526e,metalness:.22,roughness:.48});
 const heliGlass=new THREE.MeshStandardMaterial({color:0x9bd8e8,transparent:true,opacity:.58,roughness:.18});
 const heliBody=new THREE.Mesh(new THREE.SphereGeometry(1,14,10),heliBodyMat);heliBody.scale.set(1.35,.82,2.15);heli.add(heliBody);
 const cockpit=new THREE.Mesh(new THREE.SphereGeometry(1,12,9),heliGlass);cockpit.scale.set(1.12,.62,.92);cockpit.position.set(0,.2,1.35);heli.add(cockpit);
 const tailBoom=new THREE.Mesh(new THREE.CylinderGeometry(.16,.32,5.3,10),heliBodyMat);tailBoom.rotation.x=Math.PI/2;tailBoom.position.set(0,.12,-3.45);heli.add(tailBoom);
 const heliFin=new THREE.Mesh(new THREE.BoxGeometry(.12,1.35,.8),heliBodyMat);heliFin.position.set(0,.55,-5.65);heli.add(heliFin);
 const skidMat=new THREE.MeshStandardMaterial({color:0x252d34,metalness:.6,roughness:.38});
 for(const x of [-.95,.95]){const skid=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,4.1,8),skidMat);skid.rotation.x=Math.PI/2;skid.position.set(x,-.85,.05);heli.add(skid);const strut=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,1.05,8),skidMat);strut.position.set(x,-.38,.55);heli.add(strut);}
 const rotorHub=new THREE.Group();rotorHub.position.y=1.03;heli.add(rotorHub);
 for(let a=0;a<4;a++){const blade=new THREE.Mesh(new THREE.BoxGeometry(.22,.055,6.8),skidMat);blade.rotation.y=a*Math.PI/2;blade.position.y=.04;rotorHub.add(blade);}
 const tailRotor=new THREE.Group();tailRotor.position.set(0,.55,-5.75);heli.add(tailRotor);
 for(let a=0;a<4;a++){const blade=new THREE.Mesh(new THREE.BoxGeometry(.1,.12,1.35),skidMat);blade.rotation.y=a*Math.PI/2;tailRotor.add(blade);}
 heli.position.set(109,.95,-231);heli.rotation.y=Math.PI/2;scene.add(heli);
 airportHelicopters.push({rotor:rotorHub,tailRotor});
 const pad=new THREE.Mesh(new THREE.CircleGeometry(5.5,32),new THREE.MeshStandardMaterial({color:0x4c5961,roughness:.9}));pad.rotation.x=-Math.PI/2;pad.position.set(109,.035,-231);scene.add(pad);
 const padMark=new THREE.Mesh(new THREE.BoxGeometry(3.4,.035,3.4),new THREE.MeshBasicMaterial({color:0xf2f1e9}));padMark.position.set(109,.06,-231);scene.add(padMark);
 // Beschilderung und Vorfeldmarkierungen
 for(const [x,z,label] of [[82,-245,"AIRPORT"],[82,-72,"CITY"],[82,48,"OSTEND"],[82,165,"SÜD"]]){
  const post=new THREE.Mesh(new THREE.BoxGeometry(.12,2.5,.12),new THREE.MeshStandardMaterial({color:0x3c4b56}));post.position.set(x+4,1.25,z);scene.add(post);
  const board=new THREE.Mesh(new THREE.BoxGeometry(3.4,.85,.14),new THREE.MeshStandardMaterial({color:0x123c55}));board.position.set(x+4,2.35,z);scene.add(board);
 }
 const busBody=new THREE.MeshStandardMaterial({color:0xf0f1ed,roughness:.55});
 const busBlue=new THREE.MeshStandardMaterial({color:0x247ca4,roughness:.45});
 const busGlass=new THREE.MeshStandardMaterial({color:0x244253,roughness:.18,metalness:.15});
 const rubber=new THREE.MeshStandardMaterial({color:0x171b20,roughness:.9});
 for(let i=0;i<(liteMode?1:3);i++){
  const bus=new THREE.Group();
  const body=new THREE.Mesh(new THREE.BoxGeometry(2.55,2.9,10.2),busBody);body.position.y=1.65;bus.add(body);
  const belt=new THREE.Mesh(new THREE.BoxGeometry(2.59,.62,10.22),busBlue);belt.position.set(0,1.1,0);bus.add(belt);
  const roof=new THREE.Mesh(new THREE.BoxGeometry(2.45,.16,9.9),white);roof.position.y=3.13;bus.add(roof);
  for(const side of [-1,1])for(let z=-3.55;z<=3.56;z+=1.75){const win=new THREE.Mesh(new THREE.BoxGeometry(.035,1.15,1.48),busGlass);win.position.set(side*1.29,2.18,z);bus.add(win);}
  const front=new THREE.Mesh(new THREE.BoxGeometry(2.05,1.05,.06),busGlass);front.position.set(0,2.28,5.13);bus.add(front);
  const rear=new THREE.Mesh(new THREE.BoxGeometry(2.05,1.05,.06),busGlass);rear.position.set(0,2.28,-5.13);bus.add(rear);
  const display=new THREE.Mesh(new THREE.BoxGeometry(1.45,.34,.07),new THREE.MeshBasicMaterial({color:0xffd75c}));display.position.set(0,2.85,5.18);bus.add(display);
  for(const x of [-1.32,1.32])for(const z of [-3.35,3.35]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.48,.48,.22,12),rubber);wheel.rotation.z=Math.PI/2;wheel.position.set(x,.52,z);bus.add(wheel);}
  const direction=i===1?-1:1;bus.position.set(82,.02,-250+(i*145));bus.rotation.y=direction>0?0:Math.PI;scene.add(bus);
  airportBuses.push({group:bus,direction,speed:.085+i*.012,from:-278,to:185,route: i===2?"AIRPORT EXPRESS":"CITY BUS"});
 }
}

function buildStreetInfrastructure(){
 const stripeMat=new THREE.MeshStandardMaterial({color:0xf1eee2,roughness:.9});
 const poleMat=new THREE.MeshStandardMaterial({color:0x26333c,metalness:.55,roughness:.45});
 for(let z=-285;z<=209;z+=38){
  // Fußgängerüberwege an den größeren Kreuzungen.
  for(let x=-7.2;x<=7.2;x+=1.8){
   const stripe=new THREE.Mesh(new THREE.PlaneGeometry(1.25,.58),stripeMat);
   stripe.rotation.x=-Math.PI/2;stripe.position.set(x,.025,z+5.4);scene.add(stripe);
  }
  for(const side of [-1,1]){
   const pole=new THREE.Mesh(new THREE.CylinderGeometry(.09,.12,4.1,10),poleMat);
   pole.position.set(side*10.5,2.05,z+2.8);scene.add(pole);
   const head=new THREE.Mesh(new THREE.BoxGeometry(.42,1.05,.35),new THREE.MeshStandardMaterial({color:0x18232b,metalness:.2}));
   head.position.set(side*10.5,3.35,z+2.8);scene.add(head);
   const lamps=[];
   for(let n=0;n<3;n++){
    const mat=new THREE.MeshStandardMaterial({color:0x252b30,emissive:[0xff3028,0xffb52e,0x42db75][n],emissiveIntensity:.05});
    const bulb=new THREE.Mesh(new THREE.SphereGeometry(.115,12,10),mat);
    bulb.position.set(side*10.5,3.68-n*.32,z+3.0);scene.add(bulb);lamps.push(bulb);
   }
   trafficSignals.push({lamps,phase:(z+190)/38+(side>0?1.4:0)});
  }
 }
 // Zwei kleine Haltestellen mit Dach, Sitzbank und Linienanzeige.
 for(const z of [-42,48]){
  const shelter=new THREE.Group();
  const metal=new THREE.MeshStandardMaterial({color:0x344b5b,metalness:.45,roughness:.4});
  const glass=new THREE.MeshStandardMaterial({color:0x8bc9dc,transparent:true,opacity:.28,roughness:.2});
  const roof=new THREE.Mesh(new THREE.BoxGeometry(4.4,.16,2.1),metal);roof.position.y=2.65;shelter.add(roof);
  for(const x of [-2,2]){const post=new THREE.Mesh(new THREE.BoxGeometry(.12,2.6,.12),metal);post.position.set(x,1.3,-.85);shelter.add(post);}
  const back=new THREE.Mesh(new THREE.BoxGeometry(4.2,2.25,.07),glass);back.position.set(0,1.4,-.85);shelter.add(back);
  const bench=new THREE.Mesh(new THREE.BoxGeometry(2.6,.14,.48),new THREE.MeshStandardMaterial({color:0x647b86}));bench.position.set(0,.55,-.35);shelter.add(bench);
  const sign=new THREE.Mesh(new THREE.BoxGeometry(.42,1.5,.12),metal);sign.position.set(2.45,1.7,.65);shelter.add(sign);
  const marker=new THREE.Mesh(new THREE.BoxGeometry(.32,.32,.04),new THREE.MeshBasicMaterial({color:0x5ad6e6}));marker.position.set(2.45,2.25,.73);shelter.add(marker);
  shelter.position.set(13.2,0,z);scene.add(shelter);
 }
}


function buildRoadSigns(){
 const poleMat=new THREE.MeshStandardMaterial({color:0x59636b,metalness:.5,roughness:.55});
 const red=new THREE.MeshStandardMaterial({color:0xc72b32,roughness:.7});
 const white=new THREE.MeshStandardMaterial({color:0xf2f1e9,roughness:.7});
 const blue=new THREE.MeshStandardMaterial({color:0x176c9b,roughness:.65});
 const sign=(x,z,type,text)=>{
  const g=new THREE.Group();
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.055,.075,2.6,8),poleMat);pole.position.y=1.3;g.add(pole);
  let board;
  if(type==='stop'){
   board=new THREE.Mesh(new THREE.CylinderGeometry(.62,.62,.12,8),red);board.rotation.x=Math.PI/2;board.position.y=2.55;g.add(board);
   const label=new THREE.Mesh(new THREE.BoxGeometry(.75,.22,.025),white);label.position.set(0,2.55,.08);g.add(label);
  }else if(type==='yield'){
   board=new THREE.Mesh(new THREE.ConeGeometry(.72,.72,3),white);board.rotation.z=Math.PI;board.position.set(0,2.55,0);g.add(board);
   const inner=new THREE.Mesh(new THREE.ConeGeometry(.52,.52,3),red);inner.rotation.z=Math.PI;inner.position.set(0,2.56,.055);g.add(inner);
  }else{
   board=new THREE.Mesh(new THREE.CylinderGeometry(.58,.58,.12,20),blue);board.rotation.x=Math.PI/2;board.position.y=2.55;g.add(board);
   if(type==='speed'){const ring=new THREE.Mesh(new THREE.CylinderGeometry(.58,.58,.13,24),white);ring.rotation.x=Math.PI/2;ring.position.set(0,2.55,.07);g.add(ring);}
  }
  g.position.set(x,0,z);scene.add(g);
  if(text){const c=document.createElement('canvas');c.width=256;c.height=96;const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.font='bold 56px Arial';ctx.textAlign='center';ctx.fillText(text,128,66);const m=new THREE.Mesh(new THREE.PlaneGeometry(.82,.3),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true}));m.position.set(0,2.55,.16);g.add(m);}
 };
 for(const z of [-190,-114,-38,38,114,190]){
  sign(-11.5,z,'stop','STOP');sign(11.5,z+9,'yield','VORFAHRT');
  sign(-11.5,z+18,'speed','30');
  for(const side of [-1,1]){
   const pole=new THREE.Mesh(new THREE.CylinderGeometry(.045,.06,2.5,8),poleMat);pole.position.set(side*10.5,1.25,z+4);scene.add(pole);
   const board=new THREE.Mesh(new THREE.BoxGeometry(.58,.78,.12),blue);board.position.set(side*10.5,2.45,z+4);scene.add(board);
   const pedestrian=new THREE.Mesh(new THREE.BoxGeometry(.2,.34,.04),white);pedestrian.position.set(side*10.5,2.48,z+4.08);scene.add(pedestrian);
  }
 }
}


function buildCoastAndBoats(){
 // Fiktive Strandbucht südlich der Stadt – bewusst als neues Küstengebiet gestaltet.
 const sand=new THREE.MeshStandardMaterial({color:0xd8c18d,roughness:1});
 const wetSand=new THREE.MeshStandardMaterial({color:0xbca77d,roughness:1});
 const waterMat=new THREE.MeshStandardMaterial({color:0x197fa5,roughness:.24,metalness:.12,transparent:true,opacity:.88});
 const ocean=new THREE.Mesh(new THREE.PlaneGeometry(900,520),waterMat);ocean.rotation.x=-Math.PI/2;ocean.position.set(0,-.18,510);scene.add(ocean);waterSurface=ocean;
 const beach=new THREE.Mesh(new THREE.PlaneGeometry(360,105),sand);beach.rotation.x=-Math.PI/2;beach.position.set(0,-.035,270);scene.add(beach);
 const wet=new THREE.Mesh(new THREE.PlaneGeometry(360,12),wetSand);wet.rotation.x=-Math.PI/2;wet.position.set(0,-.02,320);scene.add(wet);
 for(let i=0;i<18;i++){const foam=new THREE.Mesh(new THREE.BoxGeometry(7+Math.random()*10,.035,.22),new THREE.MeshBasicMaterial({color:0xe8f6f3,transparent:true,opacity:.5}));foam.position.set(-165+i*19,.015,326+Math.sin(i)*2);scene.add(foam);beachFoam.push(foam);}
 const palmMat=new THREE.MeshStandardMaterial({color:0x795638}),leafMat=new THREE.MeshStandardMaterial({color:0x39845a});
 for(const x of [-145,-95,95,145]){const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.22,.34,5,7),palmMat);trunk.position.set(x,2.5,252+(Math.abs(x)%3)*7);scene.add(trunk);for(let j=0;j<5;j++){const leaf=new THREE.Mesh(new THREE.ConeGeometry(.45,4,5),leafMat);leaf.position.set(x+Math.cos(j*1.256)*1.35,5.1,252+Math.sin(j*1.256)*1.35);leaf.rotation.z=Math.cos(j*1.256)*.9;leaf.rotation.x=Math.sin(j*1.256)*.8;scene.add(leaf);}}
 for(let i=0;i<9;i++){const umbrella=new THREE.Group();const pole=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,2,6),new THREE.MeshStandardMaterial({color:0xf3eee0}));pole.position.y=1;umbrella.add(pole);const canopy=new THREE.Mesh(new THREE.ConeGeometry(1.55,.48,10),new THREE.MeshStandardMaterial({color:i%2?0xe05e4f:0x3e9dbb}));canopy.position.y=2;canopy.rotation.x=Math.PI;umbrella.add(canopy);umbrella.position.set(-120+i*30,0,278+(i%2)*14);scene.add(umbrella);}
 // Kleine Motorboote als Arcade-Fahrzeuge. F in der Nähe steigt ein/aus.
 for(let i=0;i<3;i++){const boat=new THREE.Group();const hullMat=new THREE.MeshStandardMaterial({color:[0xf2f2ec,0x225a83,0xc34d38][i],roughness:.42});const hull=new THREE.Mesh(new THREE.ConeGeometry(1.35,6.2,4),hullMat);hull.rotation.x=-Math.PI/2;hull.rotation.z=Math.PI/4;hull.scale.set(1,.58,1);hull.position.y=.25;boat.add(hull);const deck=new THREE.Mesh(new THREE.BoxGeometry(1.8,.25,2.4),new THREE.MeshStandardMaterial({color:0xe6e4d9}));deck.position.set(0,.65,-.15);boat.add(deck);const windshield=new THREE.Mesh(new THREE.BoxGeometry(1.35,.75,.12),new THREE.MeshStandardMaterial({color:0x6db6d0,transparent:true,opacity:.6}));windshield.position.set(0,1.05,.5);boat.add(windshield);const seat=new THREE.Mesh(new THREE.BoxGeometry(.9,.45,.65),new THREE.MeshStandardMaterial({color:0x303943}));seat.position.set(0,.78,-.75);boat.add(seat);boat.position.set(-55+i*55,.05,355+i*7);boat.rotation.y=i*.25;scene.add(boat);boats.push(boat);}
 const label=new THREE.Mesh(new THREE.BoxGeometry(24,2.1,.35),new THREE.MeshStandardMaterial({color:0x12394a}));label.position.set(0,4,242);scene.add(label);
}
function tryStartBoat(){
 if(activeBoat){activeBoat=null;boatSpeed=0;status.textContent='BOOT VERLASSEN · STRAND';camera.position.set(0,2.1,285);return true;}
 if(driving||planeFlying)return false;let nearest=null,dist=12;for(const boat of boats){const d=camera.position.distanceTo(boat.position);if(d<dist){dist=d;nearest=boat;}}
 if(!nearest)return false;activeBoat=nearest;boatSpeed=0;boatHeading=nearest.rotation.y;status.textContent='MOTORBOOT · W/S GAS/BREMSE · A/D LENKEN · F AUSSTEIGEN';return true;
}

function flBuildReflectionEnvironment(){
 if(classicEdition||typeof document==='undefined')return;
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;
 const ctx=canvas.getContext('2d');if(!ctx)return;
 const sky=ctx.createLinearGradient(0,0,0,512);
 sky.addColorStop(0,'#18283d');sky.addColorStop(.38,'#7899b3');sky.addColorStop(.57,'#f2d9b2');sky.addColorStop(.63,'#6e7d88');sky.addColorStop(1,'#202b36');
 ctx.fillStyle=sky;ctx.fillRect(0,0,1024,512);
 const sun=ctx.createRadialGradient(710,250,4,710,250,190);
 sun.addColorStop(0,'rgba(255,244,218,.95)');sun.addColorStop(.22,'rgba(255,224,180,.32)');sun.addColorStop(1,'rgba(255,224,180,0)');
 ctx.fillStyle=sun;ctx.fillRect(500,40,420,420);
 // Soft architectural silhouettes create broad, readable highlights in vehicle paint.
 for(let x=0;x<1024;x+=37){
  const h=55+((x*17)%125),w=18+((x*7)%25);
  ctx.fillStyle=x%3===0?'rgba(35,49,64,.82)':'rgba(57,72,85,.72)';
  ctx.fillRect(x,330-h,w,h);
  ctx.fillStyle='rgba(255,221,165,.42)';
  for(let y=340-h+12;y<325;y+=19)if((x+y)%4!==0)ctx.fillRect(x+5,y,4,7);
 }
 const tex=new THREE.CanvasTexture(canvas);tex.mapping=THREE.EquirectangularReflectionMapping;
 tex.colorSpace=THREE.SRGBColorSpace;tex.needsUpdate=true;
 scene.environment=tex;scene.environmentIntensity=.9;
}
function makeCity(){
  const skyColor=classicEdition?0xb99a70:0x91b1c8;scene=new THREE.Scene();scene.background=new THREE.Color(skyColor);scene.fog=new THREE.Fog(skyColor,classicEdition?82:105,classicEdition?155:(liteMode?195:340));
  if(!classicEdition)flBuildReflectionEnvironment();
  camera=new THREE.PerspectiveCamera(cameraFov,viewport.clientWidth/viewport.clientHeight,.1,900);camera.position.set(0,2.1,14);
  flashlight=new THREE.SpotLight(0xddeeff,0,48,Math.PI/7,.42,1.35);
  flashlight.position.set(0,0,0);flashlightTarget=new THREE.Object3D();flashlightTarget.position.set(0,0,-1);
  camera.add(flashlight,flashlightTarget);flashlight.target=flashlightTarget;
  hemiLight=new THREE.HemisphereLight(classicEdition?0xffd69a:0xd7ecff,classicEdition?0x66513a:0x4a5260,classicEdition?1.65:2);scene.add(hemiLight);
  sunLight=new THREE.DirectionalLight(classicEdition?0xffc078:0xffe0b4,classicEdition?1.25:1.5);sunLight.position.set(-25,45,25);sunLight.castShadow=false;scene.add(sunLight);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(1100,900),new THREE.MeshLambertMaterial({color:0x58636b}));ground.rotation.x=-Math.PI/2;ground.position.set(0,-.12,-80);scene.add(ground);
  const asphaltMat=new THREE.MeshStandardMaterial({color:0x202a35,roughness:.94,metalness:.025});
  if(!classicEdition&&typeof document!=='undefined'){
    const asphaltCanvas=document.createElement('canvas');asphaltCanvas.width=256;asphaltCanvas.height=256;
    const ac=asphaltCanvas.getContext('2d');
    if(ac){
      ac.fillStyle='#59616a';ac.fillRect(0,0,256,256);
      for(let i=0;i<5200;i++){const shade=55+Math.floor(Math.random()*90);ac.fillStyle='rgba('+shade+','+shade+','+shade+','+(Math.random()*.22)+')';const size=Math.random()*2.2+.35;ac.fillRect(Math.random()*256,Math.random()*256,size,size);}
      const asphaltTexture=new THREE.CanvasTexture(asphaltCanvas);asphaltTexture.wrapS=THREE.RepeatWrapping;asphaltTexture.wrapT=THREE.RepeatWrapping;asphaltTexture.repeat.set(5,110);asphaltTexture.colorSpace=THREE.SRGBColorSpace;asphaltTexture.anisotropy=Math.min(8,renderer?.capabilities?.getMaxAnisotropy?.()||1);asphaltMat.map=asphaltTexture;asphaltMat.needsUpdate=true;
    }
  }
  const road=new THREE.Mesh(new THREE.PlaneGeometry(18,520),asphaltMat);road.rotation.x=-Math.PI/2;road.position.set(0,0,-45);scene.add(road);
  const wetMain=new THREE.Mesh(new THREE.PlaneGeometry(17.8,519),new THREE.MeshPhongMaterial({color:0x526574,transparent:true,opacity:0,shininess:105,specular:0x8fa8bb,depthWrite:false}));wetMain.rotation.x=-Math.PI/2;wetMain.position.set(0,.012,-45);scene.add(wetMain);flWetRoadMaterials.push(wetMain.material);
  for(let z=-300;z<225;z+=12){const line=new THREE.Mesh(new THREE.PlaneGeometry(.18,5),new THREE.MeshBasicMaterial({color:0xe5dfc5}));line.rotation.x=-Math.PI/2;line.position.set(0,.015,z);scene.add(line);}
  const sidewalkMat=new THREE.MeshLambertMaterial({color:0x92999b});
  for(const x of [-9.2,9.2]){const s=new THREE.Mesh(new THREE.BoxGeometry(3.5,.25,520),sidewalkMat);s.position.set(x,.08,-45);scene.add(s);}
  // Main-road drainage: curb channels, storm grates, moving runoff highlights and shallow puddles.
  const gutterMat=new THREE.MeshStandardMaterial({color:0x34434a,roughness:.3,metalness:.35});
  const grateMat=new THREE.MeshStandardMaterial({color:0x66747a,roughness:.48,metalness:.72});
  const runoffMat=new THREE.MeshBasicMaterial({color:0x9fc7d7,transparent:true,opacity:0,depthWrite:false});
  for(const side of [-1,1]){
    const channel=new THREE.Mesh(new THREE.BoxGeometry(.22,.025,520),gutterMat);channel.position.set(side*8.78,.018,-45);scene.add(channel);
    for(let z=-285;z<=195;z+=40){
      const grate=new THREE.Mesh(new THREE.BoxGeometry(.34,.035,1.05),grateMat);grate.position.set(side*8.78,.035,z);scene.add(grate);
      for(let rib=-3;rib<=3;rib++){const bar=new THREE.Mesh(new THREE.BoxGeometry(.025,.012,.88),gutterMat);bar.position.set(side*8.78+rib*.043,.057,z);scene.add(bar);}
    }
    for(let i=0;i<9;i++){
      const stream=new THREE.Mesh(new THREE.PlaneGeometry(.075,.95),runoffMat.clone());stream.rotation.x=-Math.PI/2;stream.position.set(side*8.78,.038,-275+i*56);scene.add(stream);
      flRunoffMeshes.push({mesh:stream,startZ:-295+i*56,length:34,speed:.18+i*.012,offset:i*.13});
    }
  }
  const puddleMat=new THREE.MeshPhongMaterial({color:0x718c9c,transparent:true,opacity:0,shininess:125,specular:0xc4e3f2,depthWrite:false});
  const rippleMat=new THREE.MeshBasicMaterial({color:0xb8d8e5,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false});
  for(let i=0;i<18;i++){
    const x=((i*37)%120)/10-6,z=-270+((i*83)%490);
    const puddle=new THREE.Mesh(new THREE.CircleGeometry(.55+(i%4)*.22,20),puddleMat.clone());puddle.rotation.x=-Math.PI/2;puddle.scale.set(1.5,.65,1);puddle.position.set(x,.025,z);scene.add(puddle);
    const ripple=new THREE.Mesh(new THREE.RingGeometry(.28,.34,24),rippleMat.clone());ripple.rotation.x=-Math.PI/2;ripple.position.set(x,.032,z);scene.add(ripple);
    flPuddleMeshes.push({mesh:puddle,ripple,opacity:.18+(i%4)*.025});
  }
  if(!liteMode){buildStreetInfrastructure();buildTransitStops();buildRoadSigns();}
  buildAirportAndBuses();buildCoastAndBoats();flCreateWeatherEffects();
  const leftShops=new Map([[-87,['SUPERMARKT','MARKT · FRISCHE WAREN',0x3c966c]],[ -51,['BÄCKEREI','BROT · KAFFEE · KUCHEN',0xc58b43]],[ -15,['MODEHAUS','MODE FÜR JEDEN TAG',0x8a638e]],[21,['ELEKTRO','TECHNIK & ZUBEHÖR',0x397ca5]]]);
  const rightShops=new Map([[-94,['CAFÉ AM MAIN','KAFFEE · SNACKS',0x9b6547]],[ -58,['AUTOWELT','FAHRZEUGE & SERVICE',0x397a91]],[ -22,['SPORTTREFF','SPORT · OUTDOOR',0x62884f]],[14,['KIOSK 24','ZEITUNGEN · GETRÄNKE',0xb68a39]]]);
  for(let z=-105;z<35;z+=18){
    const left=leftShops.get(z);if(left)createShop(-15,z,-1,...left);else building(-15,z,8,12,12+Math.random()*22,0x6c7885);
    const rz=z-7,right=rightShops.get(rz);if(right)createShop(15,rz,1,...right);else building(15,rz,8,12,15+Math.random()*25,0x77828c);
  }
  createShop(-15,52,-1,'TUNINGWERK','FAHRWERK · FELGEN · LACK',0x4d718c);
  createShop(15,72,1,'BÄCKEREI AM MAIN','BRÖTCHEN · BREZELN · KUCHEN',0xc58b43);
  createShop(-15,92,-1,'PIZZERIA ROMA','PIZZA · PASTA · LIEFERDIENST',0xb94d3c);
  createShop(15,112,1,'RESTAURANT MAINBLICK','BURGER · SCHNITZEL · SALATE',0x8d5c36);
  createShop(15,142,1,'TANKSTELLE MAIN','TANKEN · SHOP · SERVICE',0x277b92);
  buildFuelPumps();
  createShop(-15,-128,-1,'RESTAURANT ZEIL','MITTAGSTISCH · ABENDKARTE',0x426f83);
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
  if(!liteMode){buildEmergencyServices();buildFrankfurtLandmarks();}
  buildDealership();
  createTraffic();
  // Erweiterte Stadt: zusätzliche Wohn- und Geschäftsquartiere, Nebenstraßen und Plätze.
  const sideRoadMat=new THREE.MeshStandardMaterial({color:0x29333d,roughness:.96});
  const sideWalkMat=new THREE.MeshStandardMaterial({color:0x92999b,roughness:.9});
  for(const x of [-160,-130,-82,-48,48,82,130,160]){
    const avenue=new THREE.Mesh(new THREE.PlaneGeometry(11,520),sideRoadMat);
    avenue.rotation.x=-Math.PI/2;avenue.position.set(x,.005,-45);scene.add(avenue);flAddWetRoad(10.8,519,x,-45);
    for(const sx of [x-7.5,x+7.5]){
      const pavement=new THREE.Mesh(new THREE.BoxGeometry(3,.2,520),sideWalkMat);
      pavement.position.set(sx,.06,-45);scene.add(pavement);
    }
  }
  for(let z=-190;z<=95;z+=(liteMode?76:38)){
    const cross=new THREE.Mesh(new THREE.PlaneGeometry(360,9),sideRoadMat);
    cross.rotation.x=-Math.PI/2;cross.position.set(0,.012,z);scene.add(cross);flAddWetRoad(359,8.8,0,z);
    for(const x of [-166,-136,-96,-66,-30,30,66,96,136,166]){
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
  for(let z=-286;z<220;z+=(liteMode?52:26)){
    for(const x of [-170,-145,-103,-61,61,103,145,170])streetLamp(x,z);
  }
  // Neue Außenbezirke: zusätzliche Straßen, Wohnblocks und kleine Gewerbequartiere.
  const outerPalette=[0xb8b7aa,0x82949d,0xc5b69f,0x71838b,0x9eaaa4,0xc2c8c5];
  for(let z=-266;z<=210;z+=(liteMode?76:38)){
   for(const x of [-150,-120,120,150]){
    const height=17+((Math.abs(Math.floor(z/38))+Math.abs(Math.floor(x/30)))%5)*6;
    if(Math.abs(x)===150)residentialBuilding(x,z+10,13,15,height,outerPalette[(Math.abs(Math.floor(z/38))+Math.floor(Math.abs(x)/30))%outerPalette.length]);
    else building(x,z+10,13,15,height,outerPalette[(Math.abs(Math.floor(z/38))+Math.floor(Math.abs(x)/30))%outerPalette.length]);
   }
   for(const x of [-176,-124,124,176])tree(x,z+8);
  }
  for(let z=-255;z<=195;z+=30){for(const x of [-174,174])streetLamp(x,z);}
  createShop(-145,-185,-1,'WESTEND MARKT','LEBENSMITTEL · ALLTAG',0x3c966c);
  createShop(145,-145,1,'OSTEND CAFÉ','KAFFEE · KUCHEN',0x9b6547);
  createShop(-145,165,-1,'SÜDQUARTIER KIOSK','GETRÄNKE · SNACKS',0xb68a39);
  createShop(145,165,1,'CITY SPORT','SPORT · OUTDOOR',0x62884f);
  createPedestrianDistrict();
  buildFrankfurtStadiumAndPark();
  buildFrankfurtLuxuryQuarter();
  buildFrankfurtCityExpansion();
  for(let i=0;i<(liteMode?7:24);i++){
    const side=i%2===0?-1:1;
    makePedestrian(side*(9.1+(i%4)*.38),-108+(i*9.7)%128,i);
  }
}
function resize(){
  if(!renderer)return;
  const w=viewport.clientWidth,h=viewport.clientHeight;
  if(w<1||h<1)return;
  renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
}
let flNearMissCooldown=0;
function updateWorld(dt){
  const t=clock.elapsedTime;
  flUpdateSystems(dt);flUpdateRain(dt);if(shopScene)updateShopFilmScene(dt);
  if((performanceFrame%4)===0)for(const signal of trafficSignals){const phase=(t+signal.phase*1.7)%8;const active=phase<5?0:phase<6.2?1:2;signal.lamps.forEach((lamp,i)=>lamp.material.emissiveIntensity=i===active?.9:.04);}
  if((performanceFrame++%4)===0)drawMiniMap();
  for(const heli of airportHelicopters){heli.rotor.rotation.y+=dt*18;heli.tailRotor.rotation.x+=dt*20;}if((performanceFrame%2)===0)for(let i=0;i<beachFoam.length;i++){beachFoam[i].position.x+=Math.sin(t*.5+i)*dt*1.4;beachFoam[i].material.opacity=.35+Math.sin(t*1.8+i)*.15;}if(waterSurface)waterSurface.position.y=-.18+Math.sin(t*.65)*.025;
  if(planeFlying&&airportPlane){for(let i=0;i<militaryEscorts.length;i++){const escort=militaryEscorts[i];const side=i===0?-1:1;const tx=airportPlane.position.x-Math.sin(planeHeading)*22+Math.cos(planeHeading)*side*10;const tz=airportPlane.position.z-Math.cos(planeHeading)*22-Math.sin(planeHeading)*side*10;escort.position.x+=(tx-escort.position.x)*Math.min(1,dt*1.2);escort.position.z+=(tz-escort.position.z)*Math.min(1,dt*1.2);escort.position.y=planeAltitude+2+Math.sin(t*2+i)*.35;escort.rotation.y=planeHeading;}}
  for(const bus of airportBuses){bus.group.position.z+=bus.direction*bus.speed*dt*60;if(bus.group.position.z>bus.to&&bus.direction>0)bus.group.position.z=bus.from;if(bus.group.position.z<bus.from&&bus.direction<0)bus.group.position.z=bus.to;}
  for(const taxi of taxiVehicles){if(taxi.state!=='approach')continue;const dx=camera.position.x-taxi.group.position.x,dz=camera.position.z-taxi.group.position.z,dist=Math.hypot(dx,dz);if(dist<5){taxi.state='arrived';status.textContent='TAXI ANGEKOMMEN · STEIGE EIN';}else{taxi.group.position.x+=dx/dist*taxi.speed*dt*60;taxi.group.position.z+=dz/dist*taxi.speed*dt*60;taxi.group.rotation.y=Math.atan2(dx,dz);}}
  if(takeoverTarget){takeoverProgress=Math.min(1,takeoverProgress+dt/1.8);if(takeoverActor){const side=new THREE.Vector3(Math.cos(takeoverTarget.rotation.y),0,-Math.sin(takeoverTarget.rotation.y));takeoverActor.position.copy(takeoverTarget.position).addScaledVector(side,1.25+takeoverProgress*2.2);takeoverActor.rotation.y=takeoverTarget.rotation.y;takeoverActor.children[2].rotation.x=Math.sin(t*8)*.28;takeoverActor.children[3].rotation.x=-Math.sin(t*8)*.28;}if(takeoverHud){const bar=takeoverHud.querySelector('i');if(bar)bar.style.width=(takeoverProgress*100)+'%';}if(takeoverProgress>=1){const target=takeoverTarget;takeoverTarget=null;takeoverProgress=0;if(takeoverActor){scene.remove(takeoverActor);takeoverActor=null;}if(takeoverHud)takeoverHud.classList.add('hidden');const idx=trafficCars.indexOf(target);if(idx>=0)trafficCars.splice(idx,1);target.userData.traffic=null;if(target.userData.npcDriver)target.userData.npcDriver.visible=false;jobCar=target;driving=true;carSpeed=0;carSlip=0;carYawRate=0;cameraLookOffset=0;damageLevel=0;yaw=jobCar.rotation.y-Math.PI;status.textContent='SZENE ABGESCHLOSSEN · FAHRZEUG STEHT JETZT ZUR VERFÜGUNG';}}
  for(const car of trafficCars){
    const traffic=car.userData.traffic;
    car.position.z+=traffic.direction*traffic.speed*dt*60;
    if(traffic.direction>0&&car.position.z>52)car.position.z=-122;
    if(traffic.direction<0&&car.position.z<-122)car.position.z=52;
  }
  if((performanceFrame%2)===0)for(const p of pedestrians){
    const u=p.userData;
    p.position.z=u.originZ+Math.sin(t*u.speed+u.phase)*2.6;
    p.position.x=u.originX+Math.sin(t*u.speed*.55+u.phase)*.55;
    p.rotation.y=Math.cos(t*u.speed+u.phase)*.18;
    if(u.legs){u.legs[0].rotation.x=Math.sin(t*5+u.phase)*.42;u.legs[1].rotation.x=-Math.sin(t*5+u.phase)*.42;}if(u.arms){u.arms[0].rotation.x=-Math.sin(t*5+u.phase)*.24;u.arms[1].rotation.x=Math.sin(t*5+u.phase)*.24;}if(u.head)u.head.rotation.y=Math.sin(t*.7+u.phase)*.07;
  }
  if(flNearMissCooldown>0)flNearMissCooldown=Math.max(0,flNearMissCooldown-dt);
  if(driving&&jobCar&&flNearMissCooldown===0){
    const px=jobCar.position.x,pz=jobCar.position.z;
    for(const p of pedestrians){
      if(Math.hypot(p.position.x-px,p.position.z-pz)<3.6){
        status.textContent='ACHTUNG · FUSSGÄNGER IN DER NÄHE — BITTE ABBREMSEN';
        flNearMissCooldown=3.5;break;
      }
    }
  }
  for(const car of dealerDisplayCars){car.rotation.y=Math.PI/2+Math.sin(t*.45)*.025;}
  updateCutscene(dt);
  if(phonePanel&&!phonePanel.classList.contains('hidden')&&(performanceFrame%30)===0){const clockEl=phonePanel.querySelector('#phoneClock');if(clockEl)clockEl.textContent=new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'});}
  if((performanceFrame%3)===0)for(const car of policeCars){
    const [red,blue]=car.userData.lights;
    const flash=Math.floor(t*7)%2===0;
    red.material.color.setHex(flash?0xff2038:0x40151d);
    blue.material.color.setHex(flash?0x173c78:0x247bff);
  }
  if((performanceFrame%3)===0)for(const car of emergencyVehicles){const [red,blue]=car.userData.emergencyLights;const flash=Math.floor(t*8)%2===0;red.material.color.setHex(flash?0xff2638:0x52121a);blue.material.color.setHex(flash?0x1c7cff:0x142b51);}
}


function buildFrankfurtLuxuryQuarter(){
 // A fictional premium quarter: glass, warm stone, brass details and a landscaped arrival plaza.
 const quarter=new THREE.Group();
 const stone=new THREE.MeshStandardMaterial({color:0xd3c6ae,roughness:.72});
 const dark=new THREE.MeshStandardMaterial({color:0x202d38,roughness:.42,metalness:.35});
 const glass=new THREE.MeshStandardMaterial({color:0x6e9aaa,roughness:.16,metalness:.42,emissive:0x10232b,emissiveIntensity:.16});
 const gold=new THREE.MeshStandardMaterial({color:0xb99555,roughness:.28,metalness:.78});
 const paving=new THREE.MeshStandardMaterial({color:0xaaa79e,roughness:.88});
 const plaza=new THREE.Mesh(new THREE.PlaneGeometry(86,76),paving);plaza.rotation.x=-Math.PI/2;plaza.position.set(0,.015,0);quarter.add(plaza);
 // Two stepped glass-and-stone office towers with repeated illuminated-looking window bays.
 for(const [x,z,w,d,h] of [[-22,-18,22,18,48],[22,-18,20,18,37]]){
  const tower=new THREE.Group();
  const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),glass);body.position.y=h/2; tower.add(body);
  const base=new THREE.Mesh(new THREE.BoxGeometry(w+1,5,d+1),stone);base.position.y=2.5;tower.add(base);
  for(let y=7;y<h-2;y+=4.2){
   const band=new THREE.Mesh(new THREE.BoxGeometry(w+.16,.13,d+.16),gold);band.position.y=y;tower.add(band);
   for(let xx=-w/2+2;xx<w/2-1;xx+=3.1){
    const mullion=new THREE.Mesh(new THREE.BoxGeometry(.11,3.4,.16),dark);mullion.position.set(xx,y+1.65,d/2+.1);tower.add(mullion);
   }
  }
  const crown=new THREE.Mesh(new THREE.BoxGeometry(w*.72,.65,d*.72),gold);crown.position.y=h+.32;tower.add(crown);
  tower.position.set(x,0,z);quarter.add(tower);
 }
 // Boutique hotel frontage, covered drop-off and a restrained brass sign.
 const hotel=new THREE.Group();
 const hotelBody=new THREE.Mesh(new THREE.BoxGeometry(25,13,13),stone);hotelBody.position.y=6.5;hotel.add(hotelBody);
 for(let floor=0;floor<3;floor++)for(let x=-10;x<=10;x+=4){
  const win=new THREE.Mesh(new THREE.BoxGeometry(2.25,2.1,.12),glass);win.position.set(x,3.1+floor*3.2,6.58);hotel.add(win);
  const sill=new THREE.Mesh(new THREE.BoxGeometry(2.6,.12,.2),gold);sill.position.set(x,2+floor*3.2,6.65);hotel.add(sill);
 }
 const canopy=new THREE.Mesh(new THREE.BoxGeometry(17,.42,5.2),dark);canopy.position.set(0,4.3,9);hotel.add(canopy);
 for(const x of [-7,7]){const post=new THREE.Mesh(new THREE.CylinderGeometry(.16,.2,4.2,10),gold);post.position.set(x,2.1,10.8);hotel.add(post);}
 const signCanvas=document.createElement('canvas');signCanvas.width=768;signCanvas.height=128;
 const ctx=signCanvas.getContext('2d');ctx.fillStyle='#172632';ctx.fillRect(0,0,768,128);ctx.fillStyle='#d8bd83';ctx.font='bold 48px Georgia';ctx.textAlign='center';ctx.fillText('GRAND HOTEL',384,82);
 const sign=new THREE.Mesh(new THREE.BoxGeometry(.22,2.2,13),new THREE.MeshStandardMaterial({map:new THREE.CanvasTexture(signCanvas),metalness:.25,roughness:.4}));sign.position.set(0,10,6.7);hotel.add(sign);
 hotel.position.set(0,0,25);quarter.add(hotel);
 // Central reflecting fountain, clipped hedges, planters and warm plaza lighting.
 const basin=new THREE.Mesh(new THREE.CylinderGeometry(5.1,5.4,.65,40),dark);basin.position.set(0,.36,-1);quarter.add(basin);
 const water=new THREE.Mesh(new THREE.CylinderGeometry(4.65,4.65,.1,40),new THREE.MeshStandardMaterial({color:0x5c9eae,roughness:.12,metalness:.42,transparent:true,opacity:.92}));water.position.set(0,.72,-1);quarter.add(water);
 const fountainCore=new THREE.Mesh(new THREE.CylinderGeometry(.28,.5,2.1,12),gold);fountainCore.position.set(0,1.7,-1);quarter.add(fountainCore);
 for(const x of [-34,34])for(const z of [-27,28]){
  const planter=new THREE.Mesh(new THREE.BoxGeometry(7,.8,3.2),dark);planter.position.set(x,.4,z);quarter.add(planter);
  for(let i=0;i<5;i++){const shrub=new THREE.Mesh(new THREE.SphereGeometry(.9,8,6),new THREE.MeshStandardMaterial({color:i%2?0x416b4b:0x557b50,roughness:1}));shrub.position.set(x-2.4+i*1.2,1.35,z);quarter.add(shrub);}
 }
 for(const x of [-28,-12,12,28]){
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.07,.11,5.5,8),dark);pole.position.set(x,2.75,31);quarter.add(pole);
  const lamp=new THREE.Mesh(new THREE.SphereGeometry(.28,10,8),new THREE.MeshStandardMaterial({color:0xffe3ad,emissive:0x9c6c32,emissiveIntensity:.65}));lamp.position.set(x,5.55,31);quarter.add(lamp);
 }
 for(const x of [-16,16]){const bollard=new THREE.Mesh(new THREE.CylinderGeometry(.16,.19,.9,10),gold);bollard.position.set(x,.45,35);quarter.add(bollard);}
 quarter.position.set(212,0,132);scene.add(quarter);
}

function buildFrankfurtCityExpansion(){
 // Larger outer city ring: northern residential district and an eastern premium boulevard.
 const roadMat=new THREE.MeshStandardMaterial({color:0x26313b,roughness:.96});
 const pavementMat=new THREE.MeshStandardMaterial({color:0x9ca2a0,roughness:.92});
 const curbMat=new THREE.MeshStandardMaterial({color:0x667278,roughness:.86});
 const lineMat=new THREE.MeshBasicMaterial({color:0xe5dfca});
 // Extend the central avenue north and south so the original city no longer ends abruptly.
 const spine=new THREE.Mesh(new THREE.PlaneGeometry(18,690),roadMat);spine.rotation.x=-Math.PI/2;spine.position.set(0,.002,-55);scene.add(spine);
 for(const x of [-9.2,9.2]){
  const walk=new THREE.Mesh(new THREE.BoxGeometry(3.5,.22,690),pavementMat);walk.position.set(x,.08,-55);scene.add(walk);
  const curb=new THREE.Mesh(new THREE.BoxGeometry(.18,.25,690),curbMat);curb.position.set(x+(x<0?1.7:-1.7),.13,-55);scene.add(curb);
 }
 for(let z=-385;z<=275;z+=14){
  const dash=new THREE.Mesh(new THREE.PlaneGeometry(.16,5.8),lineMat);dash.rotation.x=-Math.PI/2;dash.position.set(0,.016,z);scene.add(dash);
 }
 // Northern neighbourhood, with a connected grid, apartment blocks and pocket gardens.
 for(const x of [-150,-95,95,150]){
  const avenue=new THREE.Mesh(new THREE.PlaneGeometry(9,150),roadMat);avenue.rotation.x=-Math.PI/2;avenue.position.set(x,.006,-330);scene.add(avenue);
  for(const side of [-1,1]){
   const walk=new THREE.Mesh(new THREE.BoxGeometry(2.4,.18,150),pavementMat);walk.position.set(x+side*6,.07,-330);scene.add(walk);
  }
 }
 for(const z of [-390,-350,-310,-270]){
  const cross=new THREE.Mesh(new THREE.PlaneGeometry(330,8),roadMat);cross.rotation.x=-Math.PI/2;cross.position.set(0,.009,z);scene.add(cross);
  for(const x of [-132,-58,58,132]){
   const h=18+((Math.abs(x/10)+Math.abs(z/10))%4)*5;
   if(Math.abs(x)>100)residentialBuilding(x,z+13,15,17,h,[0xbeb7a8,0x9aa9ad,0xc9c0b2,0x83939b][Math.abs(Math.round(z/10))%4]);
   else building(x,z+13,15,17,h,[0x788993,0xb4b4aa,0x9daeb2,0xc1b6a5][Math.abs(Math.round(x/10))%4]);
  }
  for(const x of [-170,-85,85,170]){
   const dash=new THREE.Mesh(new THREE.PlaneGeometry(3.2,.18),lineMat);dash.rotation.x=-Math.PI/2;dash.position.set(x,.018,z);scene.add(dash);
  }
 }
 for(let z=-390;z<=-270;z+=20)for(const x of [-176,-112,112,176])streetLamp(x,z);
 for(let z=-375;z<=-285;z+=30)for(const x of [-72,72])tree(x,z);
 // Eastern extension: a wide boulevard, landscaped median and a second luxury destination.
 for(const x of [245,305,365]){
  const avenue=new THREE.Mesh(new THREE.PlaneGeometry(10,360),roadMat);avenue.rotation.x=-Math.PI/2;avenue.position.set(x,.008,-30);scene.add(avenue);
  for(const side of [-1,1]){
   const walk=new THREE.Mesh(new THREE.BoxGeometry(2.6,.2,360),pavementMat);walk.position.set(x+side*6.4,.075,-30);scene.add(walk);
  }
 }
 for(const z of [-190,-110,-30,50,130,210]){
  const cross=new THREE.Mesh(new THREE.PlaneGeometry(190,8),roadMat);cross.rotation.x=-Math.PI/2;cross.position.set(305,.01,z);scene.add(cross);
  for(const x of [270,340]){
   if(z>90){
    building(x,z+14,17,18,25+((Math.abs(x+z)%3)*7),[0x9ba9ac,0xc6bba8,0x7e929d][Math.abs(Math.round(z/10))%3]);
   }else if(z<-90){
    residentialBuilding(x,z+14,16,18,18+((Math.abs(x+z)%3)*5),[0xb9b5a9,0x9baab0,0xc5b9a8][Math.abs(Math.round(x/10))%3]);
   }else{
    building(x,z+14,16,18,22+((Math.abs(x+z)%3)*6),[0x899da5,0xbdb6a7,0x758992][Math.abs(Math.round(x/10))%3]);
   }
  }
 }
 // Signature luxury promenade at the new eastern edge.
 const promenade=new THREE.Group();
 const marble=new THREE.MeshStandardMaterial({color:0xd5c9b5,roughness:.62});
 const bronze=new THREE.MeshStandardMaterial({color:0x98794c,roughness:.3,metalness:.76});
 const waterMat=new THREE.MeshStandardMaterial({color:0x5797a5,roughness:.12,metalness:.38,transparent:true,opacity:.92});
 const deck=new THREE.Mesh(new THREE.PlaneGeometry(54,82),marble);deck.rotation.x=-Math.PI/2;deck.position.y=.025;promenade.add(deck);
 for(const z of [-31,31])for(const x of [-20,20]){
  const planter=new THREE.Mesh(new THREE.BoxGeometry(8,.72,4),bronze);planter.position.set(x,.36,z);promenade.add(planter);
  for(let i=0;i<5;i++){const shrub=new THREE.Mesh(new THREE.SphereGeometry(.72,8,6),new THREE.MeshStandardMaterial({color:0x426b4d,roughness:1}));shrub.position.set(x-2.5+i*1.25,1.05,z);promenade.add(shrub);}
 }
 const pool=new THREE.Mesh(new THREE.BoxGeometry(17,.65,31),bronze);pool.position.set(0,.36,0);promenade.add(pool);
 const water=new THREE.Mesh(new THREE.BoxGeometry(15,.08,29),waterMat);water.position.set(0,.73,0);promenade.add(water);
 for(const x of [-23,23])for(const z of [-25,-8,9,26]){
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.07,.12,5.8,8),bronze);pole.position.set(x,2.9,z);promenade.add(pole);
  const glow=new THREE.Mesh(new THREE.SphereGeometry(.3,10,8),new THREE.MeshStandardMaterial({color:0xffe3b4,emissive:0x98703b,emissiveIntensity:.75}));glow.position.set(x,5.85,z);promenade.add(glow);
 }
 const pergola=new THREE.Group();
 for(const x of [-7,7])for(const z of [-8,8]){
  const post=new THREE.Mesh(new THREE.BoxGeometry(.28,4.8,.28),bronze);post.position.set(x,2.4,z);pergola.add(post);
 }
 for(let z=-8;z<=8;z+=2.2){const beam=new THREE.Mesh(new THREE.BoxGeometry(14,.2,.22),bronze);beam.position.set(0,4.9,z);pergola.add(beam);}
 pergola.position.set(0,0,-38);promenade.add(pergola);
 promenade.position.set(305,0,165);scene.add(promenade);
 for(const z of [-190,-150,-70,10,90,170,230])for(const x of [238,312,382])streetLamp(x,z);
 for(const z of [-165,-95,-25,45,115,185])for(const x of [230,380])tree(x,z);
 // A compact skyline silhouette at the edge of the playable district.
 for(const [x,z,w,d,h] of [[392,-145,19,18,62],[392,-45,17,18,48],[392,55,20,18,70],[392,205,18,18,54]]){
  const tower=new THREE.Group();
  const shell=new THREE.MeshStandardMaterial({color:0x607783,roughness:.24,metalness:.42});
  const core=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),shell);core.position.y=h/2;tower.add(core);
  const crown=new THREE.Mesh(new THREE.BoxGeometry(w*.65,.8,d*.65),bronze);crown.position.y=h+.4;tower.add(crown);
  for(let y=5;y<h-2;y+=5){const band=new THREE.Mesh(new THREE.BoxGeometry(w+.1,.12,d+.1),marble);band.position.y=y;tower.add(band);}
  tower.position.set(x,0,z);scene.add(tower);
 }
}

function buildFrankfurtStadiumAndPark(){
 const detailCount=liteMode?0:1;
 // Compact football stadium district on the eastern edge of the playable city.
 const stadium=new THREE.Group();
 const concrete=new THREE.MeshStandardMaterial({color:0x8d969b,roughness:.88});
 const darkConcrete=new THREE.MeshStandardMaterial({color:0x38434b,roughness:.82});
 const seatA=new THREE.MeshStandardMaterial({color:0xc7463c,roughness:.82});
 const seatB=new THREE.MeshStandardMaterial({color:0xe2e4df,roughness:.82});
 const turf=new THREE.MeshStandardMaterial({color:0x347b45,roughness:.96});
 const pitch=new THREE.Mesh(new THREE.PlaneGeometry(48,30),turf);pitch.rotation.x=-Math.PI/2;pitch.position.set(0,.13,0);stadium.add(pitch);
 const lineMat=new THREE.MeshBasicMaterial({color:0xecefe3});
 const line=(w,h,x,z)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),lineMat);m.rotation.x=-Math.PI/2;m.position.set(x,.145,z);stadium.add(m);};
 line(46,.12,0,-14.8);line(46,.12,0,14.8);line(.12,30,-23,0);line(.12,30,23,0);
 const center=new THREE.Mesh(new THREE.RingGeometry(4.7,4.85,32),lineMat);center.rotation.x=-Math.PI/2;center.position.y=.15;stadium.add(center);
 for(const side of [-1,1]){
  const stand=new THREE.Mesh(new THREE.BoxGeometry(58,5.2,12),concrete);stand.position.set(0,2.6,side*24);stadium.add(stand);
  for(let row=0;row<5;row++){
   const tier=new THREE.Mesh(new THREE.BoxGeometry(55-row*1.2,.34,1.35),row%2?seatA:seatB);
   tier.position.set(0,4.2+row*.52,side*(19+row*1.45));stadium.add(tier);
  }
 }
 for(const side of [-1,1]){
  const stand=new THREE.Mesh(new THREE.BoxGeometry(12,5.2,34),concrete);stand.position.set(side*32,2.6,0);stadium.add(stand);
  for(let row=0;row<5;row++){
   const tier=new THREE.Mesh(new THREE.BoxGeometry(1.35,.34,31-row*1.1),row%2?seatB:seatA);
   tier.position.set(side*(27+row*1.45),4.2+row*.52,0);stadium.add(tier);
  }
 }
 const roofMat=new THREE.MeshStandardMaterial({color:0x344b5d,metalness:.38,roughness:.48});
 for(const side of [-1,1]){
  const roof=new THREE.Mesh(new THREE.BoxGeometry(62,.65,14),roofMat);roof.position.set(0,7.4,side*25);stadium.add(roof);
  const beam=new THREE.Mesh(new THREE.BoxGeometry(1,.7,14),roofMat);beam.position.set(side*32,7.4,0);stadium.add(beam);
 }
 const signCanvas=document.createElement('canvas');signCanvas.width=768;signCanvas.height=128;
 const signCtx=signCanvas.getContext('2d');signCtx.fillStyle='#152b3b';signCtx.fillRect(0,0,768,128);signCtx.fillStyle='#fff';signCtx.font='bold 54px Arial';signCtx.textAlign='center';signCtx.fillText('FRANKFURT STADION',384,82);
 const signTex=new THREE.CanvasTexture(signCanvas);signTex.colorSpace=THREE.SRGBColorSpace;
 const sign=new THREE.Mesh(new THREE.BoxGeometry(.35,2,34),new THREE.MeshStandardMaterial({map:signTex,roughness:.6}));sign.position.set(0,9,32);stadium.add(sign);
 const floodMat=new THREE.MeshStandardMaterial({color:0xe8f0f3,emissive:0xd4eaff,emissiveIntensity:.75});
 for(const x of [-36,36])for(const z of [-30,30]){
  const mast=new THREE.Mesh(new THREE.CylinderGeometry(.16,.23,13,8),darkConcrete);mast.position.set(x,6.5,z);stadium.add(mast);
  const lamp=new THREE.Mesh(new THREE.BoxGeometry(2.5,.35,.8),floodMat);lamp.position.set(x,13.1,z);stadium.add(lamp);
 }
 stadium.position.set(230,0,-55);scene.add(stadium);
 // Landscaped public park with paths, pond, trees, benches and a small playground.
 const park=new THREE.Group();
 const grass=new THREE.Mesh(new THREE.PlaneGeometry(94,112),new THREE.MeshStandardMaterial({color:0x477b4e,roughness:1}));grass.rotation.x=-Math.PI/2;grass.position.y=-.025;park.add(grass);
 const pathMat=new THREE.MeshStandardMaterial({color:0xbab6a8,roughness:.98});
 const path=new THREE.Mesh(new THREE.PlaneGeometry(5.2,100),pathMat);path.rotation.x=-Math.PI/2;path.position.set(0,.015,0);park.add(path);
 const crossPath=new THREE.Mesh(new THREE.PlaneGeometry(82,4.2),pathMat);crossPath.rotation.x=-Math.PI/2;crossPath.position.set(0,.02,0);park.add(crossPath);
 const pond=new THREE.Mesh(new THREE.CircleGeometry(10,32),new THREE.MeshStandardMaterial({color:0x438fa4,roughness:.22,metalness:.18,transparent:true,opacity:.9}));pond.rotation.x=-Math.PI/2;pond.position.set(25,.035,-25);park.add(pond);
 const rim=new THREE.Mesh(new THREE.TorusGeometry(10,.38,8,40),concrete);rim.rotation.x=Math.PI/2;rim.position.set(25,.08,-25);park.add(rim);
 const trunkMat=new THREE.MeshStandardMaterial({color:0x6a4c35,roughness:1});
 const leafMats=[0x3e754b,0x548957,0x688e54].map(color=>new THREE.MeshStandardMaterial({color,roughness:1}));
 const treePositions=[[-37,-42],[-28,-15],[-39,20],[-25,43],[37,-43],[39,-12],[39,20],[29,43],[-13,-47],[12,-48],[-14,48],[14,48]];
 for(let i=0;i<treePositions.length;i++){
  const [x,z]=treePositions[i];const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.22,.34,3.1,8),trunkMat);trunk.position.set(x,1.55,z);park.add(trunk);
  const crown=new THREE.Mesh(new THREE.SphereGeometry(2.15,10,8),leafMats[i%3]);crown.position.set(x,4.1,z);crown.scale.y=1.15;park.add(crown);
 }
 for(const z of [-34,34])for(const x of [-18,18]){
  const bench=new THREE.Group();const wood=new THREE.MeshStandardMaterial({color:0x805b3e,roughness:.85});
  const seat=new THREE.Mesh(new THREE.BoxGeometry(2.3,.16,.62),wood);seat.position.y=.72;bench.add(seat);
  const back=new THREE.Mesh(new THREE.BoxGeometry(2.3,.72,.12),wood);back.position.set(0,1.05,-.24);bench.add(back);
  for(const sx of [-.85,.85]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.12,.7,.48),darkConcrete);leg.position.set(sx,.35,0);bench.add(leg);}
  bench.position.set(x,0,z);park.add(bench);
 }
 // Playground: slide, climbing frame and swings; decorative only.
 const playMat=new THREE.MeshStandardMaterial({color:0xd18b42,metalness:.16,roughness:.55});
 const frame=new THREE.Mesh(new THREE.BoxGeometry(7,.18,.18),roofMat);frame.position.set(-25,3,8);park.add(frame);
 for(const x of [-28,-22]){const post=new THREE.Mesh(new THREE.CylinderGeometry(.09,.11,3,8),roofMat);post.position.set(x,1.5,8);park.add(post);}
 const slide=new THREE.Mesh(new THREE.BoxGeometry(1.1,.12,3.4),playMat);slide.position.set(-31,1.05,12);slide.rotation.x=-.38;park.add(slide);
 const binMat=new THREE.MeshStandardMaterial({color:0x315f59,roughness:.8});
 for(const [x,z] of [[-8,-37],[8,38],[34,8],[-34,0]]){const bin=new THREE.Mesh(new THREE.CylinderGeometry(.38,.32,.9,12),binMat);bin.position.set(x,.45,z);park.add(bin);}
 for(const [x,z] of [[-40,-8],[40,8],[-12,-50],[12,50]]){
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.07,.1,4.2,8),darkConcrete);pole.position.set(x,2.1,z);park.add(pole);
  const head=new THREE.Mesh(new THREE.BoxGeometry(.65,.18,.3),floodMat);head.position.set(x,4.15,z);park.add(head);
 }
 park.position.set(-230,0,-35);scene.add(park);
 // Detailed street manholes, drain grates and patched asphalt around the central boulevard.
 const asphaltPatch=new THREE.MeshStandardMaterial({color:0x30383e,roughness:.98});
 const iron=new THREE.MeshStandardMaterial({color:0x555e63,metalness:.82,roughness:.52});
 const ironDark=new THREE.MeshStandardMaterial({color:0x242c31,metalness:.72,roughness:.62});
 const coverGeo=new THREE.CylinderGeometry(.62,.62,.075,32);
 for(const z of [-275,-225,-175,-125,-75,-25,25,75,125,175]){
  const patch=new THREE.Mesh(new THREE.CircleGeometry(.78,32),asphaltPatch);patch.rotation.x=-Math.PI/2;patch.position.set(-5.5,.018,z);scene.add(patch);
  const cover=new THREE.Mesh(coverGeo,iron);cover.position.set(-5.5,.075,z);scene.add(cover);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.53,.045,6,32),ironDark);ring.rotation.x=Math.PI/2;ring.position.set(-5.5,.12,z);scene.add(ring);
  for(let k=-2;k<=2;k++){
   const rib=new THREE.Mesh(new THREE.BoxGeometry(.055,.018,.78),ironDark);rib.position.set(-5.5+k*.18,.12,z);scene.add(rib);
  }
  const drain=new THREE.Mesh(new THREE.BoxGeometry(.34,.055,1.05),ironDark);drain.position.set(5.9,.045,z+12);scene.add(drain);
  for(let k=0;k<5;k++){const slot=new THREE.Mesh(new THREE.BoxGeometry(.04,.02,.92),iron);slot.position.set(5.78+k*.055,.078,z+12);scene.add(slot);}
 }
}

function buildBreakableProps(){
 const mats={cone:new THREE.MeshStandardMaterial({color:0xf07826,roughness:.85}),bin:new THREE.MeshStandardMaterial({color:0x246c61,roughness:.9}),sign:new THREE.MeshStandardMaterial({color:0x4a7c9c,metalness:.3,roughness:.7})};
 const placements=[[-8,-22,'cone'],[8,-52,'cone'],[-8,-86,'bin'],[8,-112,'bin'],[-8,8,'sign'],[8,42,'cone'],[-8,74,'bin'],[8,100,'sign'],[-8,-150,'cone'],[8,-180,'bin']];
 for(const [x,z,type] of placements){
  const g=new THREE.Group();
  if(type==='cone'){
   const base=new THREE.Mesh(new THREE.CylinderGeometry(.42,.48,.12,12),mats.cone);base.position.y=.06;g.add(base);
   const body=new THREE.Mesh(new THREE.ConeGeometry(.28,.85,12),mats.cone);body.position.y=.52;g.add(body);
   const stripe=new THREE.Mesh(new THREE.CylinderGeometry(.19,.25,.11,12),new THREE.MeshStandardMaterial({color:0xf5f4e9}));stripe.position.y=.48;g.add(stripe);
  }else if(type==='bin'){
   const body=new THREE.Mesh(new THREE.CylinderGeometry(.42,.36,1.05,12),mats.bin);body.position.y=.55;g.add(body);
   const lid=new THREE.Mesh(new THREE.CylinderGeometry(.46,.46,.12,12),mats.sign);lid.position.y=1.12;g.add(lid);
  }else{
   const pole=new THREE.Mesh(new THREE.CylinderGeometry(.07,.09,1.5,8),mats.sign);pole.position.y=.75;g.add(pole);
   const board=new THREE.Mesh(new THREE.BoxGeometry(.9,.55,.12),mats.sign);board.position.y=1.45;g.add(board);
  }
  g.position.set(x,.02,z);scene.add(g);breakableProps.push({group:g,type,radius:type==='sign'?.9:.8,active:true,velocity:0});
 }
}
function applyCarTuning(car){
 if(!car?.userData?.tuningParts)return;
 const parts=car.userData.tuningParts;
 if(parts.spoiler)parts.spoiler.visible=!!tuningMods.spoiler;
 if(parts.glass){parts.glass.opacity=tuningMods.tinted?.09:.24;parts.glass.color.setHex(tuningMods.tinted?0x101820:0x182b3a);}
 if(parts.rims)for(const rim of parts.rims){rim.material=tuningMods.rims?new THREE.MeshStandardMaterial({color:0xaab6c2,metalness:.92,roughness:.18}):new THREE.MeshStandardMaterial({color:0xb8c4ce,metalness:.8,roughness:.22});}
 car.position.y=tuningMods.lowered?-.075:0;
 const palette=[0x1687d9,0x19a875,0xd4a62a,0x9b58bd,0xb51e2b,0xf0f0e8,0x171b22,0x6d202b];
 if(paintLevel>0&&car.userData.damageParts){const color=palette[paintLevel%palette.length];car.userData.damageParts.originalColor=color;car.userData.damageParts.paint.color.setHex(color);}
}
function applyCarDamage(car,level){
 if(!car)return;
 const d=car.userData.damageParts;if(!d)return;
 const n=Math.max(0,Math.min(4,level|0));
 d.paint.color.setHex(n===0?d.originalColor:[0,0x777777,0x68636a,0x48434a,0x30343a][n]);
 d.paint.roughness=n===0?.38:Math.min(.96,.42+n*.13);
 d.frontBumper.position.y=.42-n*.045;d.frontBumper.rotation.x=-n*.055;d.frontBumper.position.x=n>=3?.12:0;
 d.rearBumper.position.y=.42-n*.03;d.bumper.rotation.x=-n*.08;d.rearBumper.position.x=n>=4?-.16:0;
 d.hoodDent.visible=n>=2;d.hoodDent.position.y=.94-n*.022;
 d.crack.visible=n>=2;d.smoke.visible=n>=3;d.smoke.scale.setScalar(n>=4?1.8:1);
 if(d.scratches)d.scratches.forEach((mesh,i)=>{mesh.visible=n>=i+1;});
 if(d.sideDents)d.sideDents.forEach((mesh,i)=>{mesh.visible=n>=i+2;});
 if(d.headlights)d.headlights.forEach(mesh=>{mesh.material.color.setHex(n>=4?0x66584b:0xfff0c8);mesh.material.transparent=n>=4;mesh.material.opacity=n>=4?.45:1;});
}
function refreshDamageHud(){
 if(!damageHud)return;
 damageHud.classList.remove('hidden');
 damageHud.innerHTML='<b>FAHRZEUGZUSTAND · '+(100-damageLevel*25)+' %</b><span>'+['Keine Schäden','Leichte Kratzer','Dellen & Lackschäden','Stark beschädigt','Reparatur erforderlich'][damageLevel]+'</span><div class="damage-bars">'+[0,1,2,3].map(i=>'<i class="'+(i<damageLevel?'lost':'')+'"></i>').join('')+'</div><small>Werkstatt: TUNINGWERK · Reparatur ab '+Math.max(120,damageLevel*260)+' €</small>';
}
function damagePlayerCar(impact=.24){
 if(!jobCar||impact<.15)return;
 const severity=impact>.43?2:1;
 damageLevel=Math.min(4,damageLevel+severity);flSavedDamage=damageLevel;
 applyCarDamage(jobCar,damageLevel);refreshDamageHud();
 if(damageLevel>=3)carSpeed*=.72;
 flSaveGame();damageFlash=Math.min(.55,.2+impact*.6);
}
function updateBreakableCollisions(dt){
 if(damageCooldown>0)damageCooldown=Math.max(0,damageCooldown-dt);
 if(driving&&jobCar&&Math.abs(carSpeed)>=.075){
  if(damageCooldown===0){
   const movingCars=[...trafficCars,...emergencyVehicles];
   for(const other of movingCars){if(Math.hypot(jobCar.position.x-other.position.x,jobCar.position.z-other.position.z)<2.7){const otherSpeed=other.userData?.traffic?.speed||.12;const impact=Math.abs(carSpeed)+otherSpeed*.012;damagePlayerCar(impact);damageCooldown=1.1;carSpeed*=impact>.38?.32:.58;carSlip*=.35;carYawRate+=(Math.random()-.5)*impact*.12;status.textContent=impact>.38?'STARKE KOLLISION · FAHRZEUG STARK BESCHÄDIGT':'FAHRZEUGKOLLISION · SCHADEN';break;}}
  }
  for(const prop of breakableProps){
   if(!prop.active)continue;
   const dx=jobCar.position.x-prop.group.position.x,dz=jobCar.position.z-prop.group.position.z;
   if(Math.hypot(dx,dz)<prop.radius+1.45){
    prop.active=false;prop.velocity=Math.max(.14,Math.abs(carSpeed)*1.4);
    prop.group.userData.falling=true;prop.group.userData.fallDir=Math.atan2(dx,dz);
    damagePlayerCar(Math.abs(carSpeed)*.9);carSpeed*=.72;carSlip*=.5;
    status.textContent='KOLLISION · FAHRZEUG BESCHÄDIGT';
   }
  }
 }
 for(const prop of breakableProps){
  if(prop.active||!prop.group.userData.falling)continue;
  prop.velocity=Math.max(0,prop.velocity-dt*.55);
  prop.group.rotation.x+=prop.velocity*dt*5;
  prop.group.rotation.z+=prop.velocity*dt*3;
  if(prop.velocity<=.01)prop.group.userData.falling=false;
 }
}


// Gamepad-Unterstützung: Standard-Layout für Xbox-, PlayStation- und kompatible Controller.
let gamepadStatus=null,gamepadPrevButtons=[],gamepadWasConnected=false;
function gamepadButton(gp,index){return !!gp.buttons[index]?.pressed;}
function pollGamepad(){
 if(!navigator.getGamepads)return;
 const pads=Array.from(navigator.getGamepads()).filter(Boolean);
 const gp=pads[0];
 if(!gp){
  if(gamepadWasConnected&&gamepadStatus)gamepadStatus.textContent='CONTROLLER GETRENNT';
  gamepadWasConnected=false;
  for(const code of ['KeyW','KeyS','KeyA','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft'])keys[code]=!!keyboardKeys[code];
  gamepadPrevButtons=[];
  return;
 }
 gamepadWasConnected=true;
 if(gamepadStatus)gamepadStatus.textContent='CONTROLLER VERBUNDEN · '+(gp.mapping==='standard'?'STANDARD':'ERKANNT');
 const axis=(i)=>{const v=gp.axes[i]||0;return Math.abs(v)<.16?0:v;};
 const lx=axis(0),ly=axis(1),rx=axis(2),ry=axis(3);
 keys.KeyW=!!keyboardKeys.KeyW||ly<-.22;keys.KeyS=!!keyboardKeys.KeyS||ly>.22;keys.KeyA=!!keyboardKeys.KeyA||lx<-.22;keys.KeyD=!!keyboardKeys.KeyD||lx>.22;
 // Rechte Achse: Kamera drehen; im Auto bleibt die Fahrtrichtung unabhängig davon.
 if(Math.abs(rx)>.12){if(driving)cameraLookOffset-=rx*.045;else yaw-=rx*.045;}
 if(Math.abs(ry)>.12)pitch=Math.max(-1.15,Math.min(1.15,pitch+ry*.035*(invertCameraY?-1:1)));
 keys.ShiftLeft=!!keyboardKeys.ShiftLeft||gamepadButton(gp,10);
 // Trigger funktionieren auch bei Gamepads, die analoge Werte melden.
 keys.KeyW=keys.KeyW||((gp.buttons[7]?.value||0)>.18);
 keys.KeyS=keys.KeyS||((gp.buttons[6]?.value||0)>.18);
 const pressed=(i)=>gamepadButton(gp,i)&&!gamepadPrevButtons[i];
 if(pressed(0))toggleShopOrDealer();
 if(pressed(1))togglePhone();
 if(pressed(2))toggleVehicle();
 if(pressed(3))toggleJobs();
 if(pressed(4))cycleCamera();
 if(pressed(5))toggleFlashlight();
 if(pressed(9)){if(jobPanel&&!jobPanel.classList.contains('hidden'))jobPanel.classList.add('hidden');else if(shopPanel&&!shopPanel.classList.contains('hidden'))shopPanel.classList.add('hidden');else if(phonePanel&&!phonePanel.classList.contains('hidden'))phonePanel.classList.add('hidden');else if(dealerPanel&&!dealerPanel.classList.contains('hidden'))dealerPanel.classList.add('hidden');}
 // D-Pad als alternative Bewegung bzw. Lenkung.
 keys.ArrowUp=!!keyboardKeys.ArrowUp||gamepadButton(gp,12);keys.ArrowDown=!!keyboardKeys.ArrowDown||gamepadButton(gp,13);keys.ArrowLeft=!!keyboardKeys.ArrowLeft||gamepadButton(gp,14);keys.ArrowRight=!!keyboardKeys.ArrowRight||gamepadButton(gp,15);
 gamepadPrevButtons=gp.buttons.map(b=>!!b.pressed);
}
function toggleShopOrDealer(){
 if(dealerPanel&&!dealerPanel.classList.contains('hidden'))dealerPanel.classList.add('hidden');
 else if(nearestDealer())openDealer();
 else toggleShop();
}
function buildGamepadStatus(){
 gamepadStatus=document.createElement('div');gamepadStatus.id='gamepadStatus';
 gamepadStatus.textContent='CONTROLLER: SUCHE…';viewport.appendChild(gamepadStatus);
}

function move(dt=1/60){
  if(activeBoat){const fs=Math.min(3,Math.max(.25,dt*60));if(keys.KeyW||keys.ArrowUp)boatSpeed=Math.min(.62,boatSpeed+.004*fs);else if(keys.KeyS||keys.ArrowDown)boatSpeed=Math.max(-.18,boatSpeed-.006*fs);else boatSpeed*=Math.pow(.994,fs);const steer=(keys.KeyA||keys.ArrowLeft?1:0)-(keys.KeyD||keys.ArrowRight?1:0);boatHeading+=steer*(.009+Math.abs(boatSpeed)*.018)*fs;activeBoat.rotation.y=boatHeading;activeBoat.position.x+=Math.sin(boatHeading)*boatSpeed*fs;activeBoat.position.z+=Math.cos(boatHeading)*boatSpeed*fs;activeBoat.position.x=Math.max(-165,Math.min(165,activeBoat.position.x));activeBoat.position.z=Math.max(333,Math.min(720,activeBoat.position.z));activeBoat.position.y=.05+Math.sin(clock.elapsedTime*3)*.07;camera.position.set(activeBoat.position.x-Math.sin(boatHeading)*8,activeBoat.position.y+4,activeBoat.position.z-Math.cos(boatHeading)*8);camera.lookAt(activeBoat.position.x,1,activeBoat.position.z+Math.cos(boatHeading)*5);coords.textContent='MOTORBOOT · '+Math.round(Math.abs(boatSpeed)*95)+' KM/H';return;}
  if(planeFlying&&airportPlane){
    const frameScale=Math.min(3,Math.max(.25,dt*60));
    if(keys.KeyW||keys.ArrowUp)planeSpeed=Math.min(.72,planeSpeed+.0025*frameScale);else if(keys.KeyS||keys.ArrowDown)planeSpeed=Math.max(0,planeSpeed-.004*frameScale);else planeSpeed*=Math.pow(.997,frameScale);
    if(keys.KeyA||keys.ArrowLeft)planeHeading+=.009*frameScale;if(keys.KeyD||keys.ArrowRight)planeHeading-=.009*frameScale;
    if(keys.Space)planeAltitude=Math.min(48,planeAltitude+.12*frameScale);if(keys.ShiftLeft||keys.ShiftRight)planeAltitude=Math.max(0,planeAltitude-.12*frameScale);
    airportPlane.position.x+=Math.sin(planeHeading)*planeSpeed*frameScale;airportPlane.position.z+=Math.cos(planeHeading)*planeSpeed*frameScale;airportPlane.position.y=planeAltitude;
    airportPlane.rotation.y=planeHeading;airportPlane.rotation.z=((keys.KeyA||keys.ArrowLeft)?-.16:0)+((keys.KeyD||keys.ArrowRight)?.16:0);airportPlane.rotation.x=(keys.Space?-.035:0)+((keys.ShiftLeft||keys.ShiftRight)?.035:0);
    camera.position.set(airportPlane.position.x-Math.sin(planeHeading)*18,planeAltitude+7,airportPlane.position.z-Math.cos(planeHeading)*18);camera.lookAt(airportPlane.position.x,planeAltitude+1,airportPlane.position.z+Math.cos(planeHeading)*12);yaw=planeHeading+Math.PI;pitch=-.08;
    coords.textContent='FLUGZEUG · HÖHE '+Math.round(planeAltitude)+' M · TEMPO '+Math.round(planeSpeed*420)+' KM/H';return;
  }
  if(driving&&jobCar){
    // Vereinfachtes Fahrzeugmodell: Antrieb, Bremsen, Rollwiderstand und Haftung sind zeitbasiert.
    const frameScale=Math.min(3,Math.max(.25,dt*60));
    const accelerating=keys.KeyW||keys.ArrowUp, braking=keys.KeyS||keys.ArrowDown;
    const handbrake=!!keys.Space;
    const weatherGrip=flWeather==='Regen'?.68:flWeather==='Nebel'?.88:flWeather==='Bewölkt'?.94:1;
    const damageGrip=damageLevel>=4?.72:damageLevel===3?.84:damageLevel===2?.93:1;
    const tireGrip=weatherGrip*damageGrip;
    const vehiclePower=(jobCar.userData.enginePower||1)*(1+turboLevel*.12);
    const maxForward=((jobCar.userData.maxForwardSpeed||.47)+tuningLevel*.012+turboLevel*.018)*(damageLevel>=4?.62:damageLevel===3?.78:1),maxReverse=.16;
    if(accelerating&&flFuel>0){
      if(carSpeed<0)carSpeed=Math.min(0,carSpeed+.022*frameScale);
      else carSpeed=Math.min(maxForward,carSpeed+(.0038*vehiclePower+Math.max(0,1-carSpeed/maxForward)*.0035*vehiclePower)*frameScale);
    }else if(braking){
      // Betriebsbremse: stärker als Motorbremse, mit sanftem Übergang zum Stillstand.
      if(carSpeed>0)carSpeed=Math.max(0,carSpeed-(.014+.012*tireGrip)*frameScale);
      else carSpeed=Math.max(-maxReverse,carSpeed-.004*frameScale);
    }else{
      // Motor- und Rollwiderstand bauen Geschwindigkeit allmählich ab.
      carSpeed*=Math.pow(.994,frameScale);
      if(Math.abs(carSpeed)<.0012)carSpeed=0;
    }
    if(handbrake)carSpeed*=Math.pow(.91,frameScale);
    const steer=(keys.KeyA||keys.ArrowLeft?1:0)-(keys.KeyD||keys.ArrowRight?1:0);
    const speedRatio=Math.min(1,Math.abs(carSpeed)/Math.max(.1,maxForward));
    // Bei höherem Tempo wird die Lenkreaktion direkter, aber die Reifen können überfordern.
    const steeringResponse=(.0018+speedRatio*.016)*Math.max(.55,tireGrip)*(carSpeed<0?-1:1);
    const lateralGrip=handbrake?.965:(.78+(1-tireGrip)*.15);
    const slipInput=handbrake?.026:.0075;
    carSlip+=steer*speedRatio*slipInput*frameScale;
    carSlip=Math.max(-.27,Math.min(.27,carSlip));
    carSlip*=Math.pow(lateralGrip,frameScale);
    // Nasse Fahrbahn und Handbremse lassen die Seitenführung länger wegrutschen.
    const yawTarget=steer*steeringResponse*frameScale*(handbrake?1.55:1);
    carYawRate+=(yawTarget-carYawRate)*Math.min(1,.22*frameScale);
    carYawRate*=Math.pow(.84,frameScale);
    jobCar.rotation.y+=carYawRate;
    const forward=new THREE.Vector3(Math.sin(jobCar.rotation.y),0,Math.cos(jobCar.rotation.y));
    const right=new THREE.Vector3(Math.cos(jobCar.rotation.y),0,-Math.sin(jobCar.rotation.y));
    jobCar.position.addScaledVector(forward,carSpeed*frameScale);
    jobCar.position.addScaledVector(right,carSlip*frameScale);
    updateBreakableCollisions(dt);
    if(jobActive&&jobDestination&&jobCar.position.distanceTo(jobDestination)<4){
      jobStopIndex++;
      if(jobStopIndex<jobStops.length){
        jobDestination=jobStops[jobStopIndex];
        if(jobCar.userData.jobMarker)jobCar.userData.jobMarker.position.copy(jobDestination);
        const progress=missionHud?.querySelector('#missionProgress');if(progress)progress.textContent='STOPP '+(jobStopIndex+1)+' / '+jobStops.length+' · Weiter zum nächsten Marker';
        const track=missionHud?.querySelector('.mission-track i');if(track)track.style.width=(jobStopIndex/jobStops.length*100)+'%';
        status.textContent='CHECKPOINT ERREICHT · WEITER ZUM NÄCHSTEN ZIEL';
      }else{
        jobActive=false;completedJobs++;flCheckDailyDate();flDailyJobs++;const reward=350+Math.floor(Math.random()*351);careerMoney+=reward;
        if(jobCar.userData.jobMarker){scene.remove(jobCar.userData.jobMarker);jobCar.userData.jobMarker=null;}
        driving=false;carSpeed=0;
        if(careerHud)careerHud.innerHTML='KONTO: '+careerMoney.toLocaleString('de-DE')+' €<br>AUFTRÄGE: '+completedJobs;
        status.textContent='MISSION ERLEDIGT · +'+reward+' €';
        if(missionHud){missionHud.classList.add('hidden');}
        jobDestination=null;jobStops=[];
      }
    }
    // Der östliche Stadtplatz ist autofrei; Fahrzeuge bleiben auf den Straßen.
    if(jobCar.position.x>22&&jobCar.position.z>-118&&jobCar.position.z<48)jobCar.position.x=22;
    jobCar.position.x=Math.max(-178,Math.min(178,jobCar.position.x));
    jobCar.position.z=Math.max(-298,Math.min(218,jobCar.position.z));
    yaw=jobCar.rotation.y-Math.PI+cameraLookOffset;
    if(cameraMode==='ego'){
      // Fahrerblick knapp hinter dem Lenkrad, innerhalb des Cockpits.
      camera.position.copy(jobCar.localToWorld(new THREE.Vector3(-.42,1.48,.43)));
    }else{
      camera.position.copy(jobCar.position).addScaledVector(forward,cameraMode==='close'?-3.6:cameraMode==='hood'?1:-6);
      camera.position.y=cameraMode==='hood'?1.55:cameraMode==='close'?2.55:3.2;
    }
    if(damageFlash>0)damageFlash=Math.max(0,damageFlash-.02);
  }else{
    const speed=(keys.ShiftLeft||keys.ShiftRight)?.2:.12;
    const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));
    const right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
    if(keys.KeyW||keys.ArrowUp)camera.position.addScaledVector(forward,speed);
    if(keys.KeyS||keys.ArrowDown)camera.position.addScaledVector(forward,-speed);
    if(keys.KeyA||keys.ArrowLeft)camera.position.addScaledVector(right,-speed);
    if(keys.KeyD||keys.ArrowRight)camera.position.addScaledVector(right,speed);
    camera.position.x=Math.max(-178,Math.min(178,camera.position.x));    camera.position.z=Math.max(-298,Math.min(360,camera.position.z));
    camera.position.y=2.1;
  }
  updateSpeedometer();
  camera.rotation.order='YXZ';camera.rotation.set(pitch,yaw,0);
  coords.textContent=(driving?'FAHRZEUG ':'POSITION ')+Math.round(camera.position.x)+' / '+Math.round(camera.position.z)+(jobActive&&jobDestination?' · ZIEL '+Math.round((driving?jobCar.position:camera.position).distanceTo(jobDestination))+' M':'');
}
function tryStartFlight(){
 if(!airportPlane||driving||planeFlying)return false;
 if(camera.position.distanceTo(airportPlane.position)>15){status.textContent='GEHE ZUM FLUGZEUG AM FLUGHAFEN';return false;}
 planeFlying=true;planeSpeed=0;planeAltitude=0;planeHeading=airportPlane.rotation.y;airportPlane.position.y=0;
 militaryEscorts.forEach((e,i)=>{e.visible=true;e.position.set(airportPlane.position.x+(i?10:-10),4,airportPlane.position.z-28);});
 status.textContent='FLUGMISSION · W/S TEMPO · A/D RICHTUNG · LEERTASTE STEIGEN · SHIFT SINKEN · F LANDEN';return true;
}
function tryTakeoverVehicle(){
 if(driving||planeFlying||takeoverTarget)return;
 let nearest=null,dist=7;
 for(const car of trafficCars){const d=Math.hypot(car.position.x-camera.position.x,car.position.z-camera.position.z);if(d<dist){dist=d;nearest=car;}}
 if(!nearest){status.textContent='KEIN FREIGEGEBENES FAHRZEUG IN REICHWEITE';return;}
 takeoverTarget=nearest;takeoverProgress=0;if(takeoverActor)scene.remove(takeoverActor);takeoverActor=new THREE.Group();const actorBody=new THREE.Mesh(new THREE.BoxGeometry(.48,.82,.28),new THREE.MeshStandardMaterial({color:0x345b86}));actorBody.position.y=1.05;takeoverActor.add(actorBody);const actorHead=new THREE.Mesh(new THREE.SphereGeometry(.2,10,8),new THREE.MeshStandardMaterial({color:0xc99570}));actorHead.position.y=1.62;takeoverActor.add(actorHead);for(const side of [-1,1]){const limb=new THREE.Mesh(new THREE.BoxGeometry(.14,.62,.16),new THREE.MeshStandardMaterial({color:0x263342}));limb.position.set(side*.14,.38,0);takeoverActor.add(limb);}takeoverActor.position.set(nearest.position.x+1.25,0,nearest.position.z);scene.add(takeoverActor);takeoverHud?.classList.remove('hidden');status.textContent='FAHRZEUG-TEILEN · FAHRER GIBT DAS AUTO FREIWILLIG FREI';
}
function toggleFlashlight(){
  if(!flashlight)return;
  flashlightOn=!flashlightOn;flashlight.intensity=flashlightOn?3.2:0;
  status.textContent=flashlightOn?'TASCHENLAMPE AN · L ZUM AUSSCHALTEN':'TASCHENLAMPE AUS · L ZUM EINSCHALTEN';
}
function cycleCamera(){cameraMode=cameraMode==='follow'?'close':cameraMode==='close'?'hood':cameraMode==='hood'?'ego':'follow';status.textContent='KAMERA: '+({follow:'VERFOLGER',close:'NAH',hood:'MOTORHAUBE',ego:'EGO-PERSPEKTIVE'}[cameraMode]);}
function buildSpeedometerHud(){
  if(speedometerHud)return;
  speedometerHud=document.createElement('section');
  speedometerHud.id='speedometerHud';speedometerHud.className='speedometer-hud hidden';
  speedometerHud.innerHTML='<div class="speedo-top"><span>FRANKFURT MOTORSPORT</span><b id="speedoGear">D</b></div><div class="speedo-main"><strong id="speedoSpeed">0</strong><span>KM/H</span></div><div class="speedo-rpm"><div class="speedo-rpm-label"><span>DREHZAHL</span><b id="speedoRpm">850 RPM</b></div><div class="speedo-rpm-track"><i id="speedoRpmBar"></i></div></div><div class="speedo-bottom"><span id="speedoVehicle">FAHRZEUG</span><span id="speedoFuel">TANK 100%</span></div>';
  viewport.appendChild(speedometerHud);
}
function updateSpeedometer(){
  if(!speedometerHud||speedometerHud.classList.contains('hidden')||!driving||!jobCar)return;
  const maxKmh=jobCar.userData.maxSpeedKmh||190;
  const kmh=Math.min(maxKmh,Math.round(Math.abs(carSpeed)/Math.max(.01,jobCar.userData.maxForwardSpeed||(.47*maxKmh/240))*maxKmh));
  const ratio=Math.min(1,kmh/maxKmh);
  const gear=carSpeed<-.015?'R':kmh<2?'N':Math.min(8,Math.max(1,Math.ceil(kmh/maxKmh*8)));
  const rpm=Math.round(850+ratio*6200+Math.sin(clock.elapsedTime*18)*Math.min(180,ratio*180));
  const speedEl=speedometerHud.querySelector('#speedoSpeed');
  const gearEl=speedometerHud.querySelector('#speedoGear');
  const rpmEl=speedometerHud.querySelector('#speedoRpm');
  const rpmBar=speedometerHud.querySelector('#speedoRpmBar');
  const vehicleEl=speedometerHud.querySelector('#speedoVehicle');
  const fuelEl=speedometerHud.querySelector('#speedoFuel');
  if(speedEl)speedEl.textContent=String(kmh).padStart(3,'0');
  if(gearEl)gearEl.textContent=gear;
  if(rpmEl)rpmEl.textContent=rpm.toLocaleString('de-DE')+' RPM';
  if(rpmBar)rpmBar.style.width=Math.min(100,(rpm/7500)*100)+'%';
  if(vehicleEl)vehicleEl.textContent=jobCar.userData.maxSpeedKmh+' KM/H · '+(jobCar.userData.traffic?'VERKEHR':'FAHRZEUG');
  if(fuelEl)fuelEl.textContent='TANK '+Math.round(flFuel)+'%';
}
function toggleVehicle(){
  if(activeBoat){tryStartBoat();return;}
  if(planeFlying){planeFlying=false;planeSpeed=0;status.textContent='FLUG BEENDET · ZURÜCK AM FLUGHAFEN';if(takeoverHud)takeoverHud.classList.add('hidden');camera.position.set(airportPlane.position.x+5,2.1,airportPlane.position.z+5);return;}
  if(!jobCar){status.textContent='WÄHLE ZUERST EINEN JOB MIT J';return;}
  buildSpeedometerHud();
  if(!driving){
    if(camera.position.distanceTo(jobCar.position)>9){status.textContent='GEHE NÄHER AN DEIN DIENSTFAHRZEUG';return;}
    driving=true;carSpeed=0;carSlip=0;carYawRate=0;cameraLookOffset=0;yaw=jobCar.rotation.y-Math.PI;
    speedometerHud.classList.remove('hidden');
    status.textContent='IM FAHRZEUG · WASD / STICK FAHREN · F / X AUSSTEIGEN';
  }else{
    driving=false;carSpeed=0;carSlip=0;carYawRate=0;cameraLookOffset=0;
    speedometerHud.classList.add('hidden');
    camera.position.set(jobCar.position.x+3,2.1,jobCar.position.z+3);
    status.textContent='AUSGESTIEGEN · F / X ZUM EINSTEIGEN';
  }
}
function buildMobileControls(){
 if(!('ontouchstart' in window)&&!navigator.maxTouchPoints)return;
 const panel=document.createElement('div');panel.id='mobileControls';panel.innerHTML='<div class="mobile-pad"><button data-key="KeyW">▲</button><div><button data-key="KeyA">◀</button><button data-key="KeyS">▼</button><button data-key="KeyD">▶</button></div></div><div class="mobile-actions"><button data-key="ShiftLeft">SPRINT</button><button data-action="interact">E</button><button data-action="vehicle">F</button><button data-action="jobs">J</button><button data-action="phone">☎</button></div><div class="mobile-look">ZUM UMSCHAUEN HIER WISCHEN</div>';
 viewport.appendChild(panel);
 panel.querySelectorAll('[data-key]').forEach(btn=>{const code=btn.dataset.key;const on=e=>{e.preventDefault();keys[code]=true;keyboardKeys[code]=true;};const off=e=>{e.preventDefault();keys[code]=false;keyboardKeys[code]=false;};btn.addEventListener('pointerdown',on);['pointerup','pointercancel','pointerleave'].forEach(ev=>btn.addEventListener(ev,off));});
 panel.querySelectorAll('[data-action]').forEach(btn=>btn.addEventListener('pointerdown',e=>{e.preventDefault();const a=btn.dataset.action;if(a==='interact')toggleShopOrDealer();if(a==='vehicle'){if(!tryStartBoat()&&!tryStartFlight())toggleVehicle();}if(a==='jobs')toggleJobs();if(a==='phone')togglePhone();}));
}
function togglePauseMenu(force){
 if(!pausePanel){pausePanel=document.createElement('section');pausePanel.id='pauseMenu';pausePanel.className='pause-menu hidden';pausePanel.innerHTML='<div class="pause-card"><div class="pause-kicker">FRANKFURT LIFE</div><h2>PAUSE</h2><p>Deine Stadt. Dein Tempo.</p><button data-pause="resume">WEITERSPIELEN</button><button data-pause="save">SPIELSTAND SPEICHERN</button><button data-pause="settings">EINSTELLUNGEN</button><button data-pause="close">ZURÜCK ZUR STADT</button></div>';viewport.appendChild(pausePanel);pausePanel.addEventListener('click',e=>{const action=e.target.closest('[data-pause]')?.dataset.pause;if(!action)return;if(action==='save'){flSaveGame(true);return;}if(action==='settings'){gamePaused=false;pausePanel.classList.add('hidden');if(phonePanel?.classList.contains('hidden'))phonePanel.classList.remove('hidden');showPhoneHome();openPhoneApp('settings');document.exitPointerLock?.();return;}gamePaused=false;pausePanel.classList.add('hidden');});}
 const next=force===undefined?!gamePaused:!!force;gamePaused=next;pausePanel.classList.toggle('hidden',!next);if(next)document.exitPointerLock?.();
}
function buildPerformanceHud(){
  perfHud=document.createElement('div');perfHud.id='performanceHud';
  perfHud.style.cssText='position:absolute;right:14px;top:14px;z-index:9;padding:7px 10px;border:1px solid #ffffff35;border-radius:7px;background:#081321dd;color:#d9f4ff;font:700 11px/1.45 system-ui;letter-spacing:.3px;pointer-events:none;white-space:pre-line';
  perfHud.textContent='FPS: --\nRender-Skalierung: 100%';viewport.appendChild(perfHud);
}
function loop(now=0){
  if(document.hidden)return;
  raf=requestAnimationFrame(loop);
  if(maxFps&&now-lastFrame<1000/maxFps)return;
  pollGamepad();
  const frameMs=lastFrame?now-lastFrame:0;
  if(frameMs>0){perfFrames.push(frameMs);if(perfFrames.length>45)perfFrames.shift();}
  lastFrame=now;const dt=Math.min(clock.getDelta(),.05);
  flUpdateHomeDoor(dt);
  // Dynamic resolution only reacts to real rendering load, not an intentional 30-FPS cap.
  if((!maxFps||maxFps>=50)&&now-perfLastCheck>3000&&perfFrames.length>=20){
    perfLastCheck=now;const avgMs=perfFrames.reduce((a,b)=>a+b,0)/perfFrames.length;
    if(avgMs>28&&autoResolutionScale>.42){autoResolutionScale=Math.max(.42,autoResolutionScale*.88);applyQuality();}
    else if(avgMs<17.5&&autoResolutionScale<1){autoResolutionScale=Math.min(1,autoResolutionScale+.04);applyQuality();}
  }
  if(gamePaused)return;
  perfHudTimer+=dt;
  if(perfHud&&perfHudTimer>.75){perfHudTimer=0;const avg=perfFrames.length?perfFrames.reduce((a,b)=>a+b,0)/perfFrames.length:0;const fps=avg>0?Math.round(1000/avg):0;perfHud.textContent='FPS: '+(fps||'--')+'\nRender-Skalierung: '+Math.round(autoResolutionScale*100)+'%';}
  move(dt);updateWorld(dt);renderer.render(scene,camera);
}
// Stop the animation loop entirely while the game tab is in the background.
document.addEventListener('visibilitychange',()=>{
  if(!started)return;
  if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0;lastFrame=0;perfFrames.length=0;}
  else if(!raf){lastFrame=0;clock.getDelta();raf=requestAnimationFrame(loop);}
});
function begin(){
  if(started)return;started=true;placeholder?.remove();
  if(qualitySelect){const saved=localStorage.getItem('flQuality');qualitySelect.value=lowEndDevice?'legacy':(saved&&qualitySettings[saved]?saved:(saved==='ultra'?'legacy':'high'));}
  if(fpsSelect){const savedFps=localStorage.getItem('flFps');fpsSelect.value=savedFps||(lowEndDevice?'30':'60');maxFps=fpsSelect.value==='unlimited'?0:Number(fpsSelect.value);}
  if(mouseSelect){mouseSelect.value=localStorage.getItem('flMouse')||'1';mouseSensitivity=Number(mouseSelect.value)||1;}
  if(fovSelect){fovSelect.value=localStorage.getItem('flFov')||'68';cameraFov=Number(fovSelect.value)||68;}
  if(cameraSelect){cameraSelect.value=localStorage.getItem('flCamera')||'follow';cameraMode=cameraSelect.value||'follow';}
  status.textContent=lowEndDevice?'OLD-SCHOOL-MODUS · STADT BLEIBT GUT ERKENNBAR':'STADT GELADEN · KLICKE INS SPIEL';
  try{
    renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',stencil:false,depth:true,preserveDrawingBuffer:false});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,classicEdition?.58:lowEndDevice?.68:1));
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    renderer.shadowMap.enabled=false;
    sunLight=null;hemiLight=null;
    makeCity();buildBreakableProps();buildInGameJobs();buildShopInteraction();buildPhone();document.querySelector("#openSettings")?.addEventListener("click",()=>{if(phonePanel?.classList.contains("hidden"))phonePanel.classList.remove("hidden");showPhoneHome();openPhoneApp("settings");document.exitPointerLock?.();});buildDealerPanel();buildMiniMap();buildGamepadStatus();flBuildStatus();applyQuality();viewport.appendChild(renderer.domElement);buildPerformanceHud();buildMobileControls();flLoadGame();flApplyWeather();resize();loop();startIntroTutorial();
    renderer.domElement.tabIndex=0;
    renderer.domElement.addEventListener('click',()=>{renderer.domElement.focus();if(!phonePanel||phonePanel.classList.contains('hidden')){try{const result=renderer.domElement.requestPointerLock?.();if(result?.catch)result.catch(()=>{status.textContent='MAUSZIEHEN ZUM UMSEHEN';});}catch(_){status.textContent='MAUSZIEHEN ZUM UMSEHEN';}}});
    renderer.domElement.addEventListener('pointerdown',e=>{if(e.button!==0||locked)return;lookDrag=true;lastPointerX=e.clientX;lastPointerY=e.clientY;});
    document.addEventListener('pointerup',()=>lookDrag=false);
    const applyMouseLook=(dx,dy)=>{yaw-=dx*.0045*mouseSensitivity;if(driving)cameraLookOffset-=dx*.0045*mouseSensitivity;pitch=Math.max(-1.15,Math.min(1.15,pitch-dy*.0045*mouseSensitivity*(invertCameraY?-1:1)));};
    viewport.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('button,select,input,.phone-overlay,.ingame-jobs,#mobileControls'))return;lookDrag=true;lastPointerX=e.clientX;lastPointerY=e.clientY;});
    document.addEventListener('pointermove',e=>{if(!lookDrag||locked)return;const dx=e.clientX-lastPointerX,dy=e.clientY-lastPointerY;lastPointerX=e.clientX;lastPointerY=e.clientY;applyMouseLook(dx,dy);});
    document.addEventListener('pointerlockerror',()=>{locked=false;status.textContent='MAUSZIEHEN ZUM UMSEHEN';});
    document.addEventListener('pointerlockchange',()=>{
      locked=document.pointerLockElement===renderer.domElement;
      if(locked)lookDrag=false;
      status.textContent=locked?'MAUS AKTIV · ESC ZUM PAUSIEREN':'MAUSZIEHEN ODER INS SPIEL KLICKEN';
    });
    document.addEventListener('mousemove',e=>{
      if(!locked)return;applyMouseLook(e.movementX,e.movementY);
    });
  }catch(e){
    status.textContent='3D NICHT VERFÜGBAR';
    viewport.innerHTML='<div class="game-placeholder"><div class="placeholder-title">3D-DEMO NICHT<br><em>VERFÜGBAR</em></div><p>Dein Browser oder deine Grafikkarte unterstützt WebGL möglicherweise nicht.</p></div>';
  }
}
startButton?.addEventListener('click',begin);
// In der eigenständigen Windows-Spielansicht direkt in die 3D-Stadt starten.
if(document.body.classList.contains('game-app')) begin();
document.addEventListener('keydown',e=>{keys[e.code]=true;keyboardKeys[e.code]=true;if(e.code==='Escape'&&!e.repeat){const overlays=[jobPanel,shopPanel,phonePanel,dealerPanel];const visible=overlays.find(p=>p&&!p.classList.contains('hidden'));if(visible){visible.classList.add('hidden');return;}togglePauseMenu();return;}if(e.code==='F1'){e.preventDefault();if(!e.repeat)togglePhone();return;}if(e.code==='KeyQ'&&!e.repeat){e.preventDefault();toggleQuickAccessWheel();return;}if(e.code==='KeyE'&&!e.repeat){if(!flToggleHome()&&!tryRefuelAtPump())toggleShopOrDealer();}if(e.code==='KeyF'&&!e.repeat){if(!tryStartBoat()&&!tryStartFlight())toggleVehicle();}if(e.code==='KeyG'&&!e.repeat)tryTakeoverVehicle();if(e.code==='KeyJ'&&!e.repeat)toggleJobs();if(e.code==='KeyL'&&!e.repeat)toggleFlashlight();if(e.code==='F5'&&!e.repeat){e.preventDefault();flSaveGame(true);}if(e.code==='KeyC'&&!e.repeat)cycleCamera();if(e.code==='Escape'&&jobPanel&&!jobPanel.classList.contains('hidden'))jobPanel.classList.add('hidden');if(e.code==='Escape'&&shopPanel&&!shopPanel.classList.contains('hidden'))shopPanel.classList.add('hidden');if(e.code==='Escape'&&phonePanel&&!phonePanel.classList.contains('hidden'))phonePanel.classList.add('hidden');if(e.code==='Escape')document.querySelector('#quickAccessWheel')?.classList.add('hidden');if(e.code==='Escape'&&!e.repeat&&(!jobPanel||jobPanel.classList.contains('hidden'))&&(!shopPanel||shopPanel.classList.contains('hidden'))&&(!phonePanel||phonePanel.classList.contains('hidden'))&&(!dealerPanel||dealerPanel.classList.contains('hidden')))togglePauseMenu();if(e.code==='Escape'&&dealerPanel&&!dealerPanel.classList.contains('hidden'))dealerPanel.classList.add('hidden');if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();});
document.addEventListener('keyup',e=>{keys[e.code]=false;keyboardKeys[e.code]=false;});
window.addEventListener('resize',resize);

/* Frankfurt Life 0.5.0 – Fotomodus, MainFeed und filmischer Fahrzeugeinstieg */
(()=>{
  const photoStoreKey='flMainFeedPhotosV1';
  let flPhotos=[];
  try{flPhotos=JSON.parse(localStorage.getItem(photoStoreKey)||'[]');if(!Array.isArray(flPhotos))flPhotos=[];}catch(_){flPhotos=[];}
  const savePhotos=()=>{try{localStorage.setItem(photoStoreKey,JSON.stringify(flPhotos.slice(-5)));}catch(_){if(status)status.textContent='FOTOSPEICHER VOLL · ÄLTERE FOTOS LÖSCHEN';}};
  const escapeHtml=value=>String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const photoStyle=document.createElement('style');
  photoStyle.textContent='.fl-photo-actions{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.fl-photo-actions button,.fl-post button{border:1px solid #5b9db9;border-radius:8px;background:#15374d;color:#eefaff;padding:10px 12px;font-weight:800;cursor:pointer}.fl-photo-preview{width:100%;max-height:190px;object-fit:cover;border-radius:12px;border:1px solid #ffffff30;background:#07111c}.fl-post{margin:12px 0;padding:10px;border:1px solid #ffffff22;border-radius:12px;background:#ffffff09}.fl-post img{display:block;width:100%;max-height:190px;object-fit:cover;border-radius:9px;margin:8px 0}.fl-post p{font-size:12px;color:#d4e6f1}.fl-photo-empty{padding:18px;border:1px dashed #6a8799;border-radius:12px;color:#b7cbd8;text-align:center;font-size:12px}';
  document.head.appendChild(photoStyle);

  function captureCityPhoto(){
    if(!renderer?.domElement){if(status)status.textContent='FOTOMODUS ERST NACH SPIELSTART VERFÜGBAR';return;}
    try{
      const source=renderer.domElement,canvas=document.createElement('canvas');
      const scale=Math.min(1,640/source.width,360/source.height);
      canvas.width=Math.max(1,Math.round(source.width*scale));canvas.height=Math.max(1,Math.round(source.height*scale));
      const ctx=canvas.getContext('2d');ctx.drawImage(source,0,0,canvas.width,canvas.height);
      const image=canvas.toDataURL('image/jpeg',.68);
      const photo={id:Date.now(),image,caption:'',posted:false,place:camera?Math.round(camera.position.x)+' / '+Math.round(camera.position.z):'Frankfurt'};
      flPhotos.push(photo);flPhotos=flPhotos.slice(-5);savePhotos();
      if(status)status.textContent='FOTO AUFGENOMMEN · IN DEINER GALERIE GESPEICHERT';
      renderPhotoApp('camera');
    }catch(_){if(status)status.textContent='FOTO NICHT MÖGLICH · BITTE ERNEUT VERSUCHEN';}
  }
  function renderPhotoApp(which){
    if(!phonePanel)return;
    const page=phonePanel.querySelector('#phonePage');if(!page)return;
    const gallery=flPhotos.slice().reverse();
    if(which==='camera'){
      const latest=gallery[0];
      page.innerHTML='<div class="phone-page-head">Frankfurt Kamera</div><p>Halte deinen aktuellen Blick auf die Stadt als Foto fest.</p>'+(latest?'<img class="fl-photo-preview" src="'+latest.image+'" alt="Letztes Stadtfoto">':'<div class="fl-photo-empty">Noch keine Fotos aufgenommen</div>')+'<div class="fl-photo-actions"><button data-photo="capture">📸 Foto aufnehmen</button><button data-photo="feed">MainFeed öffnen</button></div><p>Gespeicherte Fotos: '+flPhotos.length+'/5</p>';
    }else{
      page.innerHTML='<div class="phone-page-head">MainFeed</div><p>Dein lokaler Stadt-Feed · Teile deine schönsten Frankfurt-Momente auf diesem Gerät.</p>'+gallery.map(p=>'<article class="fl-post"><img src="'+p.image+'" alt="Stadtfoto"><p>'+escapeHtml(p.caption||'Frankfurt-Moment · '+p.place)+'</p><small>'+escapeHtml(p.place)+' · '+(p.posted?'VERÖFFENTLICHT':'ENTWURF')+'</small>'+(p.posted?'':'<div class="fl-photo-actions"><input data-caption="'+p.id+'" maxlength="90" placeholder="Bildunterschrift..." aria-label="Bildunterschrift"><button data-post="'+p.id+'">Posten</button></div>')+'</article>').join('')+(gallery.length?'':'<div class="fl-photo-empty">Dein Feed ist noch leer. Mach zuerst ein Foto!</div>')+'<div class="fl-photo-actions"><button data-photo="camera">📷 Kamera</button></div>';
    }
    page.querySelectorAll('[data-photo]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.photo==='capture')captureCityPhoto();else renderPhotoApp(b.dataset.photo==='feed'?'feed':'camera');}));
    page.querySelectorAll('[data-post]').forEach(b=>b.addEventListener('click',()=>{const p=flPhotos.find(x=>x.id===Number(b.dataset.post));if(!p)return;const input=page.querySelector('[data-caption="'+p.id+'"]');p.caption=input?.value?.trim()||'Ein neuer Frankfurt-Moment';p.posted=true;savePhotos();renderPhotoApp('feed');if(status)status.textContent='IM MAINFEED VERÖFFENTLICHT';}));
  }
  const originalShowPhoneHome=showPhoneHome;
  showPhoneHome=function(){
    originalShowPhoneHome();
    const grid=phonePanel?.querySelector('#phoneApps');if(!grid||grid.querySelector('[data-app="mainfeed"]'))return;
    const add=(id,emoji,label)=>{const b=document.createElement('button');b.className='phone-app';b.dataset.app=id;b.innerHTML='<b>'+emoji+'</b><span>'+label+'</span>';b.addEventListener('click',()=>openPhoneApp(id));grid.appendChild(b);};
    add('mainfeed','✦','MainFeed');
  };
  const originalOpenPhoneApp=openPhoneApp;
  openPhoneApp=function(app){
    if(app==='camera'||app==='mainfeed'){
      if(!phonePanel)return;
      phonePage=app;phonePanel.querySelector('#phoneApps')?.classList.add('hidden');
      phonePanel.querySelector('#phonePage')?.classList.remove('hidden');
      renderPhotoApp(app);return;
    }
    return originalOpenPhoneApp(app);
  };
  const originalToggleVehicle=toggleVehicle;
  toggleVehicle=function(){
    const entering=!driving&&!!jobCar;
    originalToggleVehicle();
    if(entering&&driving)showVehicleEntryCinema();
  };
  function showVehicleEntryCinema(){
    let overlay=viewport.querySelector('#vehicleEntryCinema');
    if(!overlay){overlay=document.createElement('div');overlay.id='vehicleEntryCinema';overlay.innerHTML='<div class="fl-cinema-bars top"></div><div class="fl-cinema-title"><small>FRANKFURT LIFE · FAHRZEUGSZENE</small><b>FAHRZEUG ÜBERNOMMEN</b><span>Motor starten · Stadt erkunden</span></div><div class="fl-cinema-bars bottom"></div>';viewport.appendChild(overlay);}
    overlay.classList.remove('hidden');clearTimeout(overlay._hideTimer);overlay._hideTimer=setTimeout(()=>overlay.classList.add('hidden'),1500);
  }
  if(phonePanel)showPhoneHome();
})();
