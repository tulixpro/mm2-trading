# Frankfurt Engine — 3D asset catalogue

The original Blender generator in `tools/blender/build_frankfurt_assets.py` creates a starter asset pack as individual glTF Binary (`.glb`) files. The GitHub Actions workflow `.github/workflows/build-3d-models.yml` generates and uploads the pack.

## Vehicle models

| File | Description |
|---|---|
| `frankfurt-compact.glb` | Blue compact hatchback with glass, trim, lights, wheels and alloy rims |
| `frankfurt-estate.glb` | Silver estate car with roof rails |
| `frankfurt-police-sedan.glb` | White police sedan with emergency lightbar and markings |

## City and street models

| File | Description |
|---|---|
| `frankfurt-mixed-use-building.glb` | Multi-storey brick-and-plaster shop building with repeated windows and roof details |
| `frankfurt-road-segment.glb` | Modular road section with pavement, lane markings and edge lines |
| `frankfurt-street-lamp.glb` | Street lantern |
| `frankfurt-traffic-light.glb` | Three-aspect traffic signal |
| `frankfurt-street-bench.glb` | Timber and steel public bench |
| `frankfurt-bus-stop.glb` | Glass-and-steel bus shelter |
| `frankfurt-bollard.glb` | Reflective pavement bollard |
| `frankfurt-plane-tree.glb` | Plane tree for urban streets |

## Coordinate and quality notes

- Models are authored in Blender and exported as glTF 2.0 binary.
- The generator uses metric-style dimensions and keeps each asset near the origin for straightforward placement.
- These are original, stylized real-time game prototypes with separate mesh parts and material assignments. They are not photogrammetry or finished photorealistic assets.
- The pack is not yet wired into the Frankfurt Engine renderer. The next engine milestone is a GLB loader, followed by PBR material support, image textures, a camera and shadow-casting lights.
