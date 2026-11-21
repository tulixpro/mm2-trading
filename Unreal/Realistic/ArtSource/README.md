# Procedural vehicle art source (Unreal Engine 5.8)

This folder contains a Blender Python generator for three generic, unbranded vehicle meshes:
- modern sedan
- city van
- police sedan

## Generate the FBX files

1. Install Blender 3.6 or newer.
2. Open generate_vehicles.py in Blender's Scripting workspace.
3. Run the script. It creates Vehicles_Export beside the script and exports three FBX files.
4. In Unreal Engine, import the FBX files into Content/Vehicles.
5. Check scale, materials, collision, and LODs in the Static Mesh Editor. The exports are visual meshes, not drivable physics vehicles.

The generator creates separate body, glazing, lighting, trim, wheel, rim, seat, dashboard, and police-light components with procedural materials. The geometry is a detailed generic game-asset starting point, not a scan or a manufacturer-accurate replica. It has not been executed in Blender or imported/tested in Unreal in this repository session.

## Unreal integration

The current C++ showcase actor still creates its old primitive blockout. After importing the FBX assets, replace its BasicShapes construction with references to the imported Static Mesh assets (or create Blueprint vehicle actors using those meshes). For driving, add a skeletal vehicle mesh, wheel bones, a Physics Asset, and the Chaos Vehicles setup separately.

Epic's UE 5.8 documentation:
- https://dev.epicgames.com/documentation/en-us/unreal-engine/fbx-static-mesh-pipeline-in-unreal-engine
- https://dev.epicgames.com/documentation/en-us/unreal-engine/importing-static-meshes-in-unreal-engine
- https://dev.epicgames.com/documentation/en-us/unreal-engine/vehicle-art-setup-in-unreal-engine

The FBX pipeline supports material slots, texture maps, collision and LOD data. Vehicle gameplay additionally needs skeletal mesh/wheel setup and physics; these exports alone do not implement vehicle driving.
