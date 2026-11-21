import * as THREE from './node_modules/three/build/three.module.js';

const startButton=document.querySelector('#startGame');
const placeholder=document.querySelector('.game-placeholder');
const viewport=document.querySelector('#gameViewport');
const status=document.querySelector('#gameStatus');
const coords=document.querySelector('#coords');
const qualitySelect=document.querySelector('#qualitySelect');
const fpsSelect=document.querySelector('#fpsSelect');
const mouseSelect=document.querySelector('#mouseSelect');
const fovSelect=document.querySelector('#fovSelect');
let maxFps=60,lastFrame=0;
const lowEndDevice=(navigator.hardwareConcurrency||4)<=2||(navigator.deviceMemory||8)<=4;
let performanceFrame=0;
const qualitySettings={
 ultra:{pixelRatio:.48,shadows:false,fog:88,exposure:.92,ambient:1.45,label:'SPARMODUS'},
 low:{pixelRatio:.65,shadows:false,fog:125,exposure:.82,ambient:1.65,label:'NIEDRIG'},
 medium:{pixelRatio:.9,shadows:false,fog:165,exposure:1,ambient:2,label:'MITTEL'},
 high:{pixelRatio:1.25,shadows:true,fog:215,exposure:1.12,ambient:2.15,label:'HOCH'}
};
let sunLight=null,hemiLight=null,flashlight=null,flashlightTarget=null,flashlightOn=false;
function applyQuality(){
 if(!renderer||!scene)return;
 const mode=qualitySelect?.value||'medium',q=qualitySettings[mode]||qualitySettings.medium;
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
qualitySelect?.addEventListener('change',()=>{localStorage.setItem('flQuality',qualitySelect.value);applyQuality();});
fpsSelect?.addEventListener('change',()=>{maxFps=fpsSelect.value==='unlimited'?0:Number(fpsSelect.value);localStorage.setItem('flFps',fpsSelect.value);});
mouseSelect?.addEventListener('change',()=>{mouseSensitivity=Number(mouseSelect.value)||1;});
fovSelect?.addEventListener('change',()=>{cameraFov=Number(fovSelect.value)||68;if(camera){camera.fov=cameraFov;camera.updateProjectionMatrix();}});
const cameraSelect=document.querySelector('#cameraSelect');
cameraSelect?.addEventListener('change',()=>{cameraMode=cameraSelect.value||'follow';status.textContent='KAMERA: '+({follow:'VERFOLGER',close:'NAH',hood:'MOTORHAUBE'}[cameraMode]||'VERFOLGER');});
let renderer,scene,camera,raf,started=false,yaw=0,pitch=0,locked=false;
const keys={};
const keyboardKeys={};
const pedestrians=[];
const policeCars=[];
const trafficCars=[];
const streetLights=[];
const shops=[];
const inventory={Kaffee:0,Snack:0,Stadtplan:0,Brot:0,Brezel:0,Croissant:0,Kuchen:0};
let miniMapCanvas=null,miniMapCtx=null,tuningLevel=0,paintLevel=0,mouseSensitivity=1,cameraFov=68;
let appetite=65;
let invertCameraY=localStorage.getItem('flInvertY')==='on';
let cameraMode='follow',cutscene=null,cutsceneOverlay=null,cutsceneElapsed=0;
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
 {id:'van',name:'Cargo Van',model:'van',color:0xe6e8e8,price:2400,desc:'Viel Platz für Transportjobs.'}
];
let dealerPanel=null,dealership={x:-28,z:82,name:'Frankfurt Motors'};
/* 0.2.9 gameplay systems */
let flFuel=100,flGameHour=12,flWeather='Klar',flWeatherTimer=0,flSaveTimer=0,flHomeOwned=false,flHomeFurniture=0,flOutfit=0,flTransitTrips=0,flDailyJobs=0,flDailyRides=0,flDailyClaimed=false,flDailyDate='';
let flWeatherLabel=null,flFuelLabel=null,flLightingStep=-1,flStatusTimer=0;
function flSaveGame(showMessage=false){try{localStorage.setItem('frankfurtLifeSave',JSON.stringify({version:1,money:careerMoney,jobs:completedJobs,position:camera?{x:camera.position.x,z:camera.position.z}:null,ownedCars,inventory,appetite,tuningLevel,paintLevel,fuel:flFuel,hour:flGameHour,weather:flWeather,homeOwned:flHomeOwned,homeFurniture:flHomeFurniture,outfit:flOutfit,transitTrips:flTransitTrips,dailyJobs:flDailyJobs,dailyRides:flDailyRides,dailyClaimed:flDailyClaimed,dailyDate:flDailyDate,vehicleDamage:damageLevel}));if(showMessage&&status)status.textContent='SPIELSTAND GESPEICHERT';}catch(_){if(showMessage&&status)status.textContent='SPEICHERN NICHT VERFÜGBAR';}}
function flLoadGame(){try{const d=JSON.parse(localStorage.getItem('frankfurtLifeSave')||'null');if(!d||d.version!==1)return;careerMoney=Math.max(0,Number(d.money)||0);completedJobs=Math.max(0,Number(d.jobs)||0);if(Array.isArray(d.ownedCars))ownedCars.splice(0,ownedCars.length,...d.ownedCars.filter(id=>dealerCars.some(c=>c.id===id)));if(d.inventory&&typeof d.inventory==='object')Object.assign(inventory,d.inventory);appetite=Math.max(0,Math.min(100,Number(d.appetite)||65));tuningLevel=Math.max(0,Number(d.tuningLevel)||0);paintLevel=Math.max(0,Number(d.paintLevel)||0);flFuel=Math.max(0,Math.min(100,Number(d.fuel)||100));flGameHour=Number.isFinite(d.hour)?d.hour:12;flWeather=['Klar','Bewölkt','Regen','Nebel'].includes(d.weather)?d.weather:'Klar';flHomeOwned=!!d.homeOwned;flHomeFurniture=Math.max(0,Number(d.homeFurniture)||0);flOutfit=Math.max(0,Number(d.outfit)||0);flTransitTrips=Math.max(0,Number(d.transitTrips)||0);flDailyJobs=Math.max(0,Number(d.dailyJobs)||0);flDailyRides=Math.max(0,Number(d.dailyRides)||0);flDailyClaimed=!!d.dailyClaimed;flDailyDate=typeof d.dailyDate==='string'?d.dailyDate:'';flSavedDamage=Math.max(0,Math.min(4,Number(d.vehicleDamage)||0));flCheckDailyDate();if(d.position&&camera)camera.position.set(Number(d.position.x)||0,2.1,Number(d.position.z)||14);if(careerHud)careerHud.innerHTML='KONTO: '+careerMoney.toLocaleString('de-DE')+' €<br>AUFTRÄGE: '+completedJobs+'<br>★ RUF: '+Math.min(5,1+Math.floor(completedJobs/2))+'/5';}catch(_){}}

function flCheckDailyDate(){const today=new Date().toLocaleDateString('en-CA');if(flDailyDate!==today){flDailyDate=today;flDailyJobs=0;flDailyRides=0;flDailyClaimed=false;}}
function flClaimDaily(){flCheckDailyDate();if(flDailyClaimed){status.textContent='TAGESBONUS BEREITS ABGEHOLT';return;}if(flDailyJobs<1||flDailyRides<1){status.textContent='ERLEDIGE BEIDE TAGESZIELE ZUERST';openPhoneApp('daily');return;}flDailyClaimed=true;careerMoney+=250;if(careerHud)careerHud.innerHTML='KONTO: '+careerMoney.toLocaleString('de-DE')+' €<br>AUFTRÄGE: '+completedJobs;flSaveGame();status.textContent='TAGESBONUS · +250 €';openPhoneApp('daily');}

function flBuildStatus(){flWeatherLabel=document.createElement('div');flWeatherLabel.style.cssText='position:absolute;left:16px;top:16px;z-index:8;padding:7px 10px;border:1px solid #ffffff35;border-radius:8px;background:#101b2ddd;color:#eaf6ff;font:700 11px system-ui;pointer-events:none';viewport.appendChild(flWeatherLabel);flFuelLabel=document.createElement('div');flFuelLabel.style.cssText='position:absolute;left:16px;top:52px;z-index:8;padding:7px 10px;border:1px solid #ffffff35;border-radius:8px;background:#101b2ddd;color:#eaf6ff;font:700 11px system-ui;pointer-events:none';viewport.appendChild(flFuelLabel);flUpdateStatus();}
function flUpdateStatus(){if(flWeatherLabel)flWeatherLabel.textContent='🕒 '+String(Math.floor(flGameHour)).padStart(2,'0')+':'+String(Math.floor(flGameHour%1*60)).padStart(2,'0')+' · '+flWeather;if(flFuelLabel)flFuelLabel.textContent='⛽ TANK: '+Math.round(flFuel)+'%';}
function flApplyWeather(){if(!scene||!sunLight||!hemiLight)return;const night=flGameHour<6||flGameHour>20,daylight=Math.max(.18,Math.sin((flGameHour-6)/14*Math.PI)),factor=flWeather==='Regen'?.62:flWeather==='Nebel'?.72:flWeather==='Bewölkt'?.82:1;sunLight.intensity=(night?.22:.55+daylight*1.25)*factor;sunLight.color.setHex(night?0x9bb8e8:flWeather==='Regen'?0xaabbd0:0xffe0b4);hemiLight.intensity=(night?.65:1.1+daylight*.85)*factor;const color=night?0x17283d:flWeather==='Nebel'?0xaab6bc:flWeather==='Regen'?0x71899a:flWeather==='Bewölkt'?0x91a2ad:0x91b1c8;scene.background.setHex(color);if(scene.fog)scene.fog.color.setHex(color);}
function flBuyHome(){if(flHomeOwned){status.textContent='DU HAST BEREITS EINE WOHNUNG';return;}if(careerMoney<800){status.textContent='DU BENÖTIGST 800 € FÜR DIE ERSTE MIETE';return;}careerMoney-=800;flHomeOwned=true;flSaveGame();if(careerHud)careerHud.innerHTML='KONTO: '+careerMoney.toLocaleString('de-DE')+' €<br>AUFTRÄGE: '+completedJobs;status.textContent='WOHNUNG GEMIETET · 800 € KAUTION';openPhoneApp('housing');}
function flGoHome(){if(!flHomeOwned){flBuyHome();return;}if(driving){status.textContent='STEIGE ZUERST AUS';return;}camera.position.set(-26.5,2.1,-96);status.textContent='ZU HAUSE · WESTEND-WOHNUNG';phonePanel?.classList.add('hidden');}
function flBuyFurniture(){if(!flHomeOwned||careerMoney<180){status.textContent='MIETE ZUERST EINE WOHNUNG ODER SAMMLE 180 €';return;}careerMoney-=180;flHomeFurniture++;flSaveGame();status.textContent='MÖBEL GEKAUFT · AUSSTATTUNG '+flHomeFurniture;openPhoneApp('housing');}
function flChangeOutfit(){flOutfit=(flOutfit+1)%6;const person=pedestrians[0];if(person&&person.children[0]?.material?.color)person.children[0].material.color.setHex([0x345b80,0x8c5747,0x526c54,0x454b59,0xb18b4d,0x6c557f][flOutfit]);status.textContent='OUTFIT GEWECHSELT · STIL '+(flOutfit+1);flSaveGame();openPhoneApp('customize');}
function flTransitRide(){if(driving){status.textContent='STEIGE ZUERST AUS, UM ÖPNV ZU NUTZEN';return;}const stops=[{x:13,z:-72,name:'Innenstadt'},{x:-26,z:-96,name:'Wohnviertel'},{x:145,z:-145,name:'Ostend'},{x:-145,z:165,name:'Südquartier'}],stop=stops[flTransitTrips%stops.length];camera.position.set(stop.x,2.1,stop.z);flTransitTrips++;flCheckDailyDate();flDailyRides++;status.textContent='ÖPNV · ANGEKOMMEN: '+stop.name;flSaveGame();openPhoneApp('transit');}
function flUpdateSystems(dt){flGameHour=(flGameHour+dt*.075)%24;flWeatherTimer+=dt;flSaveTimer+=dt;flStatusTimer+=dt;if(flWeatherTimer>150){flWeatherTimer=0;const choices=['Klar','Bewölkt','Regen','Nebel'];flWeather=choices[(choices.indexOf(flWeather)+1+Math.floor(Math.random()*3))%choices.length];flApplyWeather();}if(driving&&Math.abs(carSpeed)>.02)flFuel=Math.max(0,flFuel-dt*.012*Math.max(1,Math.abs(carSpeed)*8));if(driving&&flFuel<=0){carSpeed=0;status.textContent='TANK LEER · FAHRE ZUR TANKSTELLE';}if(flSaveTimer>20){flSaveTimer=0;flSaveGame();}const lightStep=Math.floor(flGameHour*4);if(lightStep!==flLightingStep){flLightingStep=lightStep;flApplyWeather();}if(flStatusTimer>.25){flStatusTimer=0;flUpdateStatus();}}

function buildPhone(){
 phonePanel=document.createElement('section');phonePanel.id='phonePanel';phonePanel.className='phone-overlay hidden';
 phonePanel.innerHTML='<div class="phone-device"><div class="phone-notch"></div><div class="phone-status"><span>● FRANKFURT MOBILE</span><span>5G ▰ 100%</span></div><div class="phone-clock" id="phoneClock">12:00</div><div class="phone-date">SAMSTAG · FRANKFURT AM MAIN</div><div class="phone-appgrid" id="phoneApps"></div><div class="phone-page hidden" id="phonePage"></div><div class="phone-dock"><button data-open="map">⌖<small>Karte</small></button><button data-open="jobs">▣<small>Jobs</small></button><button data-open="garage">🚘<small>Garage</small></button><button data-open="bank">€<small>Bank</small></button></div><button class="phone-home" id="phoneHome" aria-label="Startbildschirm"></button><button class="phone-exit" id="phoneExit">Schließen ×</button></div>';
 viewport.appendChild(phonePanel);
 phonePanel.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>openPhoneApp(b.dataset.open)));
 phonePanel.querySelector('#phoneHome').addEventListener('click',()=>showPhoneHome());
 phonePanel.querySelector('#phoneExit').addEventListener('click',()=>phonePanel.classList.add('hidden'));
 showPhoneHome();
}
function showPhoneHome(){
 phonePage='home';const grid=phonePanel.querySelector('#phoneApps'),page=phonePanel.querySelector('#phonePage');
 page.classList.add('hidden');grid.classList.remove('hidden');
 const apps=[['map','🗺️','Karte'],['jobs','💼','Missionen'],['bank','🏦','Bank'],['garage','🚘','Garage'],['housing','🏠','Wohnen'],['transit','🚋','ÖPNV'],['news','📰','News'],['camera','📷','Kamera'],['services','🛠️','Service'],['settings','⚙️','Einstellungen'],['inventory','🎒','Inventar'],['customize','👕','Outfit'],['daily','🎯','Tagesziele'],['save','💾','Speichern'],['help','❔','Hilfe'],['dealer','🚗','Autohändler']];
 grid.innerHTML=apps.map(a=>'<button class="phone-app" data-app="'+a[0]+'"><b>'+a[1]+'</b><span>'+a[2]+'</span></button>').join('');
 grid.querySelectorAll('[data-app]').forEach(b=>b.addEventListener('click',()=>openPhoneApp(b.dataset.app)));
}
function openPhoneApp(app){
 if(!phonePanel)return;
 phonePage=app;const grid=phonePanel.querySelector('#phoneApps'),page=phonePanel.querySelector('#phonePage');
 grid.classList.add('hidden');page.classList.remove('hidden');
 const pos=camera?Math.round(camera.position.x)+' / '+Math.round(camera.position.z):'–';
 const pages={
 map:'<div class="phone-page-head">Frankfurt · Stadtkarte</div><div class="phone-map-tools"><span>● GPS LIVE</span><button data-action="recenter">Zentrieren</button></div><div class="phone-map phone-map-large"><canvas id="phoneMapCanvas" width="720" height="1040"></canvas></div><div class="phone-map-legend"><span>● Du</span><span>● Geschäfte</span><span>■ Autohaus</span><span>● Missionsziel</span></div><p>GPS-Position: '+pos+' · Stadtgebiet 360 × 520 m</p>',
 jobs:'<div class="phone-page-head">Missionen</div><div class="phone-stat">Aktive Aufträge <b>'+(jobActive?'1':'0')+'</b></div><div class="phone-stat">Erledigt <b>'+completedJobs+'</b></div><p>Öffne die Jobzentrale und wähle deinen nächsten Auftrag.</p><button data-action="jobs">Jobzentrale öffnen</button>',
 bank:'<div class="phone-page-head">Frankfurt Bank</div><div class="phone-balance">'+careerMoney.toLocaleString('de-DE')+' €</div><p>Dein Kontostand</p><div class="phone-stat">Abgeschlossene Jobs <b>'+completedJobs+'</b></div>',
 garage:'<div class="phone-page-head">Meine Garage</div><p>Eigene Fahrzeuge: '+ownedCars.length+'</p>'+ownedCars.map(id=>'<div class="phone-stat">'+(dealerCars.find(v=>v.id===id)?.name||id)+' <b>✓</b></div>').join('')+'<button data-action="dealer">Autohändler öffnen</button>',
 dealer:'<div class="phone-page-head">Frankfurt Motors</div><p>Fahrzeuge ansehen und kaufen – besuche auch den Showroom in der Stadt.</p><button data-action="dealer">Showroom öffnen</button>',
 inventory:'<div class="phone-page-head">Inventar & Essen</div><div class="phone-stat">Sättigung <b>'+appetite+'%</b></div>'+['Brot','Brezel','Croissant','Kuchen','Kaffee','Snack','Pizza','Pasta','Limo','Burger-Menü','Schnitzel','Salat','Cola'].map(name=>'<div class="phone-stat"><span>'+name+' · '+(inventory[name]||0)+'</span><button data-eat="'+name+'">Verzehren</button></div>').join(''),
 housing:'<div class="phone-page-head">Meine Wohnung</div><div class="phone-stat">Status <b>'+(flHomeOwned?'Gemietet':'Noch keine Wohnung')+'</b></div><div class="phone-stat">Möbel <b>'+flHomeFurniture+'</b></div><p>Miete deine erste Wohnung im Westend und ergänze nach und nach Möbel.</p><button data-action="homebuy">'+(flHomeOwned?'Wohnung gemietet':'Wohnung mieten · 800 €')+'</button><button data-action="gohome">Nach Hause fahren</button><button data-action="furniture">Möbel kaufen · 180 €</button>',
 transit:'<div class="phone-page-head">Frankfurt ÖPNV</div><div class="phone-stat">Linie 1 <b>Innenstadt</b></div><div class="phone-stat">Linie 2 <b>Westend – Ostend</b></div><div class="phone-stat">Fahrten <b>'+flTransitTrips+'</b></div><p>Wähle eine Haltestelle und fahre zum nächsten Stadtteil.</p><button data-action="transitride">Fahrt starten</button>',
 news:'<div class="phone-page-head">Stadt-News</div><div class="phone-stat">Neue Jobs in der Innenstadt</div><div class="phone-stat">Frankfurt Motors eröffnet</div><p>Bleib auf dem Laufenden.</p>',
 camera:'<div class="phone-page-head">Kamera</div><p>Fotomodus – richte die Kamera in der Stadt aus und mach einen Screenshot mit Windows.</p>',
 services:'<div class="phone-page-head">Stadtservice</div><div class="phone-stat">Mängel melden <b>Online</b></div><div class="phone-stat">Fundbüro <b>Offen</b></div>',
 settings:'<div class="phone-page-head">Einstellungen</div><div class="phone-setting"><label for="phoneQuality">Grafikqualität</label><select id="phoneQuality"><option value="ultra">Sparmodus (alte Laptops)</option><option value="low">Niedrig</option><option value="medium">Mittel</option><option value="high">Hoch</option></select></div><div class="phone-setting"><label for="phoneFps">Bildrate</label><select id="phoneFps"><option value="30">30 FPS</option><option value="60">60 FPS</option><option value="unlimited">Unbegrenzt</option></select></div><div class="phone-setting"><label for="phoneMouse">Maus-Empfindlichkeit</label><select id="phoneMouse"><option value="0.65">Langsam</option><option value="1">Normal</option><option value="1.5">Schnell</option></select></div><div class="phone-setting"><label for="phoneFov">Sichtfeld</label><select id="phoneFov"><option value="60">60°</option><option value="68">68°</option><option value="78">78°</option><option value="88">88°</option></select></div><div class="phone-setting"><label for="phoneCamera">Kameraperspektive</label><select id="phoneCamera"><option value="follow">Verfolger</option><option value="close">Nah</option><option value="hood">Motorhaube</option></select></div><div class="phone-setting"><label for="phoneMapVisible">GPS-Minimap</label><select id="phoneMapVisible"><option value="on">Anzeigen</option><option value="off">Ausblenden</option></select></div><div class="phone-setting"><label for="phoneBrightness">Bildschirmhelligkeit</label><select id="phoneBrightness"><option value="0.8">Dunkler</option><option value="1" selected>Normal</option><option value="1.15">Hell</option><option value="1.3">Sehr hell</option></select></div><div class="phone-setting"><label for="phoneInvertY">Kamera Y-Achse</label><select id="phoneInvertY"><option value="off">Normal</option><option value="on">Invertiert</option></select></div><div class="phone-setting"><label for="phoneMapSize">Minimap-Größe</label><select id="phoneMapSize"><option value="small">Klein</option><option value="medium">Mittel</option><option value="large">Groß</option></select></div><div class="phone-setting"><label for="phoneCoordsVisible">Koordinaten anzeigen</label><select id="phoneCoordsVisible"><option value="on">Anzeigen</option><option value="off">Ausblenden</option></select></div><p>Die Änderungen werden direkt übernommen und gespeichert.</p>',
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
 page.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>{const action=b.dataset.action;if(action==='home')showPhoneHome();if(action==='jobs'){phonePanel.classList.add('hidden');toggleJobs();}if(action==='dealer'){phonePanel.classList.add('hidden');openDealer();}if(action==='homebuy')flBuyHome();if(action==='gohome')flGoHome();if(action==='furniture')flBuyFurniture();if(action==='transitride')flTransitRide();if(action==='outfit')flChangeOutfit();if(action==='dailyclaim')flClaimDaily();if(action==='save'){flSaveGame(true);openPhoneApp('save');}}));
}
function togglePhone(){
 if(!started||!phonePanel)return;
 phonePanel.classList.toggle('hidden');
 if(!phonePanel.classList.contains('hidden')){showPhoneHome();document.exitPointerLock?.();}
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
   if(!owned){careerMoney-=car.price;ownedCars.push(car.id);if(careerHud)careerHud.innerHTML='KONTO: '+careerMoney.toLocaleString('de-DE')+' €<br>AUFTRÄGE: '+completedJobs+'<br>★ RUF: '+Math.min(5,1+Math.floor(completedJobs/2))+'/5';msg.textContent=car.name+' gekauft! Es steht jetzt in deiner Garage.';button.querySelector('span').textContent=car.desc+' · IN GARAGE';}
   else{if(jobCar)scene.remove(jobCar);jobCar=makeCar(camera.position.x+3,camera.position.z-5,car.color,false,car.model);jobCar.rotation.y=yaw;damageLevel=flSavedDamage;applyCarDamage(jobCar,damageLevel);if(damageLevel)refreshDamageHud();msg.textContent=car.name+' bereitgestellt. Gehe hin und drücke F.';}
  });list.appendChild(button);
 }
 dealerPanel.classList.remove('hidden');document.exitPointerLock?.();
}


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
 const products=name.startsWith('TANKSTELLE')?[{name:'Benzin 25%',price:90,kind:'fuel'},{name:'Benzin 50%',price:170,kind:'fuel'},{name:'Benzin 100%',price:300,kind:'fuel'}]:name.startsWith('BÄCKEREI')?[{name:'Brot',price:4},{name:'Brezel',price:3},{name:'Croissant',price:4},{name:'Kuchen',price:5},{name:'Kaffee',price:4}]:name.startsWith('PIZZERIA')?[{name:'Pizza',price:9},{name:'Pasta',price:8},{name:'Limo',price:3}]:name.startsWith('RESTAURANT')?[{name:'Burger-Menü',price:12},{name:'Schnitzel',price:16},{name:'Salat',price:9},{name:'Cola',price:3},{name:'Kaffee',price:4}]:name==='TUNINGWERK'?[{name:'Motor-Upgrade',price:850,kind:'tuning',id:'engine'},{name:'Sonderlackierung',price:280,kind:'tuning',id:'paint'},{name:'Sportfelgen',price:420,kind:'tuning',id:'wheels'},{name:'Unfallschäden reparieren',price:Math.max(120,damageLevel*260),kind:'tuning',id:'repair'}]:[{name:'Kaffee',price:4},{name:'Snack',price:3},{name:'Stadtplan',price:8}];
 shops.push({name,subtitle,x,z,side,products});
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
    const head=new THREE.Mesh(new THREE.BoxGeometry(.36,.13,.08),light);head.position.set(side*W*.34,.78,L*.505);car.add(head);headlights.push(head);
    const rearLight=new THREE.Mesh(new THREE.BoxGeometry(.32,.14,.08),tail);rearLight.position.set(side*W*.34,.78,-L*.505);car.add(rearLight);
  }
  const grille=new THREE.Mesh(new THREE.BoxGeometry(W*.42,.18,.06),black);grille.position.set(0,.64,L*.51);car.add(grille);
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
  const headlights=[];
  const frontBumper=new THREE.Mesh(new THREE.BoxGeometry(W*1.02,.16,.18),black);frontBumper.position.set(0,.42,L*.52);car.add(frontBumper);
  const rearBumper=new THREE.Mesh(new THREE.BoxGeometry(W*1.02,.16,.18),black);rearBumper.position.set(0,.42,-L*.52);car.add(rearBumper);
  const hoodDent=new THREE.Mesh(new THREE.SphereGeometry(.55,12,8),new THREE.MeshStandardMaterial({color:0x20252b,roughness:.95}));hoodDent.scale.set(1,.08,.55);hoodDent.position.set(0,.94,L*.32);hoodDent.visible=false;car.add(hoodDent);
  const smoke=new THREE.Mesh(new THREE.SphereGeometry(.32,8,6),new THREE.MeshBasicMaterial({color:0x5d6268,transparent:true,opacity:.5}));smoke.position.set(0,1.8,-L*.28);smoke.visible=false;car.add(smoke);
  car.userData.damageParts={paint,bumper,crack,frontBumper,rearBumper,hoodDent,smoke,scratches,sideDents,headlights,originalColor:paint.color.getHex()};
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
let damageLevel=0,damageHud=null,damageFlash=0,cameraLookOffset=0,damageCooldown=0,flSavedDamage=0;
const emergencyVehicles=[];
const breakableProps=[];let lookDrag=false,lastPointerX=0,lastPointerY=0;
function buildCutsceneUI(){
 cutsceneOverlay=document.createElement('div');cutsceneOverlay.id='cutsceneOverlay';cutsceneOverlay.className='cutscene-overlay hidden';
 cutsceneOverlay.innerHTML='<div class="cinema-top"></div><div class="cinema-bottom"><div class="cinema-kicker">FRANKFURT LIFE · AUFTRAG</div><div id="cinemaTitle">EIN NEUER TAG IN FRANKFURT</div><p id="cinemaCaption">Dein nächster Auftrag beginnt.</p></div><button id="skipCutscene">ÜBERSPRINGEN ⏭</button><div class="cinema-count" id="cinemaCount">SZENE 1 / 3</div>';
 viewport.appendChild(cutsceneOverlay);cutsceneOverlay.querySelector('#skipCutscene').addEventListener('click',finishCutscene);
}
function startCutscene(jobName){if(!cutsceneOverlay||!camera||!jobCar)return;cutscene={target:jobCar.position.clone(),jobName};cutsceneElapsed=0;cutsceneOverlay.classList.remove('hidden');document.exitPointerLock?.();cutsceneOverlay.querySelector('#cinemaTitle').textContent='EIN NEUER AUFTRAG';cutsceneOverlay.querySelector('#cinemaCaption').textContent='Frankfurt schläft nie. Heute bist du unterwegs: '+jobName+'.';cutsceneOverlay.querySelector('#cinemaCount').textContent='SZENE 1 / 3 · STADTÜBERBLICK';}
function finishCutscene(){if(!cutscene)return;cutscene=null;cutsceneOverlay?.classList.add('hidden');if(jobCar){camera.position.set(jobCar.position.x+4,3.1,jobCar.position.z+7);yaw=jobCar.rotation.y-Math.PI;}status.textContent='MISSION BEREIT · STEIGE MIT F INS AUTO';}
function updateCutscene(dt){if(!cutscene||!camera)return;cutsceneElapsed+=dt;const t=cutsceneElapsed,car=cutscene.target;if(t<1.5){const k=t/1.5;camera.position.set(car.x+22*(1-k)+5*k,13*(1-k)+4*k,car.z+22*(1-k)+10*k);camera.lookAt(car.x,1,car.z);cutsceneOverlay.querySelector('#cinemaCount').textContent='SZENE 1 / 3 · STADTÜBERBLICK';}else if(t<3){const k=(t-1.5)/1.5;camera.position.set(car.x+5,4,car.z+10-5*k);camera.lookAt(car.x,1,car.z);cutsceneOverlay.querySelector('#cinemaCount').textContent='SZENE 2 / 3 · DEIN FAHRZEUG';cutsceneOverlay.querySelector('#cinemaCaption').textContent='Dein Fahrzeug steht bereit. Mach dich auf den Weg.';}else if(t<4.3){camera.position.set(car.x+2,2.4,car.z+5);camera.lookAt(car.x,1,car.z);cutsceneOverlay.querySelector('#cinemaCount').textContent='SZENE 3 / 3 · AUF DIE STRASSE';}else finishCutscene();}
function buildInGameJobs(){
 jobPanel=document.createElement('div');jobPanel.id='inGameJobs';jobPanel.className='ingame-jobs hidden';
 jobPanel.innerHTML='<div class="ingame-jobs-head"><b>FRANKFURT LIFE / JOBZENTRALE</b><button id="closeJobs" aria-label="Schließen">×</button></div><h3>Wähle deinen Beruf</h3><p class="ingame-jobs-hint">Dein Auftrag und das passende Dienstfahrzeug starten direkt in der 3D-Stadt.</p><div id="ingameJobChoices"></div><div id="ingameJobDetail">Wähle einen Job aus.</div><button id="startJob" class="ingame-start" disabled>AUFTRAG ANNEHMEN</button><small>J oder ESC · Menü schließen</small>';
 viewport.appendChild(jobPanel);
 buildCutsceneUI();
 careerHud=document.createElement('div');careerHud.id='careerHud';careerHud.style.cssText='position:absolute;top:14px;right:14px;z-index:8;padding:10px 14px;border:1px solid #ffffff30;border-radius:10px;background:#101b2ddd;color:#fff;font:700 13px/1.6 system-ui;pointer-events:none;';careerHud.innerHTML='KONTO: 0 €<br>AUFTRÄGE: 0<br>★ RUF: 1/5';viewport.appendChild(careerHud);
 missionHud=document.createElement('div');missionHud.id='missionHud';missionHud.className='mission-hud hidden';viewport.appendChild(missionHud);
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
  jobCar.rotation.y=yaw;damageLevel=flSavedDamage;applyCarDamage(jobCar,damageLevel);if(damageLevel)refreshDamageHud();
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
 const c=ctx;c.clearRect(0,0,w,h);c.fillStyle='#314b48';c.fillRect(0,0,w,h);
 const px=x=>(x+180)/360*w,py=z=>(z+300)/520*h;
 // Blocks and local streets across the expanded playable district.
 c.fillStyle='#3b5650';
 for(let x=-165;x<180;x+=24)for(let z=-286;z<220;z+=30){c.fillRect(px(x+2),py(z+2),Math.max(2,px(x+21)-px(x+2)),Math.max(2,py(z+27)-py(z+2)));}
 c.strokeStyle='#9da9a0';c.lineCap='square';c.lineWidth=large?12:7;
 for(const x of [-160,-130,-82,-48,0,48,82,130,160]){c.beginPath();c.moveTo(px(x),0);c.lineTo(px(x),h);c.stroke();}
 for(let z=-285;z<=205;z+=38){c.beginPath();c.moveTo(0,py(z));c.lineTo(w,py(z));c.stroke();}
 c.strokeStyle='#d8d0ad';c.lineWidth=large?2.5:1.5;c.setLineDash([8,7]);c.beginPath();c.moveTo(px(0),0);c.lineTo(px(0),h);c.stroke();c.setLineDash([]);
 // Main river ribbon and district labels.
 c.fillStyle='#347f9c';c.fillRect(0,py(108),w,Math.max(7,py(126)-py(108)));
 c.fillStyle='#d9e6dc';c.font='bold '+(large?15:11)+'px Arial';
 c.fillText('MAIN',px(8),py(119));
 c.fillStyle='#e4d8ad';c.font='bold '+(large?12:9)+'px Arial';
 c.fillText('INNENSTADT',px(-165),py(-90));c.fillText('WOHNVIERTEL',px(95),py(-210));c.fillText('WESTEND',px(-160),py(35));c.fillText('OSTEND',px(105),py(35));c.fillText('SÜDQUARTIER',px(-45),py(175));
 // Shops and major destinations.
 c.fillStyle='#f1bd59';
 for(const shop of shops){c.beginPath();c.arc(px(shop.x),py(shop.z),large?4:2.5,0,Math.PI*2);c.fill();}
 c.fillStyle='#c8a4f5';c.fillRect(px(dealership.x)-4,py(dealership.z)-4,8,8);
 if(jobDestination){c.fillStyle='#ffd36b';c.beginPath();c.arc(px(jobDestination.x),py(jobDestination.z),large?6:4,0,Math.PI*2);c.fill();}
 const player=driving&&jobCar?jobCar.position:camera?.position;
 if(player){c.save();c.translate(px(player.x),py(player.z));c.rotate(-yaw);c.fillStyle='#65e6ff';c.strokeStyle='#081522';c.lineWidth=2;c.beginPath();c.moveTo(0,-(large?10:7));c.lineTo(large?7:5,large?8:5);c.lineTo(0,large?5:3);c.lineTo(large?-7:-5,large?8:5);c.closePath();c.fill();c.stroke();c.restore();}
}

function drawMiniMap(){
 if(!miniMapCtx||!camera)return;
 drawCityMap(miniMapCtx,220,220,false);
 const label=document.querySelector('#miniMapCoords');if(label)label.textContent=Math.round(camera.position.x)+' / '+Math.round(camera.position.z);
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
   careerMoney-=item.price;
   if(['Brot','Brezel','Croissant','Kuchen','Kaffee','Snack','Pizza','Pasta','Limo','Burger-Menü','Schnitzel','Salat','Cola'].includes(item.name)){inventory[item.name]=(inventory[item.name]||0)+1;message.textContent=item.name+' gekauft · im Inventar: '+inventory[item.name];}
   else if(item.kind==='fuel'){flFuel=Math.min(100,flFuel+(item.name.includes('25')?25:item.name.includes('50')?50:100));message.textContent='Getankt · Tankfüllung '+Math.round(flFuel)+'%';flUpdateStatus();}
   else if(item.kind==='tuning'){
    if(!jobCar){message.textContent='Wähle zuerst ein Auto über die Garage oder einen Auftrag.';careerMoney+=item.price;return;}
    if(item.id==='repair'){if(damageLevel===0){message.textContent='Dein Fahrzeug ist bereits unbeschädigt.';careerMoney+=item.price;}else{damageLevel=0;applyCarDamage(jobCar,0);flSavedDamage=0;message.textContent='Reparatur abgeschlossen · Fahrzeugzustand 100 %';flSaveGame();}}else if(item.id==='engine'){tuningLevel=Math.min(3,tuningLevel+1);message.textContent='Motor-Upgrade eingebaut · Leistungsstufe '+tuningLevel;}
    else if(item.id==='paint'){paintLevel++;const colors=[0x1687d9,0x19a875,0xd4a62a,0x9b58bd,0xb51e2b];jobCar.userData.damageParts?.paint.color.setHex(colors[paintLevel%colors.length]);message.textContent='Neue Lackierung montiert!';}
    else{jobCar.traverse(o=>{if(o.isMesh&&o.geometry?.type==='CylinderGeometry'&&o.position.y<.6)o.material=new THREE.MeshStandardMaterial({color:0x9da8b3,metalness:.8,roughness:.2});});message.textContent='Sportfelgen montiert!';}
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

function makeCity(){
  scene=new THREE.Scene();scene.background=new THREE.Color(0x91b1c8);scene.fog=new THREE.Fog(0x91b1c8,115,390);
  camera=new THREE.PerspectiveCamera(cameraFov,viewport.clientWidth/viewport.clientHeight,.1,620);camera.position.set(0,2.1,14);
  flashlight=new THREE.SpotLight(0xddeeff,0,48,Math.PI/7,.42,1.35);
  flashlight.position.set(0,0,0);flashlightTarget=new THREE.Object3D();flashlightTarget.position.set(0,0,-1);
  camera.add(flashlight,flashlightTarget);flashlight.target=flashlightTarget;
  hemiLight=new THREE.HemisphereLight(0xd7ecff,0x4a5260,2);scene.add(hemiLight);
  sunLight=new THREE.DirectionalLight(0xffe0b4,1.5);sunLight.position.set(-25,45,25);sunLight.castShadow=false;scene.add(sunLight);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(900,900),new THREE.MeshLambertMaterial({color:0x58636b}));ground.rotation.x=-Math.PI/2;ground.position.y=-.12;scene.add(ground);
  const road=new THREE.Mesh(new THREE.PlaneGeometry(18,520),new THREE.MeshLambertMaterial({color:0x202a35}));road.rotation.x=-Math.PI/2;road.position.set(0,0,-45);scene.add(road);
  for(let z=-300;z<225;z+=12){const line=new THREE.Mesh(new THREE.PlaneGeometry(.18,5),new THREE.MeshBasicMaterial({color:0xe5dfc5}));line.rotation.x=-Math.PI/2;line.position.set(0,.015,z);scene.add(line);}
  const sidewalkMat=new THREE.MeshLambertMaterial({color:0x92999b});
  for(const x of [-9.2,9.2]){const s=new THREE.Mesh(new THREE.BoxGeometry(3.5,.25,520),sidewalkMat);s.position.set(x,.08,-45);scene.add(s);}
  buildStreetInfrastructure();buildTransitStops();
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
  buildEmergencyServices();buildFrankfurtLandmarks();
  buildDealership();
  createTraffic();
  // Erweiterte Stadt: zusätzliche Wohn- und Geschäftsquartiere, Nebenstraßen und Plätze.
  const sideRoadMat=new THREE.MeshStandardMaterial({color:0x29333d,roughness:.96});
  const sideWalkMat=new THREE.MeshStandardMaterial({color:0x92999b,roughness:.9});
  for(const x of [-160,-130,-82,-48,48,82,130,160]){
    const avenue=new THREE.Mesh(new THREE.PlaneGeometry(11,520),sideRoadMat);
    avenue.rotation.x=-Math.PI/2;avenue.position.set(x,.005,-45);scene.add(avenue);
    for(const sx of [x-7.5,x+7.5]){
      const pavement=new THREE.Mesh(new THREE.BoxGeometry(3,.2,520),sideWalkMat);
      pavement.position.set(sx,.06,-45);scene.add(pavement);
    }
  }
  for(let z=-190;z<=95;z+=38){
    const cross=new THREE.Mesh(new THREE.PlaneGeometry(360,9),sideRoadMat);
    cross.rotation.x=-Math.PI/2;cross.position.set(0,.012,z);scene.add(cross);
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
  for(let z=-286;z<220;z+=26){
    for(const x of [-170,-145,-103,-61,61,103,145,170])streetLamp(x,z);
  }
  // Neue Außenbezirke: zusätzliche Straßen, Wohnblocks und kleine Gewerbequartiere.
  const outerPalette=[0xb8b7aa,0x82949d,0xc5b69f,0x71838b,0x9eaaa4,0xc2c8c5];
  for(let z=-266;z<=210;z+=38){
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
  flUpdateSystems(dt);
  for(const signal of trafficSignals){const phase=(t+signal.phase*1.7)%8;const active=phase<5?0:phase<6.2?1:2;signal.lamps.forEach((lamp,i)=>lamp.material.emissiveIntensity=i===active?.9:.04);}
  if((performanceFrame++%4)===0)drawMiniMap();
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
  for(const car of dealerDisplayCars){car.rotation.y=Math.PI/2+Math.sin(t*.45)*.025;}
  updateCutscene(dt);
  if(phonePanel&&!phonePanel.classList.contains('hidden')){const clockEl=phonePanel.querySelector('#phoneClock');if(clockEl)clockEl.textContent=new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'});}
  for(const car of policeCars){
    const [red,blue]=car.userData.lights;
    const flash=Math.floor(t*7)%2===0;
    red.material.color.setHex(flash?0xff2038:0x40151d);
    blue.material.color.setHex(flash?0x173c78:0x247bff);
  }
  for(const car of emergencyVehicles){const [red,blue]=car.userData.emergencyLights;const flash=Math.floor(t*8)%2===0;red.material.color.setHex(flash?0xff2638:0x52121a);blue.material.color.setHex(flash?0x1c7cff:0x142b51);}
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
function applyCarDamage(car,level){
 if(!car)return;
 const d=car.userData.damageParts;if(!d)return;
 const n=Math.max(0,Math.min(4,level|0));
 d.paint.color.setHex(n===0?d.originalColor:[0,0x777777,0x68636a,0x48434a,0x30343a][n]);
 d.paint.roughness=n===0?.38:Math.min(.96,.42+n*.13);
 d.frontBumper.position.y=.42-n*.045;d.frontBumper.rotation.x=-n*.055;
 d.rearBumper.position.y=.42-n*.03;d.bumper.rotation.x=-n*.08;
 d.hoodDent.visible=n>=2;d.hoodDent.position.y=.94-n*.022;
 d.crack.visible=n>=2;d.smoke.visible=n>=4;
 if(d.scratches)d.scratches.forEach((mesh,i)=>{mesh.visible=n>=i+1;});
 if(d.sideDents)d.sideDents.forEach((mesh,i)=>{mesh.visible=n>=i+2;});
 if(d.headlights)d.headlights.forEach(mesh=>{mesh.material.color.setHex(n>=4?0x66584b:0xfff0c8);mesh.material.transparent=n>=4;mesh.material.opacity=n>=4?.45:1;});
}
function refreshDamageHud(){
 if(!damageHud)return;
 damageHud.classList.remove('hidden');
 damageHud.innerHTML='<b>FAHRZEUGZUSTAND · '+(100-damageLevel*25)+' %</b><span>'+['Keine Schäden','Leichte Kratzer','Dellen & Lackschäden','Stark beschädigt','Reparatur erforderlich'][damageLevel]+'</span><div class="damage-bars">'+[0,1,2,3].map(i=>'<i class="'+(i<damageLevel?'lost':'')+'"></i>').join('')+'</div><small>Werkstatt: TUNINGWERK · Reparatur ab '+Math.max(120,damageLevel*260)+' €</small>';
}
function damagePlayerCar(){
 if(!jobCar)return;
 damageLevel=Math.min(4,damageLevel+1);flSavedDamage=damageLevel;
 applyCarDamage(jobCar,damageLevel);refreshDamageHud();
 if(damageLevel>=3)carSpeed*=.82;
 flSaveGame();damageFlash=.28;
}
function updateBreakableCollisions(dt){
 if(damageCooldown>0)damageCooldown=Math.max(0,damageCooldown-dt);
 if(driving&&jobCar&&Math.abs(carSpeed)>=.075){
  if(damageCooldown===0){
   const movingCars=[...trafficCars,...emergencyVehicles];
   for(const other of movingCars){if(Math.hypot(jobCar.position.x-other.position.x,jobCar.position.z-other.position.z)<2.7){damagePlayerCar();damageCooldown=1.1;carSpeed*=.58;status.textContent='FAHRZEUGKOLLISION · SCHADEN';break;}}
  }
  for(const prop of breakableProps){
   if(!prop.active)continue;
   const dx=jobCar.position.x-prop.group.position.x,dz=jobCar.position.z-prop.group.position.z;
   if(Math.hypot(dx,dz)<prop.radius+1.45){
    prop.active=false;prop.velocity=Math.max(.14,Math.abs(carSpeed)*1.4);
    prop.group.userData.falling=true;prop.group.userData.fallDir=Math.atan2(dx,dz);
    damagePlayerCar();carSpeed*=.72;
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

function move(){
  if(driving&&jobCar){
    const accelerating=keys.KeyW||keys.ArrowUp, braking=keys.KeyS||keys.ArrowDown;
    if(accelerating&&flFuel>0)carSpeed=Math.min(0.42+tuningLevel*.055,carSpeed+0.012+tuningLevel*.002);
    else if(braking)carSpeed=Math.max(-0.18,carSpeed-0.014);
    else carSpeed*=0.975;
    const steer=(keys.KeyA||keys.ArrowLeft?1:0)-(keys.KeyD||keys.ArrowRight?1:0);
    jobCar.rotation.y+=steer*Math.min(.035,Math.abs(carSpeed)*.11);
    const forward=new THREE.Vector3(Math.sin(jobCar.rotation.y),0,Math.cos(jobCar.rotation.y));
    jobCar.position.addScaledVector(forward,carSpeed);
    updateBreakableCollisions(.016);
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
    camera.position.copy(jobCar.position).addScaledVector(forward,cameraMode==='close'?-3.6:cameraMode==='hood'?1:-6);
    camera.position.y=cameraMode==='hood'?1.55:cameraMode==='close'?2.55:3.2;
    if(damageFlash>0)damageFlash=Math.max(0,damageFlash-.02);
  }else{
    const speed=(keys.ShiftLeft||keys.ShiftRight)?.2:.12;
    const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));
    const right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
    if(keys.KeyW||keys.ArrowUp)camera.position.addScaledVector(forward,speed);
    if(keys.KeyS||keys.ArrowDown)camera.position.addScaledVector(forward,-speed);
    if(keys.KeyA||keys.ArrowLeft)camera.position.addScaledVector(right,-speed);
    if(keys.KeyD||keys.ArrowRight)camera.position.addScaledVector(right,speed);
    camera.position.x=Math.max(-178,Math.min(178,camera.position.x));
    camera.position.z=Math.max(-298,Math.min(218,camera.position.z));
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
function cycleCamera(){cameraMode=cameraMode==='follow'?'close':cameraMode==='close'?'hood':'follow';status.textContent='KAMERA: '+({follow:'VERFOLGER',close:'NAH',hood:'MOTORHAUBE'}[cameraMode]);}
function toggleVehicle(){
  if(!jobCar){status.textContent='WÄHLE ZUERST EINEN JOB MIT J';return;}
  if(!driving){
    if(camera.position.distanceTo(jobCar.position)>9){status.textContent='GEHE NÄHER AN DEIN DIENSTFAHRZEUG';return;}
    driving=true;carSpeed=0;cameraLookOffset=0;yaw=jobCar.rotation.y-Math.PI;
    status.textContent='IM FAHRZEUG · WASD / STICK FAHREN · F / X AUSSTEIGEN';
  }else{
    driving=false;carSpeed=0;cameraLookOffset=0;
    camera.position.set(jobCar.position.x+3,2.1,jobCar.position.z+3);
    status.textContent='AUSGESTIEGEN · F / X ZUM EINSTEIGEN';
  }
}
function loop(now=0){
  raf=requestAnimationFrame(loop);
  pollGamepad();
  if(maxFps&&now-lastFrame<1000/maxFps)return;
  lastFrame=now;const dt=Math.min(clock.getDelta(),.05);
  move();updateWorld(dt);renderer.render(scene,camera);
}
function begin(){
  if(started)return;started=true;placeholder?.remove();
  if(qualitySelect){const saved=localStorage.getItem('flQuality');qualitySelect.value=saved&&qualitySettings[saved]?saved:(lowEndDevice?'ultra':'medium');}
  if(fpsSelect){const savedFps=localStorage.getItem('flFps');fpsSelect.value=savedFps|| (lowEndDevice?'30':'60');maxFps=fpsSelect.value==='unlimited'?0:Number(fpsSelect.value);}
  status.textContent=lowEndDevice?'SPARMODUS AKTIV · ÄLTERE HARDWARE':'STADT GELADEN · KLICKE INS SPIEL';
  try{
    renderer=new THREE.WebGLRenderer({antialias:!lowEndDevice,powerPreference:lowEndDevice?'low-power':'high-performance'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1));
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    renderer.shadowMap.enabled=false;
    sunLight=null;hemiLight=null;
    makeCity();buildBreakableProps();buildInGameJobs();buildShopInteraction();buildPhone();buildDealerPanel();buildMiniMap();buildGamepadStatus();flBuildStatus();applyQuality();viewport.appendChild(renderer.domElement);flLoadGame();flApplyWeather();resize();loop();
    renderer.domElement.tabIndex=0;
    renderer.domElement.addEventListener('click',()=>{renderer.domElement.focus();if(!phonePanel||phonePanel.classList.contains('hidden')){try{const result=renderer.domElement.requestPointerLock?.();if(result?.catch)result.catch(()=>{status.textContent='MAUSZIEHEN ZUM UMSEHEN';});}catch(_){status.textContent='MAUSZIEHEN ZUM UMSEHEN';}}});
    renderer.domElement.addEventListener('pointerdown',e=>{if(e.button!==0||locked)return;lookDrag=true;lastPointerX=e.clientX;lastPointerY=e.clientY;});
    document.addEventListener('pointerup',()=>lookDrag=false);
    const applyMouseLook=(dx,dy)=>{yaw-=dx*.0045*mouseSensitivity;if(driving)cameraLookOffset-=dx*.0045*mouseSensitivity;pitch=Math.max(-1.15,Math.min(1.15,pitch-dy*.0045*mouseSensitivity*(invertCameraY?-1:1)));};
    viewport.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('button,select,input,.phone-overlay,.ingame-jobs'))return;lookDrag=true;lastPointerX=e.clientX;lastPointerY=e.clientY;});
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
document.addEventListener('keydown',e=>{keys[e.code]=true;keyboardKeys[e.code]=true;if(e.code==='F1'){e.preventDefault();if(!e.repeat)togglePhone();return;}if(e.code==='KeyE'&&!e.repeat){toggleShopOrDealer();}if(e.code==='KeyF'&&!e.repeat)toggleVehicle();if(e.code==='KeyJ'&&!e.repeat)toggleJobs();if(e.code==='KeyL'&&!e.repeat)toggleFlashlight();if(e.code==='F5'&&!e.repeat){e.preventDefault();flSaveGame(true);}if(e.code==='KeyC'&&!e.repeat)cycleCamera();if(e.code==='Escape'&&jobPanel&&!jobPanel.classList.contains('hidden'))jobPanel.classList.add('hidden');if(e.code==='Escape'&&shopPanel&&!shopPanel.classList.contains('hidden'))shopPanel.classList.add('hidden');if(e.code==='Escape'&&phonePanel&&!phonePanel.classList.contains('hidden'))phonePanel.classList.add('hidden');if(e.code==='Escape'&&dealerPanel&&!dealerPanel.classList.contains('hidden'))dealerPanel.classList.add('hidden');if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();});
document.addEventListener('keyup',e=>{keys[e.code]=false;keyboardKeys[e.code]=false;});
window.addEventListener('resize',resize);
