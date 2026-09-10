import { runInNewContext } from 'node:vm';

import { describe, expect, it } from 'vitest';

import { prepareClassicJavaScript } from '../src/preparation/shared/prepare-classic-javascript.js';

describe('classic JavaScript preparation', () => {
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
});
