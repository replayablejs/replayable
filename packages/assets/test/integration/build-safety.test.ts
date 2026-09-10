import { describe, expect, it } from 'vitest';

import { buildAssets } from '../../src/index.js';
import { config } from '../support/config.js';
import { createTestProject } from '../support/test-project.js';

describe('asset build safety', () => {
  it('rejects output parents redirected by a symbolic link without touching the target', async () => {
    const project = await createTestProject();
    const external = await createTestProject();
    await project.directory('assets/source');
    await external.write('generated/keep.txt', 'untouched');
    await project.link(external.root, 'linked');

    await expect(buildAssets(config({ outDir: 'linked/generated' }), project.root)).rejects.toThrow(
      'symbolic links',
    );
    expect(await external.readText('generated/keep.txt')).toBe('untouched');
  });

  it('rejects source and generated-module symlinks too', async () => {
    const project = await createTestProject();
    const external = await createTestProject();
    await external.directory('source');
    await project.link(external.path('source'), 'source-link');
    await expect(buildAssets(config({ sourceDir: 'source-link' }), project.root)).rejects.toThrow(
      'symbolic links',
    );

    await project.directory('assets/source');
    await project.link(external.root, 'modules');
    await expect(
      buildAssets(config({ emit: { assets: 'modules/assets.ts' } }), project.root),
    ).rejects.toThrow('symbolic links');
  });

  it('rejects physical basename collisions across bundles before processing', async () => {
    const project = await createTestProject();
    await project.write('assets/source/textures/logo.png', 'not decoded');
    await project.write('assets/source/textures/logo.webp', 'not decoded');
    await project.write('assets/generated/keep.txt', 'previous build');

    await expect(
      buildAssets(
        config({
          assets: { textures: [{}] },
          bundles: { secondary: { include: ['textures/logo.webp'] } },
        }),
        project.root,
      ),
    ).rejects.toThrow('Asset output collision');
    expect(await project.readText('assets/generated/keep.txt')).toBe('previous build');
  });

  it('preserves the complete previous build when an encoder fails', async () => {
    const project = await createTestProject();
    await project.write('assets/source/locales/translations.jsonc', '{"play":{"en":"Play"}}');
    const settings = config({
      emit: { assets: 'src/assets/assets.gen.ts', registries: 'src/assets/registries' },
    });
    await buildAssets(settings, project.root);
    const module = await project.readText(settings.emit.assets);
    const registry = await project.readText('src/assets/registries/locales.ts');

    await project.write('assets/source/locales/translations.jsonc', '{"play":{"en":"Changed"}}');
    await project.write('assets/source/textures/broken.png', 'invalid image');
    await expect(
      buildAssets({ ...settings, assets: { locales: [{}], textures: [{}] } }, project.root),
    ).rejects.toThrow('unsupported image format');

    expect(await project.readText('assets/generated/locales/translations.json')).toBe(
      '{"play":"Play"}',
    );
    expect(await project.readText(settings.emit.assets)).toBe(module);
    expect(await project.readText('src/assets/registries/locales.ts')).toBe(registry);
    expect(
      (await project.entries('.')).some((name) => name.startsWith('.replayable-assets-')),
    ).toBe(false);
  });

  it('publishes nested modules with final relative imports and removes stale outputs', async () => {
    const project = await createTestProject();
    await project.write('assets/source/locales/translations.jsonc', '{"play":{"en":"Play"}}');
    await project.write('src/assets/stale.txt', 'obsolete');
    await buildAssets(
      config({
        outDir: 'src/assets',
        emit: { assets: 'src/assets/assets.gen.ts', registries: 'src/assets/registries' },
      }),
      project.root,
    );

    const module = await project.readText('src/assets/assets.gen.ts');
    expect(module).toContain('"./locales/translations.json"');
    expect(module).not.toContain('.replayable-assets-');
    expect(await project.readText('src/assets/locales/translations.json')).toBe('{"play":"Play"}');
    await expect(project.readText('src/assets/stale.txt')).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });
});
