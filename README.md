# Frankfurt Life

Ein unabhängiges Open-City-Projekt mit einem kleinen 3D-Browser-Prototyp.

## Demo-Steuerung
- **W/A/S/D** oder Pfeiltasten: bewegen
- **Maus**: umsehen (in die Demo klicken, um Maussteuerung zu aktivieren)
- **Shift**: schneller bewegen
- **ESC**: Maussteuerung freigeben

## Was im Prototyp enthalten ist
- kleiner, prozedural erzeugter 3D-Stadtblock
- einfache Gebäude, Straße, Gehwege und Bäume
- einfache Fußgänger-NPCs mit Laufbewegung
- ein Polizei-Streifenwagen mit blinkenden Blaulichtern
- einfache First-Person-Steuerung

Die NPCs und der Streifenwagen sind Platzhalter aus einfachen 3D-Formen, keine realistischen, voll animierten Figuren oder Polizeisimulation.

## Windows-App
Ein Electron-Projekt und ein GitHub-Actions-Workflow bereiten Windows-x64-Artefakte (Installer und portable Ausgabe) vor. Der Workflow muss erfolgreich laufen, bevor ein echter Download bereitgestellt werden kann. Die App lädt Three.js derzeit über jsDelivr und benötigt beim Start eine Internetverbindung.

## Neu in Version 0.1.8
- Geschäfte in der Stadt können zu Fuß mit **E** geöffnet werden.
- In Geschäften können Kaffee, Snacks und Stadtpläne mit dem verdienten Spielgeld gekauft werden.
- Ein einfaches Inventar zählt die gekauften Gegenstände.

## Eigene 3D-Spielsysteme – Audio und Bewegung

Die Browser-/Electron-Edition nutzt Three.js als Rendering-Basis und ergänzt eigene Spielsysteme. Neu im Prototyp:
- Prozedural erzeugter Motor-Sound über Web Audio: Tonhöhe und Lautstärke reagieren auf Fahrzeugtempo und Gas; es werden keine externen Sounddateien geladen.
- Prozedurale Schrittgeräusche beim Gehen und schnellere Schrittfolge beim Sprinten.
- Dezente First-Person-Kopfbewegung beim Laufen.
- Fußgänger-NPCs besitzen bereits einfache gegenläufige Arm- und Beinbewegungen; dies ist noch keine Motion-Capture- oder Skelettanimation.

Zusätzlicher Bewegungs-/Audio-Pass:
- Fußgänger besitzen jetzt getrennte Oberschenkel-/Unterschenkel-Gruppen mit Kniebeugung, gegengleichem Armschwung, leichter Oberkörperfederung und kleinen Kopfbewegungen.
- Der Fahrzeugsound enthält jetzt auch einen hörbaren Leerlauf und eine prozedurale Roll-/Reifenrauschschicht, die mit der Geschwindigkeit zunimmt.
- Die First-Person-Schritt- und Kopfbewegung bleibt aktiv.

Die Sounds sind synthetische Platzhalter und keine echten Motoraufnahmen. Für eine realistische Produktion braucht es aufgenommene/lizenzierte Motor-, Reifen-, Fahrbahn-, Tür-, Innenraum- und Umgebungsgeräusche sowie überarbeitete Charakter-Rigs, Fußkontakt, Übergänge zwischen Gehen/Laufen und Animationen für verschiedene Bewegungen. Der Prototyp wurde nach diesen Änderungen nicht in einem Browser-Laufzeittest geprüft.

## Zündung und Motorstart (Browser-/PC-Prototyp)

- Mit **F** in das ausgewählte Dienstfahrzeug einsteigen.
- Im Fahrzeug **M** drücken, um die Zündung bzw. den Motor zu starten.
- Beim Start gibt es ein kurzes synthetisches Anlassgeräusch; anschließend läuft der prozedurale Leerlauf-/Motorsound an.
- Erst nach dem Start reagiert das Fahrzeug auf Gas und Bremse. Mit erneutem **M** wird der Motor ausgeschaltet.
- Beim Aussteigen wird der Motor ausgeschaltet. Bei leerem Tank lässt er sich nicht starten.
- Auf Touch-Geräten gibt es dafür eine zusätzliche **M**-Schaltfläche.

Das ist eine einfache Zündungs-/Startsequenz für den Prototyp, noch keine vollständige Simulation von Schlüsselstellung, Starterrelais, Batterie, Anlasser, Kupplung, Getriebe oder verschiedenen Motorarten. Motor- und Anlassersounds sind synthetisch.

## Ladenbesuche und eigene Snack-Marken

- In die kleinen Geschäfte kannst du durch den Eingangsbereich hineingehen; die vorhandenen Regale und Kassen bilden den Ladeninnenraum.
- Auf den Regalen liegen sichtbare, prozedural erzeugte Warenmodelle. Stelle dich dicht an ein Produkt und drücke **E**, um es gegen Spielgeld einzupacken.
- Alternativ kannst du mit **E** in der Nähe des Ladens das Einkaufsfenster öffnen und Waren dort kaufen.
- Die neuen fiktiven Eigenmarken heißen **KnusperKante** (Chips), **Sprudelstern** (Cola und Wasser) und **Fruchtfunk** (Limo). Es werden keine echten Markenlogos oder Produktverpackungen verwendet.
- Gekaufte Waren erscheinen in der Inventar-App auf dem Handy. Dort kannst du Snacks und Getränke verwenden; die Sättigung steigt entsprechend.

Die Waren sind einfache prozedurale 3D-Platzhalter. Ein echter animierter Kassierer, Regalsystem mit Lagerbestand, Türanimation und physikalisches Aufheben per Hand sind noch nicht umgesetzt.

## Noch nicht enthalten
- fotorealistische Frankfurt-Karte oder echte 1:1-Stadt
- ausgefeilte NPC-KI, Verkehr, Fahrphysik oder begehbare Innenräume
- vollwertige Polizeifunktionen oder Missionen
- Online-Mehrspieler und Voice-Chat

## Build
Auf einem Windows- oder kompatiblen Entwicklungsrechner:
```bash
npm install
npm run dist
```
Die Ausgabe liegt in `dist/`. GitHub Actions kann dieselben Windows-Builds erzeugen.

Die ursprüngliche Version bleibt auf `main`; diese Neugestaltung liegt auf `frankfurt-life-redesign`.


## Version 0.2.5 – Controller & Stadt-Upgrade
- Standard-Gamepad-Unterstützung über die Gamepad API: linker Stick zum Bewegen/Fahren, rechter Stick zum Umsehen, Trigger zum Gasgeben/Bremsen.
- Controller-Belegung: A Interaktion, B Handy, X Fahrzeug, Y Jobs, LB Kamera, RB Taschenlampe, Start Menüs schließen; D-Pad als Bewegungsalternative.
- Tastatur und Controller können parallel verwendet werden.
- Zusätzliche Zebrastreifen, animierte Ampeln und zwei gestaltete Bushaltestellen.
- PS5-Portierung ist nicht enthalten; dafür sind Sonys Entwicklerzugang und das PlayStation-SDK erforderlich.


## Version 0.2.6 – Größere Stadt & Smartphone-Update
- Stadtgebiet auf ungefähr 360 × 520 Spielmeter erweitert, mit zusätzlichen Außenbezirken, Wohnblocks, Straßen und Geschäften.
- Bewegungsgrenzen und Straßen-/Geländeflächen an das größere Gebiet angepasst.
- GPS-Minimap öffnet per Klick die große Stadtkarte mit Spielerposition, Geschäften, Autohaus und Missionsziel.
- Handy-Einstellungen für Grafikqualität, FPS, Maus-Empfindlichkeit, Sichtfeld, Kamera und Minimap-Sichtbarkeit.


## Version 0.2.9 – Stadtleben & Spielstand
- Spielstand lokal speichern und automatisch laden (Geld, Jobs, Fahrzeuge, Inventar, Position und neue Stadtleben-Werte).
- Dynamischer Tageszeitenzyklus sowie wechselnde Wetterlagen (klar, bewölkt, Regen, Nebel) mit angepasster Beleuchtung und Sicht.
- Tankfüllung für Fahrzeuge und Tankstelle mit mehreren Tankmengen.
- Erste Wohnung mieten, Möbel sammeln und zur Wohnung zurückkehren.
- ÖPNV-Demo mit mehreren Stadtteil-Haltepunkten und Fahrtenzähler.
- Outfit-Farbvarianten über das Smartphone wechseln.
- Neue Handy-Apps für Speichern und Charakter-Anpassung.

Hinweis: Diese Systeme sind spielbare Prototypen. Wettereffekte sind zunächst über Beleuchtung und Sichtweite umgesetzt; ÖPNV-Fahrten wechseln in dieser Version zwischen Haltepunkten statt einer vollständig simulierten Bus-/Straßenbahnfahrt. Innenräume, echte Radiosender, Multiplayer und eine vollständige Charakter-Modellierung bleiben weitere Ausbaustufen.


## Version 0.3.0 – Tagesziele & ÖPNV-Ausbau
- Tagesziele: pro Kalendertag einen Auftrag erledigen und eine ÖPNV-Fahrt machen; danach 250 € Bonus abholen.
- Tagesfortschritt und Bonusstatus werden mit dem Spielstand gespeichert und am neuen Kalendertag zurückgesetzt.
- Sichtbare Haltestellen mit Dach, Sitzbank, Glasflächen und Haltestellenschild in vier Stadtteilen.
- Der Windows-Workflow baut Installer und portable EXE automatisch.

## Teststatus
- GitHub Actions Windows-Build für Version 0.2.9 erfolgreich (Installer und portable Ausgabe erstellt).
- Version 0.3.0 wird nach dem Commit erneut durch den Windows-Build geprüft.
- Ein echter Laufzeittest auf einer GT 555M ist nicht möglich, solange das Spiel nicht auf dem betreffenden Laptop ausgeführt wird.


## Version 0.3.1 – Fahrzeugschäden & Werkstatt
- Mehrstufiges Schadensmodell mit sichtbaren Kratzern, Seitendellen, verformten Stoßfängern, beschädigter Frontbeleuchtung und Scheibenrissen.
- Stärkere Schäden wirken sich auf die Fahrleistung aus.
- Fahrzeugschäden bleiben im lokalen Spielstand gespeichert und werden beim erneuten Bereitstellen des Autos wiederhergestellt.
- Im TUNINGWERK können Unfallschäden gegen Geld repariert werden.
- Schadensanzeige zeigt Fahrzeugzustand und geschätzte Reparaturkosten.

Hinweis: Das ist ein stilisiertes Low-Poly-Schadensmodell, keine realistische Karosserie-Verformung auf Bauteilebene. Die neue Version ist noch nicht auf der GT 555M des Spielers getestet.


## Version 0.3.2 – Performance-Update für ältere Grafikkarten
- Live-FPS-Anzeige direkt im Spiel.
- Dynamische Auflösungsskalierung: Bei dauerhaft niedriger Bildrate reduziert das Spiel automatisch die Render-Auflösung.
- Manuelle Änderung der Grafikqualität setzt die automatische Skalierung zurück.
- Ziel: ältere GPUs wie die NVIDIA GeForce GT 555M besser abzufedern. Das ist eine adaptive Maßnahme, keine Garantie für eine bestimmte FPS-Zahl.

## Teststatus 0.3.2
- Quellcode und Windows-Build werden durch GitHub Actions geprüft.
- Der echte Laufzeittest auf der GT 555M steht weiterhin aus.


## Version 0.3.3 – Tankstelle & Tanken
- Drei sichtbare Zapfsäulen an der Tankstelle MAIN.
- Mit dem Auto an die Zapfsäulen fahren, anhalten und **E** drücken, um bis zu 25 % Benzin zu tanken.
- Jede Tankfüllung kostet 2,20 € pro Prozent; Geld, Tankfüllung und Kontostand werden direkt aktualisiert und gespeichert.
- Tanken funktioniert nur im Auto und im Stillstand; bei zu wenig Geld oder vollem Tank erscheint eine Meldung.


## Version 0.3.4 – Überarbeitete Fahrzeugmodelle
- Mehr Karosserie-Details und Fensterrahmen an allen Fahrzeugklassen.
- Limousine und Sportback erhalten eigene Front-/Heckdetails.
- Coupé bekommt ein ausgearbeitetes Heck, Transporter zusätzliche Seiten- und Laderaumdetails.
- Supersportwagen erhält zusätzliche Lufteinlässe und Diffusor-Details.
- Ergänzte Radlauf-Akzente für einen plastischeren Look.


### Fahrzeugmodelle 0.3.5
- Durchsichtiger gestaltete Scheiben und sichtbarer Innenraum mit Vorder- und Rücksitzen, Kopfstützen und Türverkleidungen.
- Armaturenbrett mit Display, Mittelkonsole, Schalthebel und Lenkrad.
- Initialisierung der Scheinwerfer-Referenzen vor ihrer Verwendung korrigiert.


### Ego-Perspektive 0.3.6
- Neue Fahrer-Kamera direkt im Cockpit hinter dem Lenkrad.
- Über Kamera-Einstellungen oder mit C durch Verfolger, Nahansicht, Motorhaube und Ego-Perspektive wechseln.


### Fahrphysik 0.3.7
- Zeitbasierte Beschleunigung und sanfter Rollwiderstand.
- Stärker abgestuftes Bremsen, Rückwärtsgang und geschwindigkeitsabhängige Lenkung.
- Handbremse mit Taste Leertaste für engere Kurven.
- Weiterhin spielinterne Arcade-Physik, keine echte Fahrzeugsimulation.


### Fahrverhalten und Schäden 0.3.8
- Seitlicher Reifenschlupf bei höherem Tempo und stärkerem Lenken.
- Handbremse verstärkt das Ausbrechen des Hecks und ermöglicht Drifts.
- Fortschreitende optische Schäden: versetzte Stoßfänger, Dellen, Kratzer, Risse, beschädigte Scheinwerfer und Rauch bei schweren Schäden.
- Weiterhin vereinfachte Arcade-Physik; Reifen-, Federungs- und echte Crashsimulation sind nicht enthalten.

### Version 0.3.9 – Fahrphysik- und Schadens-Update
- Überarbeitete Fahrphysik mit stärker differenziertem Antrieb, Betriebsbremse und Rollwiderstand.
- Regen und Nebel reduzieren die Reifenhaftung; beschädigte Fahrzeuge verlieren zusätzlich Grip und Höchstgeschwindigkeit.
- Lenkreaktion und seitlicher Reifenschlupf reagieren stärker auf Tempo, Fahrbahnzustand und Handbremse.
- Kollisionen unterscheiden leichte und stärkere Aufpralle; stärkere Treffer verursachen mehr Fahrzeugschaden und beeinflussen die Fahrstabilität.
- Weiterhin eine Arcade-/Prototyp-Physik, keine vollständige Reifen-, Federungs- oder Crashsimulation.


## Version 0.4.0 – Grafik & App-Design
- Neues Frankfurt-Life-App-Logo in der Spieloberfläche und auf der Website.
- Grafikprofile von Minimal bis Maximal mit stark reduzierter Render-Auflösung, kürzerer Sichtweite und deaktivierten Schatten im Sparmodus.
- Einstellungen sind direkt im Windows-Spiel über die Schaltfläche **Einstellungen** oder **F1 → Einstellungen** erreichbar.
- Grafik, FPS-Limit, Maus-Empfindlichkeit, Sichtfeld und Kameraperspektive werden lokal gespeichert.
- Die Logo-Dateien werden beim Windows-Build mit in die App aufgenommen.

Hinweis: Die Grafikprofile reduzieren vor allem die GPU-Last. Die tatsächliche Bildrate hängt weiterhin von CPU, GPU und Treibern ab.


## Version 0.4.1 – Flughafen & Busverkehr
- Neues Flughafenareal am Stadtrand mit Terminal, Vorfeld und geparktem Passagierflugzeug.
- Drei fahrende Stadtbusse auf einer vereinfachten Nord-Süd-Linie.
- Flughafen-Haltestelle und Flughafen-Express im ÖPNV-Menü.
- Hinweis: Flugzeug ist zunächst ein statisches 3D-Modell; Busse fahren auf einer einfachen Schleifenroute. Keine realistische Flug- oder Fahrplan-Simulation.


## Version 0.4.2 – Verkehr & Taxi
- Neue Taxi-App im Smartphone: Taxi kann zum aktuellen Standort bestellt werden und fährt im Spiel heran.
- Ergänzte deutsche Verkehrsbeschilderung mit Stoppschild, Vorfahrt-achten, Tempo-30 und Fußgängerhinweisen.
- Busse fahren weiterhin auf einer vereinfachten Route; ÖPNV-App bietet die Flughafenverbindung.
- Flugzeuge bleiben für eine spätere zivile Piloten-/Rundflugmission vorgesehen; keine Flugzeug-Übernahmefunktion.
- Fahrzeuge werden nicht durch reale Diebstahlmethoden zugänglich gemacht.


## Version 0.4.3 – Smartphone-Redesign & Quick Access
- Smartphone mit 3D-Öffnungsanimation, verfeinerter Glas-/Dock-Optik und dynamischer Uhrzeit sowie Datum.
- App-Icons mit überarbeiteten Glanz-, Hover- und Touch-Effekten.
- Neues animiertes Quick-Access-Rad über **Q** mit Handy, Karte, Taschenlampe und Kamera-Perspektive.
- Das Rad enthält ausschließlich harmlose Komfortfunktionen; keine Waffenfunktion.


## Version 0.4.4 – Cinematisches Einführungs-Tutorial
- Beim ersten Spielstart beginnt ein vierteiliges Intro mit filmischen Balken, Kapitelkarten, Übergängen und Fortschrittsanzeige.
- Erklärt Bewegung, Umsehen, Ein-/Aussteigen, Jobs, Kameraperspektiven, Smartphone und Quick-Access-Rad.
- Das Tutorial kann jederzeit übersprungen werden und wird nach Abschluss lokal als gesehen markiert.
- Der Einstieg ist eine inszenierte Einführung über der 3D-Stadt; keine vorgerenderten Filmsequenzen.


## Version 0.4.5 – Helikopter & Action Edition
- Neues Low-Poly-Helikoptermodell am Flughafen mit animiertem Haupt- und Heckrotor sowie markiertem Helipad.
- Separate Frankfurt Life Action Edition mit eigener Windows-App-Kennung und eigenem Launcher.
- Action Edition verwendet eine dunklere, kontrastreichere Atmosphäre für Verfolgungs- und Action-Missionen; keine grafischen Blut- oder Gore-Effekte.
- Website-Downloadbereich auf Version 0.4.5 aktualisiert und um beide Editionen erweitert.
- Windows-Workflow baut Installer und portable Version für beide Editionen. Downloads sind erst verfügbar, wenn der Workflow erfolgreich abgeschlossen und die Release-Dateien veröffentlicht wurden.


## Version 0.4.6 – Flugmissionen & Fahrzeug-Interaktionen
- Das Passagierflugzeug am Flughafen kann in einem vereinfachten Arcade-Flugmodus bewegt werden.
- Flugsteuerung: W/S für Tempo, A/D für Richtung, Leertaste zum Steigen, Shift zum Sinken, F zum Beenden. Dies ist eine abstrakte Spielsteuerung, keine reale Flugausbildung.
- Während einer Flugmission erscheinen zwei stilisierte Begleitflugzeuge als geskriptete militärische Verfolgungs-/Begleitsequenz. Keine Waffen oder taktischen Ausweichmechaniken.
- Mit G kann in Reichweite ein vorbeifahrendes NPC-Fahrzeug über eine kurze, abstrakte Interaktion übernommen werden. Es werden keine realen Einbruchstechniken simuliert.
- Die übernommenen Fahrzeuge verwenden das vorhandene Fahr- und Kamerasystem.


## Version 0.4.7 – Küste, Strand und Motorboote
- Neues, frei erfundenes Küstengebiet südlich der Stadt mit Sandstrand, Wasserfläche, Palmen und Sonnenschirmen.
- Drei einfache Motorboote können am Ufer mit **F** betreten und verlassen werden.
- Arcade-Steuerung auf dem Wasser: **W/S** beschleunigen/bremsen, **A/D** lenken; Kamera folgt dem Boot.
- Wasseroberfläche und kleine Uferwellen bewegen sich dezent.
- Die Fahrzeug-Interaktion erhält einen kurzen, nicht-grafischen Filmschnitt: Die NPC-Figur steigt aus und tritt zur Seite. Keine Gewaltdarstellung.
- Das Küstengebiet ist ein bewusst fiktiver Zusatz und keine geografisch realistische Darstellung Frankfurts.

Hinweis: Boote und Wasser sind einfache 3D-Prototypen ohne realistische Wasserphysik. Die Filmszene ist eine abstrahierte Animation.


## Version 0.4.8 – NPC-, Karten- und Shop-Politur
- NPCs mit differenzierten Gesichtern, Haaren, Hauttönen, Kleidung, Schuhen und kleinen Accessoires.
- Geh-Animationen für Arme und Beine über stabile Modell-Referenzen.
- Fehler behoben: Die Karten-Zeichenfunktion verwendete die Koordinatenfunktionen vor ihrer Initialisierung und konnte beim Minimap-Update einen JavaScript-Fehler auslösen.
- Kartenmaßstab und Stadtgrößenanzeige angepasst; Küstenbereich auf der Karte sichtbar.
- Bodenfläche endet vor der offenen Wasserfläche, damit das Wasser nicht vom Stadtboden überdeckt wird.
- Shop-Menü bietet eine kurze, abstrakte, nicht-grafische Filmszene mit Licht- und Kameraschnitten.
- Schließen des Shop-Menüs setzt den aktuellen Shop korrekt zurück.

Hinweis: NPCs bleiben stilisierte Low-Poly-Figuren. Die Shop-Sequenz ist eine kurze UI-Cutscene und keine voll animierte Raubsimulation.


## Version 0.4.9 – Performance, Legacy-Laptop und Android
- Neues Laptop-Sparprofil: stark reduzierte Render-Auflösung, kurze Sichtweite, keine Echtzeit-Schatten und vereinfachte Gebäude.
- Im Sparprofil werden dekorative Stadtobjekte, Verkehr, Fußgänger und Haltestellen reduziert, damit ältere integrierte Grafikeinheiten weniger Arbeit haben.
- Automatische Render-Skalierung greift früher und kann die Pixelauflösung weiter absenken.
- Separate Windows-Legacy-Ausgabe mit eigenem Startprogramm und reduzierter Stadtdarstellung.
- Android-Unterstützung als installierbare Web-App (PWA) mit Touch-Steuerkreuz und Aktionsbuttons.
- Die Android-Version wird über Chrome geöffnet und über „Zum Startbildschirm hinzufügen“ installiert; sie ist kein nativer Play-Store-APK.
- Der Browser-/PWA-Build benötigt beim ersten Start eine Internetverbindung für Three.js.

Hinweis zum Teststatus: Der Windows-Build kann automatisiert gebaut werden; das beweist noch nicht, dass das Spiel auf jedem älteren Laptop startet oder dort eine bestimmte FPS-Zahl erreicht. Ein echter Test auf dem betroffenen Gerät ist weiterhin nötig.



## Fahrzeug-Detailpass – Unterboden, Fahrwerk und Motorcharakter

- Zwei weitere Fahrzeugformen sind im Händler verfügbar: ein Executive-Kombi mit verlängerter Dach-/Hecklinie und ein Pickup mit separater offener Ladefläche.
- Die prozeduralen 3D-Fahrzeuge erhalten zusätzliche Unterboden-Bauteile: Motor-/Getriebebereich, Tunnel, Differential, Hitzeschutzbleche, Auspuffrohre und Schalldämpfer.
- Sichtbare Fahrwerksdetails ergänzen Federbeine, Schraubenfedern, Querlenker und Verbindungen an allen vier Radpositionen. Die Feder-/Dämpferdarstellung bewegt sich beim Fahren leicht mit der Geschwindigkeit.
- Das TUNINGWERK bietet zusätzlich ein Gewindefahrwerk in drei Stufen. Die Stufe wird lokal gespeichert und wirkt sich im Arcade-Fahrmodell leicht auf den Grip aus.
- Motor-Upgrades und Turbo bleiben verfügbar. Die synthetische Audio-Schicht erhält je Fahrzeugklasse unterschiedliche Leerlaufbereiche, Drehzahlverläufe, Klangwellenformen und Filtercharakteristik.
- Wichtig: Das sind prozedural aufgebaute Spielmodelle und synthetisch erzeugte Sounds, keine hochauflösenden Hersteller-Scans oder echten Motoraufnahmen. Die Fahrwerksbewegung ist eine visuelle Animation; es gibt noch keine echte Radaufhängungs-, Dämpfer-, Reifen- oder Mehrkörperphysik. Die Arcade-Fahrphysik wurde nicht durch eine vollständige Simulation ersetzt.
- Der neue Stand wurde in GitHub gespeichert, aber hier nicht im Browser gestartet oder auf verschiedenen Geräten getestet.

## Native Unreal Engine projects (in development)

Two separate Unreal starter projects now live under [Unreal/](Unreal/):

- [Realistic Edition – Unreal Engine 5.4](Unreal/Realistic/FrankfurtLifeRealistic.uproject) for newer gaming PCs/laptops.
- [San Andreas Edition – Unreal Engine 4.27](Unreal/SanAndreas/FrankfurtLifeSanAndreas.uproject) for a lighter retro-styled target.

These are **project scaffolds only**, not finished playable Unreal games. The existing browser/Electron game remains the playable prototype. The Unreal editions still need the city world, art assets, player/vehicle systems, missions, cutscenes, audio, packaging and hardware testing.
