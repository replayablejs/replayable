import { describe, expect, it, vi } from 'vitest';

const fixtures = vi.hoisted(() => ({
  register: vi.fn<(category: string, handler: unknown) => () => void>(),
  unregister: vi.fn<() => void>(),
}));

vi.mock('@replayablejs/runtime', () => ({
  playable: { loader: { register: fixtures.register } },
}));

import { createSpineIntegration } from '../src/spine/create-spine-integration.js';

describe('Spine integration', () => {
  it('owns registration of the exclusive Spine asset handler', () => {
    fixtures.register.mockReturnValue(fixtures.unregister);

    const cleanup = createSpineIntegration().setup();

    expect(fixtures.register).toHaveBeenCalledOnce();
    expect(fixtures.register).toHaveBeenCalledWith('spines', expect.any(Function));

    cleanup();

    expect(fixtures.unregister).toHaveBeenCalledOnce();
  });
});
