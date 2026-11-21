# Frankfurt Life – native Unreal projects

Two separate native Unreal Engine starter projects are maintained alongside the existing Three.js/Electron prototype.

## Editions

- **Realistic:** Unreal Engine 5.4 – `Realistic/FrankfurtLifeRealistic.uproject`, intended for newer gaming PCs/laptops.
- **San Andreas:** Unreal Engine 4.27 – `SanAndreas/FrankfurtLifeSanAndreas.uproject`, retro-inspired visual direction and lower-cost rendering target.

## Implemented starter functionality

Both projects now include:
- Native C++ first-person character with camera and basic walking/jumping
- Keyboard/mouse input mappings (WASD, mouse look, Space)
- Dedicated GameMode selecting the native player character
- Separate engine and input configuration per edition

## Honest project status

**These are early playable-code foundations, not finished open-world games.** They do not yet include a finished Frankfurt map, authored buildings/interiors, vehicle driving, NPC AI, mission system, cutscenes, audio, save system, UI, or packaged installers. The new C++ projects have not yet been compiled in Unreal Editor in this environment. Build compatibility must be confirmed with the exact engine version and Visual Studio toolchain.

The existing browser game remains available:
- Modern/browser: https://tulixpro.github.io/mm2-trading/game.html
- San Andreas browser preset: https://tulixpro.github.io/mm2-trading/game.html?edition=sanandreas

## Open and build

1. Install the matching engine version from Epic Games Launcher (UE 5.4 for Realistic; UE 4.27 for San Andreas).
2. Install Visual Studio with the C++ game-development workload and the Windows SDK.
3. Open the matching `.uproject` file and allow Unreal to generate project files.
4. Build the Development Editor target, then open the editor.
5. Create a level and set up lighting, landscape, roads, buildings and a PlayerStart before packaging.

## Performance direction

### Realistic (UE 5.4)
- High-detail PBR assets and modern lighting are the target.
- Lumen/Nanite should be profiled and offered as optional high-end settings, not assumed to run well on every laptop.
- Target audience: recent dedicated-GPU gaming laptops/PCs.

### San Andreas (UE 4.27)
- Retro-inspired art direction, simplified geometry and materials, smaller texture budgets.
- DirectX 11-friendly rendering target, no Lumen/Nanite.
- Shorter view distance, restrained shadows and effects by default.
- UE 4.27 is an older toolchain; modern OS/GPU driver compatibility still requires testing.

## Hardware notes

Requirements below are planning targets, not validated minimum specifications. Final requirements must be based on packaged builds and tests on real devices.

| Edition | Provisional minimum target | Recommended target |
|---|---|---|
| San Andreas UE 4.27 | 8 GB RAM, quad-core CPU, DX11-capable GPU with 2 GB VRAM | 16 GB RAM, 4+ CPU cores, dedicated GPU with 4 GB VRAM, SSD |
| Realistic UE 5.4 | 16 GB RAM, 6-core CPU, DX12-capable dedicated GPU with 6 GB VRAM | 32 GB RAM, 8-core CPU, dedicated GPU with 8+ GB VRAM, SSD |

These are internal targets only and are not yet confirmed by performance tests. UE4.27 does not guarantee support for every very old laptop; an integrated GPU may still be below the target.

## Next production milestones

1. Create and profile a compact vertical-slice level in each engine.
2. Build modular Frankfurt streets, landmarks and interiors.
3. Add drivable vehicles and traffic.
4. Add NPC schedules, jobs, missions and cinematic sequences.
5. Add save/load, audio, settings and accessibility.
6. Test packaged builds on low-, mid- and high-spec hardware before publishing installers.
