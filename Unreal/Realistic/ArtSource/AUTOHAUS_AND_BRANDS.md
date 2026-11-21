# Frankfurt Life: fictional car brands and Autohaus

Two additional Blender generators are provided:

- `generate_fictional_brands.py`: six original fictional marques and vehicle FBX exports.
- `generate_autohaus.py`: a showroom, glass frontage, reception, three workshop bays, lifts, tool cabinets, waiting area and forecourt.

## Fictional vehicle brands

The game uses original in-world brands rather than copying real manufacturers or logos:
- Auron — executive sedan
- Veltra — performance coupe
- Nordwerk — premium SUV
- RheinMobil — compact city car
- Stadtwerk — estate wagon
- CargoLine — delivery van

These are stylized modular 3D game-asset bases with body, glazing, wheels, trim and basic cabin pieces. They are not photorealistic manufacturer-accurate models or scanned vehicles.

## Generate and import

1. Run each script in Blender 3.6+.
2. Import the resulting FBX files into Unreal Engine:
   - `Brand_Vehicles_Export/*.fbx` to `Content/Vehicles/Brands`
   - `Dealership_Export/FL_Autohaus_Showroom.fbx` to `Content/Buildings/Autohaus`
3. Inspect scale, pivots, normals, material slots and collision in Unreal.
4. Create Blueprint actors for the vehicles and dealership. The showroom FBX is a static environment; it does not include a working purchase UI, inventory, service job, or vehicle spawning.
5. For a functioning dealership, add an interaction trigger, vehicle catalog UI, save-game ownership, spawn points and transaction logic. For drivable cars, add skeletal meshes, wheel bones, Physics Assets and Chaos Vehicles.

Neither script has been run in Blender nor imported or tested in Unreal in this repository session. No claim is made that the FBX files already exist in the project.
