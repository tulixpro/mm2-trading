// MM2 Vault: manuelles Fan-Demo-Inventar. Kein Roblox-Zugriff.
const raw={
Godly:"Acryl|Amerilaser|Bats|Battle Axe|Battle Axe II|Bioblade|Blaster|Blue Seer|Boneblade|Br ginger|Bringer|Candleflame|Candy|Chill|Clockwork|Deathshard|Deciever|Delusion|Eternal|Eternal II|Eternal III|Eternal IV|Fang|Flames|Gemstone|Ghostblade|Gingerblade|Glitch2|Hallow|Hallowgun|Heat|Iceblaster|Icebreaker|Iceflake|Icepiercer|Ice Shard|Ice Wing|Icedriller|Immolator|Intervention|Laser|Luger|Nebula|Nightblade|Orange Seer|Pearl|Peppermint|Pixel|Plasmabeam|Prismatic|Purple Seer|Red Seer|Red Luger|Reaver|Saw|Seer|Shark|Slasher|Sparkle|Spectre|Spirit|Sugar|Swirly Axe|Swirly Blade|Swirly Gun|Swirly Scythe|Tides|Virtual|Vampire's Edge|Waves|Xmas|Yellow Seer",
Ancient:"Batwing|Elderwood Scythe|Elderwood Blade|Hallowscythe|Icebreaker|Icewing|Icepiercer|Logchopper|Niks Scythe|Reaver|Swirly Axe|Vampire's Axe|Harvester",
Unique:"Corrupt|Niks Scythe|Traveler's Gun",
Vintage:"America|Blood|Cowboy|Ghost|Golden|Laser|Phaser|Prince|Shadow|Splitter",
Classic:"Default Knife|Default Gun",
Legendary:"Adurite|Alex|Bluesteel|Chroma|Denis|Dogey|Elite|Fade|Green Fire|JD|Lovely|Magma|Ornament|Patrick|Purple|Red Fire|Shiny|Sparkle|Star|TNL|Universe|Viper",
Rare:"Aurora|Blue|Blue Elite|Camo|Cavern|Doge|Engraved|Ginger|Ice|Krypto|Mummy|Orange|Rainbow|Snowflake|Spectrum|Web",
Uncommon:"Abstract|Bacon|Branches|Caution|Checker|Circuit|Clown|Dots|Dungeon|Eco|Frostfade|Hacker|Haze|Jigsaw|Mosaic|Ocean|Peacock|Splat|Toxic|Vortex",
Common:"Arctic|Beach|Black|Bronze|Bubblegum|Camo|Candy Corn|Carbon|Cedar|Choco|Cloud|Copper|Coral|Crimson|Daisy|Deep Sea|Denim|Dirt|Emerald|Frost|Galaxy|Goo|Granite|Grass|Hazmat|Hot Chocolate|Lavender|Leaf|Lemon|Marble|Melon|Mint|Nebula|Oceanic|Orange|Paper|Pastel|Peach|Pine|Platinum|Rainbow|Rose|Rust|Sand|Sapphire|Sharky|Silver|Slate|Snow|Splatter|Stone|Sunset|Tiger|Waves|Whiteout|Wood"
};
const weapons=[];Object.entries(raw).forEach(([rarity,names])=>names.split("|").forEach(name=>weapons.push({name,rarity})));
const emojis={Godly:"✨",Ancient:"🗡️",Unique:"👑",Vintage:"🔫",Classic:"🔪",Legendary:"⭐",Rare:"💠",Uncommon:"🔹",Common:"⚪"};
const KEY="mm2vault_inventory_v2";let owned=new Set(JSON.parse(localStorage.getItem(KEY)||"[]"));let tradeItems=new Set(JSON.parse(localStorage.getItem("mm2vault_tradeitems")||"[]"));let category="Alle";
const grid=document.getElementById("catalogGrid"),inventory=document.getElementById("inventoryList"),search=document.getElementById("search");
function save(){localStorage.setItem(KEY,JSON.stringify([...owned]));render()}
function render(){const q=search.value.toLowerCase();const filtered=weapons.filter(w=>(category==="Alle"||w.rarity===category)&&w.name.toLowerCase().includes(q));grid.innerHTML=filtered.map(w=>{let yes=owned.has(w.name),it=tradeItems.has(w.name);return '<article class="weapon '+(yes?'owned':'missing')+'"><div><div class="weapon-icon">'+(emojis[w.rarity]||"🔫")+'</div><h3>'+w.name+'</h3><small>'+w.rarity+'</small></div><div class="weapon-actions"><button data-item="'+w.name.replaceAll('"','&quot;')+'">'+(yes?"✓ In Inventar":"＋ Inventar")+'</button><button class="secondary" data-tradeitem="'+w.name.replaceAll('"','&quot;')+'">'+(it?"✓ Im Trade":"⇄ Zum Trade")+'</button></div></article>'}).join("")||'<p class="empty">Keine Waffen gefunden.</p>';
inventory.innerHTML=[...owned].length?[...owned].sort().map(n=>'<span class="inventory-chip">'+n+'</span>').join(""):'<div class="empty">Noch keine Items markiert. Klicke im Katalog auf „Hinzufügen“.</div>';
document.getElementById("ownedCount").textContent=owned.size;document.getElementById("catalogCount").textContent=weapons.length;
document.getElementById("give").innerHTML=[...owned].sort().map(n=>'<option>'+n+'</option>').join("")||'<option>Kein Item im Lager</option>';
}
search.addEventListener("input",render);document.getElementById("filters").addEventListener("click",e=>{const b=e.target.closest("[data-filter]");if(!b)return;category=b.dataset.filter;document.querySelectorAll("[data-filter]").forEach(x=>x.classList.toggle("active",x===b));render()});
grid.addEventListener("click",e=>{const t=e.target.closest("[data-tradeitem]");if(t){const n=t.dataset.tradeitem;if(!owned.has(n)){alert("Erst lokal im Inventar markieren. Das bestätigt keinen echten Besitz.");return}tradeItems.has(n)?tradeItems.delete(n):tradeItems.add(n);localStorage.setItem("mm2vault_tradeitems",JSON.stringify([...tradeItems]));renderTrade();render();return}const b=e.target.closest("[data-item]");if(!b)return;owned.has(b.dataset.item)?owned.delete(b.dataset.item):owned.add(b.dataset.item);save()});
document.getElementById("reset").onclick=()=>{if(confirm("Dein lokal gespeichertes Demo-Lager wirklich leeren?")){owned.clear();save()}};
document.getElementById("runCheck").onclick=()=>{const counts={},unknown=[];owned.forEach(n=>{const w=weapons.find(x=>x.name===n);if(w)counts[w.rarity]=(counts[w.rarity]||0)+1;else unknown.push(n)});const total=[...owned].length;document.getElementById("checkResults").innerHTML='<div><span>Items im Lager</span><strong>'+total+'</strong></div>'+Object.entries(counts).map(([r,n])=>'<div><span>'+r+'</span><strong>'+n+'</strong></div>').join("")+'<div><span>Im Katalog erkannt</span><strong>'+(total-unknown.length)+' / '+total+'</strong></div>';document.getElementById("checkMessage").textContent=total?'Bot-Check fertig: '+(total-unknown.length)+' Items erkannt, '+unknown.length+' unbekannt.':'Lager leer – füge zuerst Waffen im Katalog hinzu.'};
function renderTrade(){const box=document.getElementById("tradeInventory");if(!box)return;box.innerHTML=[...tradeItems].map(n=>'<span class="inventory-chip">'+n+' <button data-removetrade="'+n.replaceAll('"','&quot;')+'">×</button></span>').join("")||'<p class="empty">Noch keine Items ausgewählt. Nutze im Katalog „Zum Trade“.</p>';document.getElementById("tradeCount").textContent=tradeItems.size+" Items"}
document.getElementById("tradeInventory")?.addEventListener("click",e=>{const b=e.target.closest("[data-removetrade]");if(!b)return;tradeItems.delete(b.dataset.removetrade);localStorage.setItem("mm2vault_tradeitems",JSON.stringify([...tradeItems]));renderTrade();render()});
document.getElementById("clearTrade")?.addEventListener("click",()=>{tradeItems.clear();localStorage.setItem("mm2vault_tradeitems","[]");renderTrade();render()});
document.getElementById("makeTrade").onclick=()=>{const want=document.getElementById("want").value.trim();const selected=[...tradeItems].filter(n=>owned.has(n));document.getElementById("tradeOutput").textContent="TRADE-PLANUNG\\nDu gibst: "+(selected.join(", ")||"Noch keine bestätigten lokalen Auswahl-Items")+"\\nDu suchst: "+(want||"—")+"\\n\\nNur Planung – kein Roblox-Trade oder Besitznachweis."};
render();

// Settings + safe demo login + local trade safety heuristics
(()=>{const $=id=>document.getElementById(id);const dlg=$("settingsDialog");if(!dlg)return;
const settings=JSON.parse(localStorage.getItem("mm2vault_settings")||'{"compact":false,"confirm":true,"theme":"purple"}');
$("compactMode").checked=settings.compact;$("confirmToggle").checked=settings.confirm;$("themeSelect").value=settings.theme;
function apply(){document.body.classList.toggle("compact",settings.compact);document.body.classList.toggle("orange-theme",settings.theme==="orange");localStorage.setItem("mm2vault_settings",JSON.stringify(settings))}
$("settingsOpen").onclick=()=>dlg.showModal();$("settingsClose").onclick=()=>dlg.close();
$("compactMode").onchange=e=>{settings.compact=e.target.checked;apply()};$("confirmToggle").onchange=e=>{settings.confirm=e.target.checked;apply()};$("themeSelect").onchange=e=>{settings.theme=e.target.value;apply()};
const importBtn=$("importInventory");
if(importBtn)importBtn.onclick=()=>{
 const text=$("inventoryImport").value;
 const names=text.split(/[\\r\\n,;]+/).map(x=>x.trim()).filter(Boolean);
 if(!names.length){$("botMessage").textContent="Bitte erst Itemnamen einfügen.";return}
 let added=0,unknown=[];
 names.forEach(n=>{const found=weapons.find(w=>w.name.toLowerCase()===n.toLowerCase());const name=found?found.name:n;if(!owned.has(name)){owned.add(name);added++}if(!found)unknown.push(n)});
 save();
 const active=bots.find(x=>x.id===Number($("botFrom").value));
 if(active){names.forEach(n=>{const w=weapons.find(x=>x.name.toLowerCase()===n.toLowerCase());active.items.push(w?w.name:n)});persist()}
 $("botMessage").textContent="Import geprüft: "+names.length+" Einträge · "+added+" neu im Lager · "+unknown.length+" nicht im Katalog. "+(active?"Auch in "+active.name+" übernommen.":"");
 $("checkMessage").textContent="Import-Check: "+names.length+" Itemnamen verarbeitet; "+unknown.length+" unbekannte Schreibweisen.";
 $("inventoryImport").value="";
};
$("reset").onclick=()=>{if(!settings.confirm||confirm("Dein lokal gespeichertes Demo-Lager wirklich leeren?")){owned.clear();save()}};
$("makeTrade").onclick=()=>{const give=$("give").value,want=$("want").value.trim();const from=weapons.find(w=>w.name===give);const target=weapons.find(w=>w.name.toLowerCase()===want.toLowerCase());let alerts=[];
if(!give||!owned.has(give))alerts.push("⚠️ Du wählst kein Item aus deinem Lager.");
if(!want)alerts.push("⚠️ Wunsch-Item fehlt.");
if(from&&target&&from.rarity!==target.rarity)alerts.push("🛡️ Anti-Scam-Hinweis: unterschiedliche Seltenheiten – Werte selbst prüfen, Seltenheit ist kein Marktwert.");
if(/free|giveaway|cookie|password|passwort|token|verify/i.test(want))alerts.push("🚨 Verdächtiger Begriff: niemals Zugangsdaten oder Cookies teilen.");
$("tradeOutput").textContent="TRADE-SICHERHEITSCHECK (nur Hinweis, kein echter Anti-Cheat)\n"+(alerts.length?alerts.join("\n"):"✅ Keine einfache Auffälligkeit erkannt.")+"\n\nDEMO-ANGEBOT\nDu gibst: "+(give||"—")+"\nDu suchst: "+(want||"—")+"\nNur Planung – kein echter Trade.";
};
apply();
})();

// Lokale Bot-Testprofile (localStorage), keinerlei Roblox-Zugriff
(()=>{const $=id=>document.getElementById(id);const grid=$("botGrid");if(!grid)return;
const key="mm2vault_testbots";let bots=JSON.parse(localStorage.getItem(key)||"null")||[
{id:1,name:"Vault Bot 01",items:["Chroma Luger","Icebreaker","Harvester"]},
{id:2,name:"Trade Tester",items:["Elderwood Scythe","Candy"]},
{id:3,name:"Inventory Mirror",items:["Laser","Seer"]}
];let next=Math.max(0,...bots.map(b=>b.id))+1;
function persist(){localStorage.setItem(key,JSON.stringify(bots));draw()}
function draw(){grid.innerHTML=bots.map(b=>'<article class="bot-card"><div class="bot-head"><span class="bot-avatar">🤖</span><div><h3>'+esc(b.name)+'</h3><small>Testprofil #'+b.id+'</small></div></div><span class="status">● Aktiv (lokal)</span><div class="bot-items"><b>Inventar ('+b.items.length+')</b><br>'+ (b.items.length?b.items.map(esc).join(" · "):"Noch leer")+'</div><button class="secondary bot-remove" data-remove="'+b.id+'">Profil löschen</button></article>').join("")||'<p>Noch keine Bots. Erstelle oben einen Testbot.</p>';
["botFrom","botTo"].forEach(id=>{$(id).innerHTML=bots.map(b=>'<option value="'+b.id+'">'+esc(b.name)+'</option>').join("")});
if($("botTo").options.length>1)$("botTo").selectedIndex=1;
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
$("botWeapon").innerHTML=weapons.map(w=>'<option>'+esc(w.name)+'</option>').join("");
$("createBot").onclick=()=>{let name=$("botName").value.trim()||"TestBot "+next;if(bots.some(b=>b.name.toLowerCase()===name.toLowerCase())){$("botMessage").textContent="Dieser Name existiert schon.";return}bots.push({id:next++,name,items:[]});$("botName").value="";persist();$("botMessage").textContent=name+" wurde als lokales Testprofil erstellt."};
$("addBotItem").onclick=()=>{let b=bots.find(x=>x.id===Number($("botFrom").value));if(!b){$("botMessage").textContent="Erstelle zuerst einen Bot.";return}let item=$("botWeapon").value;b.items.push(item);persist();$("botMessage").textContent=item+" zu "+b.name+" hinzugefügt."};
$("simulateBotTrade").onclick=()=>{let a=bots.find(x=>x.id===Number($("botFrom").value)),b=bots.find(x=>x.id===Number($("botTo").value));if(!a||!b||a===b){$("botMessage").textContent="Bitte zwei unterschiedliche Bots auswählen.";return}if(!a.items.length){$("botMessage").textContent=a.name+" hat keine Items zum Tauschen.";return}let item=a.items.shift();b.items.push(item);persist();$("botMessage").textContent="Demo-Trade: "+a.name+" → "+b.name+" | "+item+" übertragen (nur lokal)."};
grid.addEventListener("click",e=>{let id=e.target.dataset.remove;if(!id)return;bots=bots.filter(b=>b.id!==Number(id));persist();$("botMessage").textContent="Testprofil entfernt."});draw();
})();