import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const root = process.cwd();
const outDir = join(root, 'assets', 'models');
await mkdir(outDir, { recursive: true });

const models = [
  ['hatchback', 'https://tevy.dev/models/hatchback/v1'],
  ['family-sedan', 'https://tevy.dev/models/family-sedan/v1'],
  ['suv', 'https://tevy.dev/models/suv/v1'],
  ['estate-car', 'https://tevy.dev/models/estate-car/v1'],
  ['supercar', 'https://tevy.dev/models/supercar/v2'],
  ['police-car', 'https://tevy.dev/models/police-car/v1'],
  ['rowan', 'https://tevy.dev/models/rowan/v1'],
  ['plane-tree', 'https://tevy.dev/models/plane-tree/v1'],
  ['apartment-block', 'https://tevy.dev/models/apartment-block/v2'],
  ['office-tower', 'https://tevy.dev/models/office-tower/v2'],
  ['public-housing-slab', 'https://tevy.dev/models/public-housing-slab/v1'],
  ['mixed-tenant-block', 'https://tevy.dev/models/mixed-tenant-block/v1'],
  ['supermarket-shell', 'https://tevy.dev/models/supermarket-shell/v2']
];

async function download(url, destination, optional = false) {
  const response = await fetch(url, { headers: { 'User-Agent': 'Frankfurt-Life-Asset-Packager/1.0' } });
  if (!response.ok) {
    if (optional && (response.status === 404 || response.status === 410)) {
      console.log(`Optional model detail unavailable: ${url} (${response.status})`);
      return false;
    }
    throw new Error(`Model download failed: ${response.status} ${response.statusText} — ${url}`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length < 12 || String.fromCharCode(...bytes.slice(0, 4)) !== 'glTF') {
    throw new Error(`Downloaded file is not a valid binary glTF: ${url}`);
  }
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, bytes);
  console.log(`Saved ${destination.replace(root + '/', '')} (${(bytes.length / 1048576).toFixed(2)} MiB)`);
  return true;
}

for (const [name, base] of models) {
  await download(`${base}/lod1.glb`, join(outDir, `${name}.lod1.glb`));
}

// Higher-detail vehicle LODs are optional; LOD1 remains the guaranteed fallback.
for (const [name, base] of models.slice(0, 6)) {
  await download(`${base}/lod0.glb`, join(outDir, `${name}.lod0.glb`), true);
}

const license = [
  '# Frankfurt Life bundled 3D models',
  '',
  'The GLB model files in this folder are downloaded during CI packaging from the Tevy model catalog.',
  'The catalog identifies these models as CC0. Check the individual catalog entry before redistributing',
  'outside this project, and retain this notice with packaged builds.',
  '',
  'Source: https://tevy.dev/models',
  'Downloaded files are used locally by the Windows application; browser builds keep a remote fallback.',
  ''
].join('\\n');
await writeFile(join(outDir, 'README.md'), license, 'utf8');
