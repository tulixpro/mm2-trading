# Unreal Realistic Edition – C++ vehicle prototype

This project is being developed as the Unreal Engine primary game. The browser build is a separate preview and is not the source of the Unreal game.

## Current C++ vehicle interaction prototype

- Walk up to one of the placeholder vehicle actors.
- Aim at the vehicle and press **E** (or the gamepad right face button) to enter.
- **W/S** move forward and backward, **A/D** steer, mouse controls the view.
- Press **E** again to exit beside the vehicle.
- The current vehicle pawn uses Unreal's `UFloatingPawnMovement` for an arcade-style code prototype. It is **not** yet a production Chaos Vehicle setup: the current meshes are primitive blockout parts, with no wheel suspension, tire friction, skeletal vehicle mesh, engine/transmission simulation, or finished vehicle audio.

## Unreal editor setup

1. Open `FrankfurtLifeRealistic.uproject` with Unreal Engine 5.8.
2. Allow Unreal to generate project files and compile the C++ module.
3. Open the Realistic map/project startup level and press Play.
4. If the editor reports a compile error, resolve it in the C++ module before packaging.

## Remaining work before a releasable game

- Replace primitive city and vehicle blockouts with authored, optimized assets and materials.
- Build Chaos Vehicle skeletal meshes, wheel bones, physics assets, suspension and handling data.
- Implement traffic and pedestrian AI, police behavior, job systems, shops, save/load and UI.
- Add audio, animation, accessibility, settings and controller remapping.
- Build and test multiplayer/voice separately; neither is implemented by this prototype.
- Profile performance and package/test Windows builds on supported hardware.

The source changes have not been compiled or play-tested in Unreal in this environment. No finished Windows executable is included by this note.
