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
const KEY="mm2vault_inventory_v2";let owned=new Set(JSON.parse(localStorage.getItem(KEY)||"[]"));let category="Alle";
const grid=document.getElementById("catalogGrid"),inventory=document.getElementById("inventoryList"),search=document.getElementById("search");
function save(){localStorage.setItem(KEY,JSON.stringify([...owned]));render()}
function render(){const q=search.value.toLowerCase();const filtered=weapons.filter(w=>(category==="Alle"||w.rarity===category)&&w.name.toLowerCase().includes(q));grid.innerHTML=filtered.map(w=>{let yes=owned.has(w.name);return '<article class="weapon '+(yes?'owned':'missing')+'"><div><div class="weapon-icon">'+(emojis[w.rarity]||"🔫")+'</div><h3>'+w.name+'</h3><small>'+w.rarity+'</small></div><button data-item="'+w.name.replaceAll('"','&quot;')+'">'+(yes?"✓ Im Lager":"＋ Hinzufügen")+'</button></article>'}).join("")||'<p class="empty">Keine Waffen gefunden.</p>';
inventory.innerHTML=[...owned].length?[...owned].sort().map(n=>'<span class="inventory-chip">'+n+'</span>').join(""):'<div class="empty">Noch keine Items markiert. Klicke im Katalog auf „Hinzufügen“.</div>';
document.getElementById("ownedCount").textContent=owned.size;document.getElementById("catalogCount").textContent=weapons.length;
document.getElementById("give").innerHTML=[...owned].sort().map(n=>'<option>'+n+'</option>').join("")||'<option>Kein Item im Lager</option>';
}
search.addEventListener("input",render);document.getElementById("filters").addEventListener("click",e=>{const b=e.target.closest("[data-filter]");if(!b)return;category=b.dataset.filter;document.querySelectorAll("[data-filter]").forEach(x=>x.classList.toggle("active",x===b));render()});
grid.addEventListener("click",e=>{const b=e.target.closest("[data-item]");if(!b)return;owned.has(b.dataset.item)?owned.delete(b.dataset.item):owned.add(b.dataset.item);save()});
document.getElementById("reset").onclick=()=>{if(confirm("Dein lokal gespeichertes Demo-Lager wirklich leeren?")){owned.clear();save()}};
document.getElementById("runCheck").onclick=()=>{const counts={};owned.forEach(n=>{const w=weapons.find(x=>x.name===n);if(w)counts[w.rarity]=(counts[w.rarity]||0)+1});document.getElementById("checkResults").innerHTML='<div><span>Items insgesamt</span><strong>'+owned.size+'</strong></div>'+Object.entries(counts).map(([r,n])=>'<div><span>'+r+'</span><strong>'+n+'</strong></div>').join("");document.getElementById("checkMessage").textContent=owned.size?'Check abgeschlossen: '+owned.size+' markierte Waffen lokal gefunden.':'Dein Lager ist noch leer.'};
document.getElementById("makeTrade").onclick=()=>{const give=document.getElementById("give").value,want=document.getElementById("want").value.trim();document.getElementById("tradeOutput").textContent='DEIN DEMO-ANGEBOT\nDu gibst: '+(owned.size?give:"Noch kein Item")+'\nDu suchst: '+(want||"Bitte Wunsch-Item eintragen")+'\n\nNur Planung – kein echter Trade.'};
render();

// Settings + safe demo login + local trade safety heuristics
(()=>{const $=id=>document.getElementById(id);const dlg=$("settingsDialog");if(!dlg)return;
const settings=JSON.parse(localStorage.getItem("mm2vault_settings")||'{"compact":false,"confirm":true,"theme":"purple"}');
$("compactMode").checked=settings.compact;$("confirmToggle").checked=settings.confirm;$("themeSelect").value=settings.theme;
function apply(){document.body.classList.toggle("compact",settings.compact);document.body.classList.toggle("orange-theme",settings.theme==="orange");localStorage.setItem("mm2vault_settings",JSON.stringify(settings))}
$("settingsOpen").onclick=()=>dlg.showModal();$("settingsClose").onclick=()=>dlg.close();
$("compactMode").onchange=e=>{settings.compact=e.target.checked;apply()};$("confirmToggle").onchange=e=>{settings.confirm=e.target.checked;apply()};$("themeSelect").onchange=e=>{settings.theme=e.target.value;apply()};
$("loginBtn").onclick=()=>alert("Roblox Login ist hier noch nicht verbunden. Sicherer Login geht nur über offiziell eingerichtetes Roblox OAuth (mit registrierter App/Redirect-URL) – niemals Passwort oder Cookie auf dieser Seite eingeben. Du kannst die Demo ohne Login nutzen.");
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
