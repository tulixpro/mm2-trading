# Frankfurt Life – native Unreal projects

Two native Unreal Engine projects are maintained alongside the existing Three.js/Electron prototype.

## Editions

- **Realistic:** Unreal Engine **5.8** (Realistic/FrankfurtLifeRealistic.uproject), selected as the stable development baseline.
- **San Andreas:** Unreal Engine 4.27 (SanAndreas/FrankfurtLifeSanAndreas.uproject), with a retro-inspired art direction and lower-cost rendering target.

## Implemented in the realistic project

- Native C++ first-person character and keyboard/mouse movement
- Dedicated GameMode
- Runtime-generated greybox district: nine city blocks, road grid, sidewalk strips, facade/window rhythm, shopfront placeholders, streetlights and simple tree shapes
- Primitive-mesh vehicle silhouettes: sedan, van and police-car display props placed along the roads (not drivable)
- Lumen, virtual shadow maps, Nanite project support, anti-aliasing and texture-streaming configuration
- Sky-atmosphere and volumetric-fog project support

## Graphics status – important

The district currently uses Unreal's basic primitive meshes. It is a **greybox/blockout**, not a photorealistic Frankfurt city. The tree shapes are placeholders, not realistic foliage. Renderer settings enable modern UE5 features, but they do not create detailed art assets by themselves. A finished visual pass still needs modular architecture, tree/foliage meshes, PBR materials, road markings, decals, street furniture, authored lighting, sky/cloud actors and a designed level.

## Honest project status

This is an early development prototype, not a finished open-world game. There is no authored Frankfurt landmark set, finished landscape, drivable vehicle physics, traffic AI, NPC AI, jobs, missions, interiors, multiplayer, voice chat, save system, final UI, audio package or installer. The current sedan/van/police-car shapes are static visual blockout props built from engine primitives; they are not production vehicle assets. The Unreal C++ project has **not** been compiled or launched in this environment. Compatibility with UE 5.8 and the Visual Studio toolchain must be confirmed locally.

## Open and build

1. Install Unreal Engine 5.8 from the Epic Games Launcher.
2. Install Visual Studio with the C++ game-development workload and a compatible Windows SDK.
3. Open the Realistic/FrankfurtLifeRealistic.uproject file, regenerate project files if prompted, and build the Development Editor target.
4. Open a level and press Play. The GameMode spawns the temporary greybox district.
5. Replace the greybox with authored modular assets, then profile a packaged build.

## Performance direction

### Realistic (UE 5.8)
- High-detail PBR assets and modern lighting are the target.
- Lumen and Nanite should be profiled and offered as optional quality settings.
- Target audience: recent dedicated-GPU gaming PCs/laptops.
- High-end lighting settings may need to be reduced on mid-range devices.

### San Andreas (UE 4.27)
- Retro-inspired art direction, simplified geometry and materials, smaller texture budgets.
- DirectX 11-friendly rendering target, no Lumen/Nanite.
- Shorter view distance, restrained shadows and effects by default.
- UE 4.27 is an older toolchain; modern OS/GPU driver compatibility still requires testing.

## Hardware notes

The following are planning targets only, not validated minimum specifications. Final requirements must come from packaged-build tests on real devices.

| Edition | Provisional minimum target | Recommended target |
|---|---|---|
| San Andreas UE 4.27 | 8 GB RAM, quad-core CPU, DX11-capable GPU with 2 GB VRAM | 16 GB RAM, 4+ CPU cores, dedicated GPU with 4 GB VRAM, SSD |
| Realistic UE 5.8 | 16 GB RAM, 6-core CPU, DX12-capable dedicated GPU with 6 GB VRAM | 32 GB RAM, 8-core CPU, dedicated GPU with 8+ GB VRAM, SSD |

These are internal targets, not tested requirements. UE4.27 does not guarantee support for every very old laptop; an integrated GPU may still be below target.

## Next production milestones

1. Compile and launch both projects in their exact engine versions.
2. Replace the greybox with realistic modular Frankfurt streets, architecture, trees and interiors.
3. Replace the vehicle silhouettes with licensed/high-quality vehicle meshes, PBR materials, interiors, wheels and lights; then implement Chaos vehicle physics and safe traffic/pedestrian AI.
4. Add jobs, missions, save/load, audio and UI.
5. Profile packaged builds on low-, mid- and high-spec hardware before publishing installers.

## Existing browser prototype

- Modern/browser: https://tulixpro.github.io/mm2-trading/game.html
- San Andreas browser preset: https://tulixpro.github.io/mm2-trading/game.html?edition=sanandreas


### Realistic Edition: startup overlay

The Realistic Edition now assigns `AFLRealisticHUD` as its HUD. It draws a short branded startup overlay (title, edition label, status text, progress-style bar, fade-in/fade-out) for the first 4.5 seconds after the world begins. This is an in-game intro overlay, not the engine's pre-map MoviePlayer loading screen and not a measured asset-loading percentage. The C++ source has not yet been compiled or tested in Unreal Editor.
