# Realistic Edition – Art Asset Production Specification

This document defines the replacement path from the current primitive greybox to a detailed, believable Frankfurt-inspired city. It is an implementation brief, not a claim that these assets are already present.

## 1. Content layout

Create these folders in the Unreal project:

```
Content/
  FrankfurtLife/
    Environment/
      Buildings/Modular/
      Buildings/Props/
      Roads/
      Sidewalks/
      StreetFurniture/
      Foliage/
      Decals/
      Lighting/
    Vehicles/
      Civilian/
      Police/
      Materials/
      Shared/
    Materials/
      Master/
      Instances/
    Maps/
```

Use the prefixes `SM_` (static mesh), `SK_` (skeletal mesh), `M_` (master material), `MI_` (material instance), `T_` (texture), `BP_` (Blueprint), and `NS_` (Niagara system).

## 2. City environment asset set

| Asset group | Required first-pass assets | Important details |
|---|---|---|
| Street kit | straight road, corner, T-junction, four-way junction, parking bay, cycle lane | Separate road surface and curb meshes; consistent modular snap dimensions |
| Sidewalk kit | straight sidewalk, corner curb, ramp, tactile paving, driveway | German-style curb profiles and accessible crossings |
| Buildings | 3–5 modular facade families, corner pieces, roofs, entrances | Varied floor heights, believable window depth, balconies and roof equipment |
| Shopfronts | glazing, doors, signs, awnings, shutters | Keep signage as replaceable meshes or textures |
| Street furniture | benches, bins, bollards, bike racks, bus stops, traffic lights, signs | Collision kept simple |
| Foliage | 3 tree species, shrubs, planter vegetation | Nanite or foliage workflow chosen after profiling |
| Ground detail | manholes, drains, road patches, lane markings, crosswalks | Prefer decals for paint and small surface variation |
| Frankfurt identity | skyline silhouettes and selected recognizable landmark assets | Use accurate references and verify scale before modeling |

## 3. Vehicle asset set

Each vehicle should be a real authored mesh asset, not a collection of engine cubes.

### Civilian sedan
- Exterior body with clean panel transitions and separate glass
- Four correctly oriented wheels, tires, rims and brake details
- Headlights, tail lamps, mirrors, door handles, grille and license plates
- Interior: dashboard, steering wheel, seats, door cards and glass
- LODs, collision meshes, pivot at vehicle origin and wheel socket markers

### Delivery van
- Separate cab and cargo body forms
- Sliding-door seams, rear doors, mirrors, lamps and cargo interior
- Four wheels with matching wheel sockets and simplified collision

### Police vehicle
- Sedan base plus non-functional visual lightbar mesh and police livery
- Lightbar material slots reserved for later emissive/flash effects
- No real-world emergency-service insignia unless appropriately licensed

### Vehicle material slots
Use separate material slots for body paint, glass, rubber, interior, chrome/plastic trim, lights and emissive elements. Create master materials with exposed parameters for paint color, roughness, metallic response, glass tint and light emission. Avoid relying on the default BasicShapes material parameters.

## 4. Visual quality targets

- Use physically based materials with base color, normal, roughness and ambient-occlusion maps where appropriate.
- Keep texel density consistent across neighboring assets.
- Use bevels and real geometry on silhouette-critical edges; do not model every tiny detail.
- Author LODs and simple collision for large environment and vehicle meshes.
- Use decals for dirt, tire marks, road paint and small facade variation.
- Build a coherent lighting setup: directional sun, skylight, sky atmosphere, clouds and restrained local lights.
- Use reflection captures or the selected UE5 reflection method consistently.
- Profile Nanite, Lumen, shadows, foliage and texture memory on the target PC; expose scalability settings.

## 5. Import and acceptance checklist

An asset is not considered integrated until all applicable checks pass in Unreal Editor:

- [ ] Source license permits use and redistribution in the game.
- [ ] Mesh scale and pivot are correct (Unreal centimeters).
- [ ] Materials and texture maps are assigned and named consistently.
- [ ] LOD/Nanite and collision behavior are reviewed.
- [ ] No missing textures, broken normals or obvious shading seams.
- [ ] Asset is placed in the district and checked at gameplay camera distance.
- [ ] Performance impact is measured in a packaged Development build.
- [ ] The asset has been reviewed in both daylight and night lighting.

## 6. Replacement order

1. Replace road, curb and sidewalk primitives with the modular street kit.
2. Replace the nine blockout building masses with modular building families and shopfronts.
3. Replace placeholder trees and streetlights with authored foliage and street furniture.
4. Replace sedan, van and police-car blockouts with complete vehicle meshes and interiors.
5. Add decals, signs, props, lighting and Frankfurt-specific landmarks.
6. Only after the visual assets are integrated, implement and validate vehicle physics, traffic, pedestrian navigation and performance.

## Current status

The existing C++ city and vehicle actors remain temporary greybox geometry. This specification does not add meshes or textures by itself. The project still needs licensed source assets or custom modeling, import into Unreal Editor, material setup, level review, compilation and packaged-build testing before it can look or be described as realistic.
