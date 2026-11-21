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
