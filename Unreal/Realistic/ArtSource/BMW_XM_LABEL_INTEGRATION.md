# BMW XM Label – asset integration plan

## Honest asset status

There is currently **no BMW XM Label mesh, texture set, or licensed BMW asset** in this repository. The existing sedan in the Unreal showcase is primitive greybox geometry. The Blender generator in this folder creates generic unbranded vehicles; it does not produce a BMW replica.

A manufacturer-accurate BMW XM Label must come from either:
1. a commissioned original model with written rights for use and redistribution in the game, or
2. a third-party model whose license explicitly permits modification, commercial/non-commercial game use as applicable, and redistribution inside a packaged game.

Do not use a ripped configurator model, dealer imagery, or a model whose license only permits personal viewing.

## Required deliverables

- Exterior high-poly source and optimized game mesh (FBX or glTF)
- Separate body paint, glass, rubber, wheel, chrome/plastic trim, lamp and interior materials
- PBR base-color, normal, roughness and metallic maps
- Correct XM Label proportions and model-year-specific front/rear lighting
- Four wheels with separate rims/tires and correct pivots
- Complete visible cockpit, steering wheel, dashboard, seats and glazing
- LOD chain, simple collision, UVs and Unreal-centimeter scale
- Written source license and attribution file

## Unreal integration path

1. Import the licensed mesh into `Content/FrankfurtLife/Vehicles/BMW_XM_Label/`.
2. Name the primary static mesh `SM_BMW_XM_Label`; keep body, glass, wheels and interior as separate material slots/components.
3. Create material instances for paint color, glass tint, rubber and illuminated lamps.
4. Create a skeletal vehicle version with wheel bones and a Physics Asset before using it as a drivable vehicle. A static showcase mesh alone is not vehicle physics.
5. Place it in the vehicle showcase and inspect it in daylight, night and rain.
6. Verify collision, wheel rotation, reflections, texture streaming and packaged-build performance.

## Acceptance checklist

- [ ] License verified and stored with the asset
- [ ] Mesh and all texture maps committed or stored via Git LFS
- [ ] No missing materials or textures
- [ ] Scale, pivots, normals, LODs and collision checked in Unreal Editor
- [ ] Exterior and interior reviewed in-game
- [ ] Drivable Chaos Vehicle setup tested separately
- [ ] Packaged Windows build launched and visually checked

Until these steps pass, the BMW XM Label must be described as **not yet integrated**. Renderer settings alone cannot create the vehicle mesh or photorealistic art assets.
