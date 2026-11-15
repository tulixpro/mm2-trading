// MM2 Vault: lokale Merkliste/Trade-Planung; Besitz bleibt unverifiziert bis Backend.
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
const KEY="mm2vault_inventory_v2";let owned=new Set();let tradeItems=new Set();let category="Alle";
const grid=document.getElementById("catalogGrid"),inventory=document.getElementById("inventoryList"),search=document.getElementById("search");
function save(){localStorage.setItem(KEY,JSON.stringify([...owned]));render()}
function render(){const q=search.value.toLowerCase();const filtered=weapons.filter(w=>(category==="Alle"||w.rarity===category)&&w.name.toLowerCase().includes(q));grid.innerHTML=filtered.map(w=>'<article class="weapon rarity-'+w.rarity.toLowerCase()+'"><div class="weapon-visual"><svg viewBox="0 0 56 56" aria-hidden="true">'+(w.rarity==="Ancient"||w.rarity==="Unique"?'<path d="M12 48 37 8l7 5-24 40z"/>':'<path d="M8 31h31v7H8zM17 23h13v8H17zM22 38h7v10h-7zM37 27h10v6H37z"/>')+'</svg><span class="weapon-icon">'+(emojis[w.rarity]||"✦")+'</span></div><h3>'+w.name+'</h3><small>'+w.rarity+'</small><button class="secondary" disabled>🔒 Besitz prüfen (bald)</button></article>').join("")||'<p class="empty">Keine Treffer. Suchbegriff oder Kategorie ändern.</p>';inventory.innerHTML='<div class="empty">Noch kein verifiziertes Inventar. Roblox-Backend ist nicht verbunden.</div>';
document.getElementById("ownedCount").textContent=owned.size;document.getElementById("catalogCount").textContent=weapons.length;
}
search.addEventListener("input",render);document.getElementById("filters").addEventListener("click",e=>{const b=e.target.closest("[data-filter]");if(!b)return;category=b.dataset.filter;document.querySelectorAll("[data-filter]").forEach(x=>x.classList.toggle("active",x===b));render()});
document.getElementById("reset").onclick=()=>{owned.clear();tradeItems.clear();localStorage.removeItem(KEY);localStorage.removeItem("mm2vault_tradeitems");localStorage.removeItem(KEY);localStorage.removeItem("mm2vault_tradeitems");render();renderTrade();};
document.getElementById("runCheck").onclick=()=>{const counts={},unknown=[];owned.forEach(n=>{const w=weapons.find(x=>x.name===n);if(w)counts[w.rarity]=(counts[w.rarity]||0)+1;else unknown.push(n)});const total=[...owned].length;document.getElementById("checkResults").innerHTML='<div><span>Items im Lager</span><strong>'+total+'</strong></div>'+Object.entries(counts).map(([r,n])=>'<div><span>'+r+'</span><strong>'+n+'</strong></div>').join("")+'<div><span>Im Katalog erkannt</span><strong>'+(total-unknown.length)+' / '+total+'</strong></div>';document.getElementById("checkMessage").textContent=total?'Katalog-Abgleich (kein Besitznachweis): '+(total-unknown.length)+' Items erkannt, '+unknown.length+' unbekannt.':'Merkliste leer – markiere Items im Katalog.'};
function renderTrade(){const box=document.getElementById("tradeInventory");if(!box)return;box.innerHTML='<p class="empty">Trade-Auswahl erst verfügbar, wenn dein Inventar serverseitig verifiziert wurde.</p>';document.getElementById("tradeCount").textContent="0 verifiziert"}
document.getElementById("makeTrade").onclick=()=>{const want=document.getElementById("want").value.trim();const selected=[];document.getElementById("tradeOutput").textContent="TRADE-PLANUNG\\nDu gibst: "+(selected.join(", ")||"Noch keine bestätigten lokalen Auswahl-Items")+"\\nDu suchst: "+(want||"—")+"\\n\\nNur Planung – kein Roblox-Trade oder Besitznachweis."};
render();renderTrade();

// Settings + safe demo login + local trade safety heuristics
(()=>{const $=id=>document.getElementById(id);const dlg=$("settingsDialog");if(!dlg)return;
const settings=JSON.parse(localStorage.getItem("mm2vault_settings")||'{"compact":false,"confirm":true,"theme":"purple"}');
$("compactMode").checked=settings.compact;$("confirmToggle").checked=settings.confirm;$("themeSelect").value=settings.theme;
function apply(){document.body.classList.toggle("compact",settings.compact);document.body.classList.toggle("orange-theme",settings.theme==="orange");localStorage.setItem("mm2vault_settings",JSON.stringify(settings))}
$("settingsOpen").onclick=()=>dlg.showModal();$("settingsClose").onclick=()=>dlg.close();
$("compactMode").onchange=e=>{settings.compact=e.target.checked;apply()};$("confirmToggle").onchange=e=>{settings.confirm=e.target.checked;apply()};$("themeSelect").onchange=e=>{settings.theme=e.target.value;apply()};
$("reset").onclick=()=>{if(!settings.confirm||confirm("Dein lokal gespeichertes Demo-Lager wirklich leeren?")){owned.clear();save()}};
$("makeTrade").onclick=()=>{const want=$("want").value.trim();const selected=[...tradeItems].filter(n=>owned.has(n));const notes=[];if(!selected.length)notes.push("Wähle zuerst lokal markierte Items im Trade-Lager.");if(!want)notes.push("Wunsch-Item noch leer.");$("tradeOutput").textContent="TRADE-PLANUNG (lokal)\\nDu gibst: "+(selected.join(", ")||"—")+"\\nDu suchst: "+(want||"—")+"\\n"+(notes.length?notes.join("\\n")+"\\n":"")+"\\nNur Planung – kein Besitznachweis und kein echter Roblox-Trade.";};
apply();
})();

// Echte Bot-/Inventarverifizierung wird erst mit Backend aktiviert. Keine simulierten Bot-Profile.

/* Safe login placeholder: OAuth only once a backend is deployed. */
(()=>{const open=document.getElementById("loginOpen"),dlg=document.getElementById("loginDialog"),close=document.getElementById("loginClose");if(!open||!dlg||!close)return;open.addEventListener("click",()=>dlg.showModal());close.addEventListener("click",()=>dlg.close());dlg.addEventListener("click",e=>{if(e.target===dlg)dlg.close()})})();
