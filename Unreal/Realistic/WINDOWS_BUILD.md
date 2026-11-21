# Windows build for the Unreal Engine version

The Unreal game is built separately from the Electron/browser preview. The workflow `.github/workflows/unreal-windows-build.yml` packages the Realistic Edition as a Win64 Shipping build.

## Required build machine

GitHub-hosted Windows runners do not include Unreal Engine. This workflow therefore requires a Windows self-hosted GitHub Actions runner with:

- Unreal Engine **5.8** installed and licensed through the Epic Games Launcher or an approved source-build setup.
- Visual Studio 2022 with the Desktop development with C++ workload and the MSVC toolchain required by UE 5.8.
- Windows 10/11 SDK supported by that Unreal installation.
- The repository checked out by the GitHub Actions runner.

Register the runner in the repository's **Settings → Actions → Runners** and add the custom label `unreal-5.8`. Set the runner machine environment variable `UE_ROOT` to the Unreal Engine installation directory (for example, `C:\Program Files\Epic Games\UE_5.8`). Restart the runner service after changing environment variables.

## Start a build

After the runner is online, open **Actions → Build Unreal Engine 5.8 Windows game → Run workflow**. A successful run uploads the staged Windows package as the artifact `Frankfurt-Life-Unreal-Realistic-Windows-x64`. The artifact contains the packaged game folder and executable.

A failed run must be treated as a failed build; do not distribute a partial artifact. This repository change only adds the packaging workflow. It does not install Unreal Engine on a runner, run the workflow, or produce an executable by itself.

## Current limitations

This packages the current C++ prototype, not a completed commercial open-world game. The project still needs production city/vehicle assets, Chaos vehicle physics, NPC and traffic AI, missions/jobs, UI, save system, audio, optimization and play-testing. The current vehicle movement is an arcade pawn prototype, not a full vehicle simulation. The workflow must successfully compile, cook, package and verify an executable before any Windows download can be called ready.
