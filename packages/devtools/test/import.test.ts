import { expect, it, vi } from 'vitest';

import { disabledStats } from '../src/stats/disabled-stats.js';

// The dependency may be imported, but devtools must not access the playable
// singleton until createStats() is explicitly called.
vi.mock('@replayablejs/runtime', () => {
  return {
    get playable() {
      throw new Error('Importing devtools must not access runtime.');
    },
  };
});

it('can import enabled stats without runtime initialization or browser globals', async () => {
  await expect(import('../src/create-stats.js')).resolves.toBeDefined();
});

it('disabled stats return inert controls without accessing runtime or browser globals', async () => {
  const { createStats } = await import('../src/stats/create-disabled-stats.js');
  const stats = createStats();
  expect(stats).toBe(disabledStats);
  stats.show();
  stats.hide();
  stats.destroy();
});
