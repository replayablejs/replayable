import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import { prepareImage, selectImageCandidateFormats } from '#processors/image-encoder.js';

import { createTestProject } from '../support/test-project.js';

describe('image encoding', () => {
  it('selects candidates from final transparency and lossless intent', async () => {
    const project = await createTestProject();
    const opaquePath = project.path('opaque.png');
    const transparentPath = project.path('transparent.png');
    await Promise.all([
      sharp({ create: { background: '#336699', channels: 4, height: 4, width: 4 } })
        .png()
        .toFile(opaquePath),
      sharp({
        create: {
          background: { alpha: 0.5, b: 153, g: 102, r: 51 },
          channels: 4,
          height: 4,
          width: 4,
        },
      })
        .png()
        .toFile(transparentPath),
    ]);

    const opaque = await prepareImage(opaquePath, 0.5, 'opaque.png');
    const transparent = await prepareImage(transparentPath, 0.5, 'transparent.png');

    expect(opaque.isOpaque).toBe(true);
    expect(transparent.isOpaque).toBe(false);
    expect(selectImageCandidateFormats({ lossless: false, scale: 1 }, opaque)).toEqual([
      'avif',
      'webp',
      'jpg',
    ]);
    expect(selectImageCandidateFormats({ lossless: false, scale: 1 }, transparent)).toEqual([
      'avif',
      'webp',
      'png',
    ]);
    expect(selectImageCandidateFormats({ lossless: true, scale: 1 }, opaque)).toEqual([
      'webp',
      'png',
    ]);
  });
});
