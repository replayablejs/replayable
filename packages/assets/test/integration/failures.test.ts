import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import { buildAssets } from '../../src/index.js';
import { config } from '../support/config.js';
import { createTestProject } from '../support/test-project.js';

describe('authored project failures', () => {
  it('reports a missing asset source directory', async () => {
    const project = await createTestProject();
    const sourceRoot = project.path('assets/source');

    await expect(buildAssets(config(), project.root)).rejects.toThrow(
      `Asset source directory does not exist: ${sourceRoot}`,
    );
  });

  it('validates unsafe output paths before deleting existing files', async () => {
    const project = await createTestProject();
    await project.directory('assets/source');
    await project.write('marker.txt', 'preserved');

    await expect(
      buildAssets(config({ outDir: '.', sourceDir: 'assets/source' }), project.root),
    ).rejects.toThrow('outDir must resolve to a path inside the project directory');
    await expect(project.readText('marker.txt')).resolves.toBe('preserved');

    const registryProject = await createTestProject();
    await registryProject.directory('assets/source');
    await registryProject.write('assets/generated/preserved.txt', 'preserved');

    await expect(
      buildAssets(
        config({ emit: { assets: 'src/assets/assets.ts', registries: '.' } }),
        registryProject.root,
      ),
    ).rejects.toThrow('emit.registries must resolve to a path inside the project directory');
    await expect(registryProject.readText('assets/generated/preserved.txt')).resolves.toBe(
      'preserved',
    );
  });

  it('reports the source location of malformed locale syntax', async () => {
    const project = await createTestProject();
    await project.write('assets/source/locales/translations.jsonc', '{\n  "hello":,\n}\n');

    await expect(buildAssets(config(), project.root)).rejects.toThrow(
      /locales\/translations\.jsonc:2:\d+:/,
    );
  });

  it('rejects more than one matched locale file', async () => {
    const project = await createTestProject();
    await Promise.all([
      project.write('assets/source/locales/interface.jsonc', '{"play":{"en":"Play"}}'),
      project.write('assets/source/locales/rewards.jsonc', '{"win":{"en":"Win"}}'),
    ]);

    await expect(buildAssets(config(), project.root)).rejects.toThrow(
      'Locale rules must match at most one translation file; received 2.',
    );
  });

  it('rejects locale phrases missing both configured languages', async () => {
    const project = await createTestProject();
    await project.write('assets/source/locales/translations.jsonc', '{"play":{"hy":"Խաղալ"}}');

    await expect(
      buildAssets(
        config({
          localization: { fallback: 'en', language: 'fr' },
        }),
        project.root,
      ),
    ).rejects.toThrow('Locale phrase "play" is missing language "fr" and fallback "en".');
  });

  it('rejects localized sprites without a selected, fallback, or neutral variant', async () => {
    const project = await createTestProject();
    const png = await sharp({ create: { background: 'red', channels: 4, height: 2, width: 2 } })
      .png()
      .toBuffer();
    await project.write('assets/source/sprites/logo.hy.png', png);

    await expect(
      buildAssets(
        config({
          localization: { fallback: 'en', language: 'fr' },
          assets: { sprites: [{}] },
        }),
        project.root,
      ),
    ).rejects.toThrow('Localized sprite sprites/logo.png has no fr, en, or unlocalized variant.');
  });

  it('requires a complete vertex and fragment shader pair', async () => {
    const project = await createTestProject();
    await project.write('assets/source/shaders/incomplete/frag.glsl', 'void main() {}');

    await expect(buildAssets(config({ assets: { shaders: [{}] } }), project.root)).rejects.toThrow(
      'Shader shaders/incomplete must contain vert.glsl and frag.glsl.',
    );
  });

  it('reports texture pages missing from a Spine asset', async () => {
    const project = await createTestProject();
    await project.write('assets/source/spines/hero/hero.json', '{}');
    await project.write('assets/source/spines/hero/hero.atlas', 'missing.png\nsize: 1,1\n');

    await expect(buildAssets(config({ assets: { spines: [{}] } }), project.root)).rejects.toThrow(
      'Spine atlas spines/hero/hero.atlas references missing page missing.png.',
    );
  });
});
