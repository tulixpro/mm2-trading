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
