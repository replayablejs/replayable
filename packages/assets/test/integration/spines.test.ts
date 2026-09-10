import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import { buildAssets } from '../../src/index.js';
import { config } from '../support/config.js';
import { createTestProject } from '../support/test-project.js';

describe('spines', () => {
  it('processes multi-page Spine JSON assets and emits URL imports', async () => {
    const project = await createTestProject();
    await project.write(
      'assets/source/spines/hero/hero.json',
      '{\n  "skeleton": { "spine": "4.3.00" },\n  "bones": [{ "name": "root" }]\n}\n',
    );
    await project.write(
      'assets/source/spines/hero/hero.atlas',
      [
        'body.png',
        'size: 4,4',
        'format: RGBA8888',
        '',
        'effects.png',
        'size: 2,2',
        'format: RGBA8888',
        '',
      ].join('\n'),
    );
    await Promise.all([
      sharp({ create: { background: 'red', channels: 4, height: 4, width: 4 } })
        .png()
        .toFile(project.path('assets/source/spines/hero/body.png')),
      sharp({
        create: { background: 'blue', channels: 4, height: 2, width: 2 },
      })
        .png()
        .toFile(project.path('assets/source/spines/hero/effects.png')),
    ]);

    const result = await buildAssets(
      config({
        assets: { spines: [{ options: { scale: 0.5 } }] },
      }),
      project.root,
    );
    const generated = await project.readText('src/assets/assets.gen.ts');
    const skeleton = await project.readText('assets/generated/spines/hero/skeleton.json');
    const pageFiles = await project.entries('assets/generated/spines/hero/images');
    const pageMetadata = await Promise.all(
      pageFiles.map((file) =>
        sharp(project.path('assets/generated/spines/hero/images', file)).metadata(),
      ),
    );

    expect(result).toMatchObject({ emittedAssets: 1, emittedFiles: 4 });
    expect(pageFiles).toHaveLength(2);
    expect(pageMetadata.map(({ width }) => width)).toEqual(expect.arrayContaining([1, 2]));
    expect(skeleton).toBe('{"skeleton":{"spine":"4.3.00"},"bones":[{"name":"root"}]}');
    expect(generated.match(/import image_/g)).toHaveLength(2);
    expect(generated).toMatch(
      /"hero": \{ format: "json", skel: spine_\d+, atlas: spine_\d+, images: \[image_\d+, image_\d+\], scale: 0\.5 \},/,
    );
  });

  it('copies binary Spine skeletons without modification', async () => {
    const project = await createTestProject();
    const fixtureDirectory = resolve(
      dirname(fileURLToPath(import.meta.url)),
      '../../../../examples/basic-assets/assets/spines/raptor',
    );
    const binary = await readFile(resolve(fixtureDirectory, 'raptor-pro.skel'));

    await project.write('assets/source/spines/binary/binary.skel', binary);
    await project.write(
      'assets/source/spines/binary/binary.atlas',
      await readFile(resolve(fixtureDirectory, 'raptor.atlas')),
    );
    await project.write(
      'assets/source/spines/binary/raptor.png',
      await readFile(resolve(fixtureDirectory, 'raptor.png')),
    );

    await buildAssets(
      config({
        assets: { spines: [{}] },
      }),
      project.root,
    );

    await expect(
      project.readBytes('assets/generated/spines/binary/skeleton.skel'),
    ).resolves.toEqual(binary);
    await expect(project.readText('src/assets/assets.gen.ts')).resolves.toContain('format: "skel"');
  });
});
