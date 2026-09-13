import { runInNewContext } from 'node:vm';

import { describe, expect, it } from 'vitest';

import { prepareClassicJavaScript } from '../src/preparation/shared/prepare-classic-javascript.js';

describe('classic JavaScript preparation', () => {
  it('keeps authored entryUrl bindings separate from the script URL', async () => {
    const source = await prepareClassicJavaScript(`
      const entryUrl = 'authored';
      globalThis.authored = entryUrl;
      globalThis.resolved = ((entryUrl) => import.meta.url)('nested');
    `);
    const context = {
      document: { currentScript: { src: 'https://example.com/assets/main.js' } },
      authored: '',
      resolved: '',
    };

    await runInNewContext(source, context);

    expect(context.authored).toBe('authored');
    expect(context.resolved).toBe('https://example.com/assets/main.js');
  });

  it('preserves entry-relative URLs after awaiting, without module syntax', async () => {
    const source = await prepareClassicJavaScript(`
      document.currentScript = null;
      await Promise.resolve();
      globalThis.resolved = import.meta.resolve
        ? import.meta.resolve('./texture.png')
        : new URL('./texture.png', import.meta.url).href;
      globalThis.literal = 'import.meta.url';
    `);
    const context = {
      document: { currentScript: { src: 'https://example.com/assets/main.js' } },
      URL,
      resolved: '',
      literal: '',
    };

    await runInNewContext(source, context);

    expect(context.resolved).toBe('https://example.com/assets/texture.png');
    expect(context.literal).toBe('import.meta.url');
  });

  it('rejects unsupported remaining module metadata', async () => {
    await expect(prepareClassicJavaScript('console.log(import.meta);')).rejects.toThrow(
      /import\.meta/,
    );
  });

  it.each(["import './missing-module.js';", 'export const value = 1;'])(
    'rejects remaining module declarations: %s',
    async (source) => {
      await expect(prepareClassicJavaScript(source)).rejects.toThrow(
        /statement may only appear at the top level/,
      );
    },
  );

  it('preserves dynamic imports and runtime environment access', async () => {
    const source = await prepareClassicJavaScript(`
      globalThis.load = () => import('./missing-module.js');
      globalThis.mode = process.env.NODE_ENV;
    `);
    const context = {
      document: { currentScript: { src: 'https://example.com/assets/main.js' } },
      process: { env: { NODE_ENV: 'authored-runtime' } },
      mode: '',
    };

    await runInNewContext(source, context);

    expect(source).toContain("import('./missing-module.js')");
    expect(context.mode).toBe('authored-runtime');
  });
});
