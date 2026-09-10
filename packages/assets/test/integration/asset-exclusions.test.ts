import { describe, expect, it } from 'vitest';

import { buildAssets } from '../../src/index.js';
import { config } from '../support/config.js';
import { createTestProject } from '../support/test-project.js';

describe('asset exclusions', () => {
  it('vetoes selected assets before category validation and processing', async () => {
    const project = await createTestProject();

    await Promise.all([
      project.write('assets/source/shaders/grayscale/vert.glsl', 'void main() {}'),
      project.write('assets/source/shaders/grayscale/frag.glsl', 'void main() {}'),
      project.write('assets/source/shaders/incomplete/frag.glsl', 'void main() {}'),
    ]);

    const finalConfig = config({
      assets: { shaders: [{}] },
      exclude: ['shaders/incomplete'],
    });
    const result = await buildAssets(finalConfig, project.root);

    expect(result.emittedAssets).toBe(1);
    await expect(project.files('assets/generated/shaders')).resolves.toEqual([
      'grayscale/frag.glsl',
      'grayscale/vert.glsl',
    ]);
    await expect(project.readText('src/assets/assets.gen.ts')).resolves.not.toContain('incomplete');
  });
});
