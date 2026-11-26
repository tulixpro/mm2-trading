# Frankfurt Life – Performance und Hardware-Zielwerte

Stand: 26.11.2026

## Projektstatus

Frankfurt Life besitzt inzwischen zwei getrennte native Unreal-Projektgrundlagen neben dem älteren Three.js-/Electron-Prototyp:

- **Realistic:** Unreal Engine 5.8 unter `Unreal/Realistic/`
- **San Andreas:** Unreal Engine 4.27 unter `Unreal/SanAndreas/`

Die nativen Projekte enthalten C++-Grundlagen für Charakterbewegung, GameMode, prozedurale Greybox-Stadtumgebung und erste Fahrzeug-/Schadenssysteme. Das ist noch kein fertiges Open-World-Spiel. Insbesondere fehlen weiterhin produktionsreife Stadt- und Fahrzeug-Assets, vollständige Chaos-Fahrzeugphysik, Verkehr und NPC-KI, Missionen, Innenräume, Speichern/Laden, fertige Menüs, Audio und umfangreiche Spieltests.

Der Browser-/Electron-Prototyp ist ein separater Build und nicht mit den nativen Unreal-Projekten gleichzusetzen.

## Vorläufige Hardware-Zielwerte

Diese Werte sind Entwicklungsziele und keine bestätigten Mindestanforderungen. Erst Tests mit tatsächlich paketierten Builds auf mehreren Geräten können verbindliche Anforderungen liefern.

| Edition | Vorläufiges Minimum | Empfohlenes Ziel |
|---|---|---|
| San Andreas (UE 4.27) | 8 GB RAM, Quad-Core-CPU, DX11-GPU mit 2 GB VRAM | 16 GB RAM, 4+ CPU-Kerne, dedizierte GPU mit 4 GB VRAM, SSD |
| Realistic (UE 5.8) | 16 GB RAM, 6-Core-CPU, DX12-GPU mit 6 GB VRAM | 32 GB RAM, 8-Core-CPU, dedizierte GPU mit 8+ GB VRAM, SSD |

Die tatsächliche Leistung hängt unter anderem von GPU, CPU, Auflösung, Treibern, Temperatur und Hintergrundprogrammen ab. UE5-Editor-Anforderungen sind nicht automatisch identisch mit den Anforderungen eines späteren Spiels.

## Grafikprofile

### San Andreas – UE 4.27
- Retro-inspirierte Geometrie und Materialien
- Begrenzte Sichtweite und moderate Schatten
- Kleine Textur- und Speicherbudgets
- DirectX-11-orientiertes Ziel; keine Abhängigkeit von Lumen oder Nanite

### Realistic – UE 5.8
- Hochwertige PBR-Assets und moderne Beleuchtung als Ziel
- Lumen, Nanite und Virtual Shadow Maps nur nach Geräteprofil und Performance-Messung aktivieren
- Leistungsprofil mit reduzierter Sichtweite, Beleuchtung und Effekten
- Hoch-/Kino-Profil für leistungsfähige dedizierte GPUs

## Browser-/Electron-Prototyp

Der ältere Three.js-Prototyp besitzt eigene Grafik- und Performance-Logik. Seine Einstellungen und Messwerte sind nicht auf die Unreal-Builds übertragbar.

## Qualitätssicherung vor Veröffentlichung

Für beide nativen Editionen müssen vor einer Veröffentlichung mindestens folgende Punkte geprüft werden:

- C++-Build im passenden Unreal-Editor und mit passender Visual-Studio-Toolchain
- Paketierter Windows-Build startet auf einem sauberen Testsystem
- Startzeit, durchschnittliche FPS und 1%-Lows bei festgelegter Auflösung messen
- RAM- und VRAM-Verbrauch sowie längere Spielsessions prüfen
- Eingabe, Kamera, Kollisionen, Speichern/Laden und Absturzverhalten testen
- Mindest- und empfohlene Anforderungen erst anhand dieser Messungen festlegen

**Build-Status:** Die C++-Quellen wurden in dieser Arbeitsumgebung nicht mit Unreal Engine kompiliert oder im Editor gestartet. Daher wird kein erfolgreicher Unreal-Build und keine fertige Windows-EXE behauptet.
