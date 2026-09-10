import { describe, expect, it } from 'vitest';

import { buildAssets } from '../../src/index.js';
import { config } from '../support/config.js';
import { createTestProject, type TestProject } from '../support/test-project.js';

describe('bundles', () => {
  it('moves matching assets into the optional secondary bundle', async () => {
    const project = await createTestProject();
    await writeShader(project, 'main');
    await project.write('assets/source/locales/translations.jsonc', '{"play":{"en":"Play"}}');

    const result = await buildAssets(
      config({
        assets: { locales: [{}], shaders: [{}] },
        bundles: {
          secondary: { include: ['locales/**'] },
        },
      }),
      project.root,
    );
    const generated = await project.readText('src/assets/assets.gen.ts');

    expect(result).toMatchObject({
      bundles: ['primary', 'secondary'],
      emittedAssets: 2,
      emittedFiles: 3,
    });
    expect(generated).toMatch(
      /"primary": \{[\s\S]*"main": \{ vert: shader_\d+, frag: shader_\d+ \},[\s\S]*"secondary": \{[\s\S]*"translations": locale_\d+,/,
    );
  });

  it('keeps excluded secondary assets in primary', async () => {
    const project = await createTestProject();
    await writeShader(project, 'main');

    const result = await buildAssets(
      config({
        assets: { shaders: [{}] },
        bundles: {
          secondary: {
            exclude: ['shaders/main'],
            include: ['shaders/**'],
          },
        },
      }),
      project.root,
    );

    expect(result.bundles).toEqual(['primary']);
  });

  it('always emits primary when every asset belongs to secondary', async () => {
    const project = await createTestProject();
    await writeShader(project, 'deferred/glow');

    const result = await buildAssets(
      config({
        assets: { shaders: [{}] },
        bundles: { secondary: { include: ['shaders/**'] } },
      }),
      project.root,
    );
    const generated = await project.readText('src/assets/assets.gen.ts');

    expect(result.bundles).toEqual(['primary', 'secondary']);
    expect(generated).toMatch(/"primary": \{\n  \},\n  "secondary": \{/);
  });
});

/** Writes the complete WebGL shader pair represented by one logical directory. */
async function writeShader(project: TestProject, id: string): Promise<void> {
  await Promise.all([
    project.write(`assets/source/shaders/${id}/vert.glsl`, 'void main() {}'),
    project.write(`assets/source/shaders/${id}/frag.glsl`, 'void main() {}'),
  ]);
}
