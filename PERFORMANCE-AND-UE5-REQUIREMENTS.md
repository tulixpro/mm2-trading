# Frankfurt Life – Performance und Hardware-Zielwerte

Stand: 21.11.2026

## Aktueller Browser-/Electron-Prototyp

Die folgenden Werte sind vorläufige Zielwerte, keine auf einer großen Geräteflotte bestätigten Garantien.

### Vorläufige Mindestanforderungen
- Windows 10/11, 64-Bit
- Aktueller Browser mit WebGL 2 oder die Electron-Windows-App
- 4 CPU-Threads
- 8 GB Arbeitsspeicher
- Grafik mit WebGL-2-Unterstützung und aktuellen Treibern
- Für kürzere Ladezeiten: SSD empfohlen

### Empfohlene Anforderungen
- Windows 11, 64-Bit
- 6 CPU-Kerne oder mehr
- 16 GB Arbeitsspeicher
- Dedizierte Grafikkarte mit 4 GB VRAM oder mehr
- SSD

Die tatsächliche Bildrate hängt unter anderem von GPU, Auflösung, Treibern, Temperatur und Hintergrundprogrammen ab. Diese Werte müssen durch Tests auf echten Geräten bestätigt werden.

## Unreal-Engine-5-Ausgabe – noch nicht implementiert

Der aktuelle Stand ist ein Three.js-Spiel im Browser/Electron. Es wurde noch nicht in Unreal Engine 5 portiert und es gibt noch keinen UE5-Installer. Eine UE5-Version benötigt ein separates natives Projekt, neu aufgebaute Stadt-Assets, Gameplay-Systeme, Animationen, Audio und eigene Build-/Performance-Tests.

Epic nennt für die Entwicklung mit dem UE5-Editor als empfohlene Hardware unter anderem Windows 11, einen Quad-Core-Prozessor mit mindestens 2,5 GHz, 32 GB RAM und eine DirectX-12-Grafikkarte mit mindestens 8 GB Grafikspeicher. Das sind Editor-/Entwicklungswerte und keine automatisch gültigen Mindestanforderungen für ein fertiges Spiel.

Lumen benötigt laut Epic eine kompatible DirectX-12-GPU aus mindestens einer NVIDIA-RTX-2000-, AMD-RX-6000- oder Intel-Arc-A-Serie. Deshalb sollte eine spätere UE5-Version getrennte Grafikprofile bekommen:
- Leistung: skalierte Beleuchtung, reduzierte Sichtweite und Effekte, kein Hardware-Raytracing
- Hoch: höhere Auflösung, mehr Details und bessere Schatten
- Kino: Lumen und anspruchsvolle Effekte auf geeigneter Hardware

## Performance-Arbeit im Browser-Prototyp

- Render-Schleife wird im Hintergrund-Tab angehalten und beim Zurückkehren neu gestartet.
- Dynamische Render-Skalierung reagiert nicht mehr fälschlich auf ein absichtlich eingestelltes 30-FPS-Limit.
- Die Skalierung kann bei hoher Last weiter abgesenkt werden.
- Geräte mit höchstens vier CPU-Threads oder höchstens 4 GB gemeldetem RAM starten mit sparsamem Grafikprofil und 30-FPS-Ziel.

## Noch notwendige Qualitätssicherung

Vor einer verbindlichen Anforderungsliste müssen Startzeit, durchschnittliche FPS, 1%-Lows, Speicherverbrauch und Temperatur auf mehreren realen Laptops geprüft werden. Es werden keine FPS- oder Kompatibilitätsgarantien ohne solche Messungen angegeben.
