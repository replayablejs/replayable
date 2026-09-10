import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import { buildAssets } from '../../src/index.js';
import { config } from '../support/config.js';
import { createTestProject } from '../support/test-project.js';

describe('images', () => {
  it('keeps the smallest image candidate with scale metadata', async () => {
    const project = await createTestProject();
    await project.directory('assets/source/sprites');
    await sharp({
      create: { background: '#ffcc00', channels: 4, height: 4, width: 4 },
    })
      .png()
      .toFile(project.path('assets/source/sprites/icon.png'));

    const result = await buildAssets(
      config({
        assets: {
          sprites: [{ options: { scale: 0.5 } }],
        },
      }),
      project.root,
    );
    const files = await project.entries('assets/generated/sprites');
    const generated = await project.readText('src/assets/assets.gen.ts');
    const output = files[0];

    if (output === undefined) {
      throw new Error('Expected one generated image.');
    }

    const metadata = await sharp(project.path('assets/generated/sprites', output)).metadata();

    expect(result.emittedAssets).toBe(1);
    expect(files).toHaveLength(1);
    expect(metadata.width).toBe(2);
    expect(generated).toMatch(/"icon": \{ src: image_\d+, scale: 0\.5 \}/);
    expect(generated.match(/import image_/g)).toHaveLength(1);
  });

  it('keeps one smallest lossless texture encoding', async () => {
    const project = await createTestProject();
    await project.directory('assets/source/textures');
    await sharp({
      create: { background: '#336699', channels: 4, height: 32, width: 32 },
    })
      .png()
      .toFile(project.path('assets/source/textures/card.png'));

    const result = await buildAssets(
      config({
        assets: {
          textures: [
            {
              options: { lossless: true },
            },
          ],
        },
      }),
      project.root,
    );
    const files = await project.entries('assets/generated/textures');
    const generated = await project.readText('src/assets/assets.gen.ts');
    const output = files[0];

    if (output === undefined) {
      throw new Error('Expected one generated lossless image.');
    }

    const pixels = await sharp(project.path('assets/generated/textures', output))
      .removeAlpha()
      .raw()
      .toBuffer();

    expect(result.emittedAssets).toBe(1);
    expect(files).toHaveLength(1);
    expect(output).toMatch(/^card\.(?:png|webp)$/);
    expect([...pixels.subarray(0, 3)]).toEqual([51, 102, 153]);
    expect(generated.match(/import image_/g)).toHaveLength(1);
    expect(generated).toMatch(/"card": \{ src: image_\d+, scale: 1 \}/);
  });
});
