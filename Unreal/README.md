# Frankfurt Life – native Unreal projects

This folder contains the initial native Unreal Engine project scaffolds. They are separate from the existing Three.js/Electron prototype.

## Projects

- `Realistic/FrankfurtLifeRealistic.uproject`: Unreal Engine **5.4**, intended for newer gaming laptops/PCs.
- `SanAndreas/FrankfurtLifeSanAndreas.uproject`: Unreal Engine **4.27**, intended as a lower-cost retro edition for older laptops.

## Important status

These are starter projects, not finished games. They do not yet contain the Frankfurt map, vehicle assets, character models, missions, cutscenes, or packaged installers. They must be opened with the matching Unreal Engine version, compiled, and tested on real hardware.

## Design targets

### Realistic Edition (UE 5.4)
- High-detail urban environment, physically based materials, modern lighting.
- Lumen is enabled as the high-end lighting path; scalability profiles must be tested and tuned.
- Target hardware: modern dedicated GPU, 16–32 GB RAM recommended for development.

### San Andreas Edition (UE 4.27)
- Retro-inspired art direction, simpler materials and geometry, smaller texture budgets.
- DirectX 11 / scalable rendering path; no Lumen or Nanite.
- Lower shadow quality, shorter view distance, reduced effects by default.
- UE 4.27 is an older toolchain and may not support every current GPU/driver combination. Compatibility needs testing.

## Build workflow

1. Install the exact engine version from Epic Games Launcher.
2. Install Visual Studio with the matching C++ desktop/game development components.
3. Right-click the `.uproject` and generate project files if prompted.
4. Build the Editor target in Development Editor / Win64.
5. Open the project, then add the actual world, assets, gameplay, audio and UI.
6. Package Development builds first; only publish after playtesting and profiling.

The existing browser game remains available while these native projects are developed.
