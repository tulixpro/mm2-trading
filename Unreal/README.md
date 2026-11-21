# Frankfurt Life – native Unreal projects

Two native Unreal Engine starter projects are maintained alongside the existing Three.js/Electron prototype.

## Editions

- **Realistic:** Unreal Engine 5.9 Preview (Realistic/FrankfurtLifeRealistic.uproject). This is a preview-engine target, not a stable production baseline.
- **San Andreas:** Unreal Engine 4.27 (SanAndreas/FrankfurtLifeSanAndreas.uproject), with a retro-inspired art direction and lower-cost rendering target.

## Implemented in the realistic project

- Native C++ first-person character and keyboard/mouse movement
- Dedicated GameMode
- Runtime-generated greybox district: road grid, sidewalk strips, placeholder building masses and simple tree shapes
- Lumen, virtual shadow maps, anti-aliasing and texture streaming configuration

**Important:** The generated district is a blockout made from Unreal's basic primitive meshes. It is not yet a realistic, finished Frankfurt environment. The trees are placeholders, not photorealistic foliage. Replace them with authored tree meshes, PBR materials, decals, street furniture and detailed lighting during the art pass.

## Honest project status

This is still an early development prototype, not a finished open-world game. There is no authored Frankfurt landmark set, finished landscape, drivable vehicle system, traffic, NPC AI, jobs, missions, interiors, multiplayer, voice chat, save system, final UI, audio package or installer. The Unreal C++ project has **not** been compiled or launched in this environment. Compatibility with the exact UE 5.9 Preview build and Visual Studio toolchain must be confirmed locally.

## Open and build

1. Install the UE 5.9 Preview build from the Epic Games Launcher.
2. Install Visual Studio with the C++ game-development workload and a compatible Windows SDK.
3. Open Realistic/FrankfurtLifeRealistic.uproject, regenerate project files if prompted, and build the Development Editor target.
4. Open an empty level and press Play. The GameMode spawns the temporary greybox district automatically.
5. Replace the greybox with authored modular assets, then profile a packaged build.

## Performance direction

### Realistic (UE 5.9 Preview)
- High-detail PBR assets and modern lighting are the target.
- Lumen and Nanite should be profiled and offered as optional quality settings.
- Target audience: recent dedicated-GPU gaming PCs/laptops.
- Preview builds can contain regressions; do not use this as a shipping baseline without migration and validation.

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
| Realistic UE 5.9 Preview | 16 GB RAM, 6-core CPU, DX12-capable dedicated GPU with 6 GB VRAM | 32 GB RAM, 8-core CPU, dedicated GPU with 8+ GB VRAM, SSD |

These are internal targets, not tested requirements. UE4.27 does not guarantee support for every very old laptop; an integrated GPU may still be below target.

## Next production milestones

1. Compile and launch both projects in their exact engine versions.
2. Replace the greybox with realistic modular Frankfurt streets, architecture, trees and interiors.
3. Add drivable vehicles and safe traffic/pedestrian AI.
4. Add jobs, missions, save/load, audio and UI.
5. Profile packaged builds on low-, mid- and high-spec hardware before publishing installers.

## Existing browser prototype

- Modern/browser: https://tulixpro.github.io/mm2-trading/game.html
- San Andreas browser preset: https://tulixpro.github.io/mm2-trading/game.html?edition=sanandreas
