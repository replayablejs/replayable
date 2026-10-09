import { buildAssets } from '@replayablejs/assets';
import { afterEach, expect, it, vi } from 'vitest';

import { createDevelopmentServer } from '../src/development/create-development-server.js';
import { servePreview } from '../src/development/serve-preview.js';
import { config } from './fixtures/preview-config.js';

vi.mock(import('@replayablejs/assets'), async (original) => ({
  ...(await original()),
  buildAssets: vi.fn<typeof buildAssets>(),
}));
vi.mock('../src/development/create-development-server.js', () => ({
  createDevelopmentServer: vi.fn<typeof createDevelopmentServer>(),
}));
afterEach(() => vi.resetAllMocks());

it('explicit selectors win and the resolved override reaches the development server', async () => {
  const close = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
  vi.mocked(createDevelopmentServer, { partial: true }).mockResolvedValue({
    close,
    resolvedUrls: { local: ['http://localhost:5173'], network: [] },
  });
  const result = await servePreview(
    {
      ...config,
      localization: { fallback: 'en', languages: ['en', 'hy'] },
      versions: { default: {}, alternate: {} },
    },
    {
      projectRoot: process.cwd(),
      version: 'alternate',
      language: 'hy',
      overrides: { version: 'default', language: 'en', controls: { persistentCta: false } },
    },
  );
  expect(result.variantId).toBe('alternate/preview/hy');
  expect(createDevelopmentServer).toHaveBeenCalledWith(
    expect.objectContaining({
      variant: expect.objectContaining({ controls: { persistentCta: false } }),
    }),
  );
  await result.close();
  expect(close).toHaveBeenCalledOnce();
});

it('rejects invalid input before building assets or starting a server', async () => {
  await expect(
    servePreview(config, {
      projectRoot: process.cwd(),
      overrides: { params: { unknown: 1 } },
    }),
  ).rejects.toThrow(/parameter/);
  expect(buildAssets).not.toHaveBeenCalled();
  expect(createDevelopmentServer).not.toHaveBeenCalled();
});
