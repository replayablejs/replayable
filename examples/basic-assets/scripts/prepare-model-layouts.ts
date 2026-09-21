import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';

const root = fileURLToPath(new URL('../assets/models/', import.meta.url));
const layouts = join(root, 'layouts');
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

async function write(path: string, contents: string | Uint8Array): Promise<void> {
  const destination = join(root, path);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, contents);
}

// Keep the original Kenney files intact. Only these explicit layout demonstrations
// are derived; their source records explain the material and container changes.
const tree = await readFile(join(root, 'platformer-kit/tree.obj'), 'utf8');
await write(
  'layouts/obj-geometry/tree.obj',
  tree
    .split(/\r?\n/)
    .filter((line) => !/^\s*(?:mtllib|usemtl)\s/i.test(line))
    .join('\n'),
);
const race = await readFile(join(root, 'car-kit/race.obj'), 'utf8');
await write('layouts/obj-material/car.obj', race.replace('mtllib race.mtl', 'mtllib car.mtl'));
await write(
  'layouts/obj-material/car.mtl',
  '# Derived from Kenney Car Kit; CC0. Plain blue material without images.\nnewmtl colormap\nKd 0.12 0.45 0.8\nKs 0 0 0\nNs 20\nd 1\n',
);

const source = join(root, 'platformer-kit/chest.glb');
const embedded = await io.writeBinary(await io.read(source));
await write('chest.glb', embedded);
await write('layouts/glb-embedded/chest.glb', embedded);

const external = join(layouts, 'gltf-external/chest.gltf');
await mkdir(dirname(external), { recursive: true });
await io.write(external, await io.read(source));

const { json, resources } = await io.writeJSON(await io.read(source));
for (const buffer of json.buffers ?? []) {
  const bytes = buffer.uri === undefined ? undefined : resources[buffer.uri];
  if (bytes === undefined) {
    throw new Error('Missing buffer while preparing embedded glTF.');
  }
  buffer.uri = `data:application/octet-stream;base64,${Buffer.from(bytes).toString('base64')}`;
}
for (const image of json.images ?? []) {
  const bytes = image.uri === undefined ? undefined : resources[image.uri];
  if (bytes === undefined) {
    throw new Error('Missing image while preparing embedded glTF.');
  }
  image.uri = `data:${image.mimeType ?? 'image/png'};base64,${Buffer.from(bytes).toString('base64')}`;
}
await write('layouts/gltf-embedded/chest.gltf', JSON.stringify(json, null, 2) + '\n');

const inputs = [
  'platformer-kit/tree.obj',
  'car-kit/race.obj',
  'platformer-kit/chest.glb',
  'platformer-kit/Textures/colormap.png',
];
const outputs = [
  'chest.glb',
  ...(await readdir(layouts, { recursive: true }))
    .filter((path) => /\.(?:obj|mtl|glb|gltf|bin|png)$/.test(path))
    .map((path) => `layouts/${path.replaceAll('\\', '/')}`),
];
async function records(paths: readonly string[]) {
  return Promise.all(
    [...paths].sort().map(async (file) => ({
      file,
      sha256: createHash('sha256')
        .update(await readFile(join(root, file)))
        .digest('hex'),
    })),
  );
}
await write(
  'layouts/SOURCE.json',
  JSON.stringify(
    {
      author: 'Kenney',
      license: 'CC0-1.0',
      generator: 'examples/basic-assets/scripts/prepare-model-layouts.ts',
      changes: {
        'obj-geometry':
          'Removed mtllib/usemtl declarations; original tree geometry, normals, and UVs retained.',
        'obj-material':
          'Renamed the MTL reference and supplied a plain blue material; original race-car geometry retained.',
        'glb-embedded':
          'Embedded the chest texture into GLB, both flat and in a dedicated directory; all three animation clips retained.',
        'gltf-external':
          'Repacked the chest as glTF JSON with external binary and image resources.',
        'gltf-embedded': 'Repacked the chest as glTF JSON with data-URI buffers and images.',
      },
      inputs: await records(inputs),
      outputs: await records(outputs),
    },
    null,
    2,
  ) + '\n',
);
console.log(
  `Prepared ${outputs.length} layout source files under ${relative(process.cwd(), root)}.`,
);
