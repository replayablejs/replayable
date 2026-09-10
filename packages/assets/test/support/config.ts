import { defineConfig } from '../../src/index.js';

export function config(overrides: Record<string, unknown> = {}) {
  return defineConfig({
    assets: { locales: [{}] },
    emit: { assets: 'src/assets/assets.gen.ts' },
    localization: { fallback: 'en', language: 'en' },
    outDir: 'assets/generated',
    sourceDir: 'assets/source',
    ...overrides,
  });
}
