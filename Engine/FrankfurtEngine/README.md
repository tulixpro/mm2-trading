# Frankfurt Engine

Frankfurt Engine is the project's own engine. It is **not based on Unreal Engine** and does not embed Unreal Engine code.

## Current foundation (0.1.0)

- C++20 application and main loop
- GLFW window and input polling
- OpenGL 3.3 Core rendering context
- Runtime shader compilation with error reporting
- Frame timing and resize-aware viewport
- CMake dependency setup for GLFW and GLAD

This first milestone is deliberately small: it proves that the project owns its application lifecycle and rendering entry point. It is not yet a realistic 3D engine and does not yet load the Frankfurt GLB model pack.

## Build

Requirements: CMake 3.24+, a C++20 compiler, Git, and graphics drivers supporting OpenGL 3.3.

```sh
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release
./build/frankfurt_engine
```

On Windows, run the executable from the generated build configuration directory (for example `build/Release/frankfurt_engine.exe`).

CMake downloads GLFW and GLAD at configure time, so the first configure needs an internet connection.

## Planned milestones

1. **Real 3D scene:** camera, transforms, depth buffer, mesh and GLB loading.
2. **Materials and lighting:** physically based materials, image textures, HDR environment lighting, shadow maps and tone mapping.
3. **World systems:** terrain, road/building placement, spatial partitioning and streamed city districts.
4. **Gameplay runtime:** input mapping, character controller, vehicle physics and collision.
5. **Tools:** scene editor, asset browser, import pipeline and profiling/debug overlays.

Realistic graphics require real assets, lighting, physically based materials and extensive testing; they cannot be achieved by changing a single graphics setting. Each milestone will be implemented and tested separately.

## Scope

The Unreal projects in `Unreal/` are separate legacy/experimental projects. The custom engine lives in this directory and is the intended independent technology base for future Frankfurt Life development.
