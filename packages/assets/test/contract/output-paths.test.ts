import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { createBuildContext } from '#pipeline/context.js';

import { config } from '../support/config.js';

const workingDirectory = resolve('context-test-project');

describe('build context', () => {
  it.runIf(process.platform === 'win32')('rejects destinations on another drive', () => {
    expect(() => createBuildContext(config({ outDir: 'D:\\generated' }), 'C:\\project')).toThrow(
      'outDir must resolve to a path inside the project directory',
    );
  });

  it('rejects nested source and processed output directories', () => {
    expect(() =>
      createBuildContext(
        config({ outDir: 'assets/source/generated', sourceDir: 'assets/source' }),
        workingDirectory,
      ),
    ).toThrow('outDir and sourceDir must be separate, non-nested directories');

    expect(() =>
      createBuildContext(
        config({ outDir: 'assets', sourceDir: 'assets/source' }),
        workingDirectory,
      ),
    ).toThrow('outDir and sourceDir must be separate, non-nested directories');
  });

  it('rejects the generated assets module inside sourceDir', () => {
    expect(() =>
      createBuildContext(
        config({
          emit: { assets: 'assets/source/assets.gen.ts' },
        }),
        workingDirectory,
      ),
    ).toThrow('emit.assets must be separate from sourceDir');
  });

  it('rejects registries that overlap sourceDir', () => {
    expect(() =>
      createBuildContext(
        config({
          emit: {
            assets: 'src/assets/assets.gen.ts',
            registries: 'assets/source/registries',
          },
        }),
        workingDirectory,
      ),
    ).toThrow('emit.registries must be separate from sourceDir');
  });

  it('rejects the assets module inside the registry-owned directory', () => {
    expect(() =>
      createBuildContext(
        config({
          emit: {
            assets: 'src/assets/registries/assets.gen.ts',
            registries: 'src/assets/registries',
          },
        }),
        workingDirectory,
      ),
    ).toThrow('emit.assets must be separate from emit.registries');
  });

  it('allows generated modules nested beneath outDir', () => {
    const context = createBuildContext(
      config({
        emit: {
          assets: 'src/assets/assets.gen.ts',
          registries: 'src/assets/registries',
        },
        outDir: 'src/assets',
      }),
      workingDirectory,
    );

    expect(context.assetsFile).toBe(resolve(workingDirectory, 'src/assets/assets.gen.ts'));
    expect(context.registriesDirectory).toBe(resolve(workingDirectory, 'src/assets/registries'));
  });
});
