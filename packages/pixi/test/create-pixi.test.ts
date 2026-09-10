/* eslint-disable no-underscore-dangle -- Pixi DevTools requires these exact global names. */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createPixi } from '../src/create-pixi.js';

const fixtures = vi.hoisted(() => ({
  configureAssets: vi.fn<() => void>(),
  destroyCanvas: vi.fn<() => void>(),
  destroyRenderer: vi.fn<(options: object) => void>(),
  destroyStage: vi.fn<(options: object) => void>(),
  register: vi.fn<(category: string, handler: unknown) => () => void>(),
  stopRendering: vi.fn<() => void>(),
  stopScreen: vi.fn<() => void>(),
  unregisterAtlas: vi.fn<() => void>(),
  unregisterSprite: vi.fn<() => void>(),
  loadAtlas: vi.fn<() => void>(),
  loadSprite: vi.fn<() => void>(),
  cleanupIntegration: vi.fn<() => void>(),
  setupIntegration: vi.fn<() => () => void>(),
  setupRenderer: vi.fn<() => void>(),
  setupRendering: vi.fn<() => void>(),
}));

vi.mock('@replayablejs/canvas', () => ({
  getCanvasHost: () => ({ destroy: fixtures.destroyCanvas }),
}));
vi.mock('@replayablejs/runtime', () => ({
  playable: { loader: { register: fixtures.register } },
}));
vi.mock('pixi.js', () => ({
  Container: class {
    destroy = fixtures.destroyStage;
  },
}));
vi.mock('../src/loader/configure-pixi-assets.js', () => ({
  configurePixiAssets: fixtures.configureAssets,
}));
vi.mock('../src/loader/load-pixi-atlas.js', () => ({ loadPixiAtlas: fixtures.loadAtlas }));
vi.mock('../src/loader/load-pixi-sprite.js', () => ({ loadPixiSprite: fixtures.loadSprite }));
vi.mock('../src/renderer/create-pixi-renderer.js', () => ({
  createPixiRenderer: async () => {
    fixtures.setupRenderer();
    return {
      renderer: { destroy: fixtures.destroyRenderer },
      destroy(): void {
        fixtures.destroyRenderer({ removeView: false });
        fixtures.destroyCanvas();
      },
    };
  },
}));
vi.mock('../src/renderer/start-pixi-rendering.js', () => ({
  startPixiRendering: () => {
    fixtures.setupRendering();
    return fixtures.stopRendering;
  },
}));
vi.mock('../src/renderer/synchronize-pixi-screen.js', () => ({
  synchronizePixiScreen: () => fixtures.stopScreen,
}));

describe('createPixi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fixtures.setupRenderer.mockReset();
    fixtures.setupRendering.mockReset();
    fixtures.cleanupIntegration.mockReset();
    fixtures.register.mockReset();
    fixtures.register
      .mockReturnValueOnce(fixtures.unregisterAtlas)
      .mockReturnValueOnce(fixtures.unregisterSprite);
    fixtures.setupIntegration.mockReturnValue(fixtures.cleanupIntegration);
  });

  it('registers loaders before readiness and destroys every owned resource once', async () => {
    const pixi = await createPixi({ integrations: [{ setup: fixtures.setupIntegration }] });

    expect(fixtures.register.mock.calls.map(([category]) => category)).toEqual([
      'atlases',
      'sprites',
    ]);

    expect(globalThis.__PIXI_STAGE__).toBe(pixi.stage);
    expect(globalThis.__PIXI_RENDERER__).toBe(pixi.renderer);

    pixi.destroy();
    pixi.destroy();

    expect(globalThis.__PIXI_STAGE__).toBeUndefined();
    expect(globalThis.__PIXI_RENDERER__).toBeUndefined();

    expect(fixtures.stopRendering).toHaveBeenCalledOnce();
    expect(fixtures.stopScreen).toHaveBeenCalledOnce();
    expect(fixtures.setupIntegration).toHaveBeenCalledOnce();
    expect(fixtures.cleanupIntegration).toHaveBeenCalledOnce();
    expect(fixtures.unregisterSprite).toHaveBeenCalledOnce();
    expect(fixtures.unregisterAtlas).toHaveBeenCalledOnce();
    expect(fixtures.destroyStage).toHaveBeenCalledOnce();
    expect(fixtures.destroyRenderer).toHaveBeenCalledWith({ removeView: false });
    expect(fixtures.destroyCanvas).toHaveBeenCalledOnce();
    expect(fixtures.destroyStage.mock.invocationCallOrder[0]).toBeLessThan(
      fixtures.destroyRenderer.mock.invocationCallOrder[0] ?? Infinity,
    );
  });

  it('releases built-in loaders when integration setup fails', async () => {
    const failure = new Error('integration failed');

    fixtures.setupIntegration.mockImplementation(() => {
      throw failure;
    });

    await expect(
      createPixi({ integrations: [{ setup: fixtures.setupIntegration }] }),
    ).rejects.toThrow(failure);
    expect(fixtures.unregisterSprite).toHaveBeenCalledOnce();
    expect(fixtures.unregisterAtlas).toHaveBeenCalledOnce();
    expect(fixtures.destroyStage).not.toHaveBeenCalled();
  });

  it('releases the atlas loader when sprite registration fails', async () => {
    const failure = new Error('sprite registration failed');
    fixtures.register
      .mockReset()
      .mockReturnValueOnce(fixtures.unregisterAtlas)
      .mockImplementationOnce(() => {
        throw failure;
      });
    await expect(createPixi()).rejects.toThrow(failure);
    expect(fixtures.unregisterAtlas).toHaveBeenCalledOnce();
    expect(fixtures.setupRenderer).not.toHaveBeenCalled();
  });

  it('releases renderer and screen subscription if rendering setup fails', async () => {
    const failure = new Error('render subscription failed');
    fixtures.setupRendering.mockImplementationOnce(() => {
      throw failure;
    });
    await expect(createPixi()).rejects.toThrow(failure);
    expect(fixtures.stopScreen).toHaveBeenCalledOnce();
    expect(fixtures.destroyRenderer).toHaveBeenCalledOnce();
    expect(fixtures.destroyStage).toHaveBeenCalledOnce();
    expect(fixtures.unregisterAtlas).toHaveBeenCalledOnce();
    expect(fixtures.unregisterSprite).toHaveBeenCalledOnce();
  });

  it('finishes destruction despite a failing integration and remains idempotent', async () => {
    const failure = new Error('integration cleanup failed');
    fixtures.cleanupIntegration.mockImplementationOnce(() => {
      throw failure;
    });
    const pixi = await createPixi({ integrations: [{ setup: fixtures.setupIntegration }] });
    expect(() => pixi.destroy()).toThrow(failure);
    expect(fixtures.destroyRenderer).toHaveBeenCalledOnce();
    expect(fixtures.destroyStage).toHaveBeenCalledOnce();
    expect(fixtures.unregisterAtlas).toHaveBeenCalledOnce();
    expect(fixtures.unregisterSprite).toHaveBeenCalledOnce();
    expect(() => pixi.destroy()).not.toThrow();
    expect(fixtures.cleanupIntegration).toHaveBeenCalledOnce();
  });

  it('reports setup and cleanup failures together', async () => {
    fixtures.setupRenderer.mockImplementationOnce(() => {
      throw new Error('renderer failed');
    });
    fixtures.cleanupIntegration.mockImplementationOnce(() => {
      throw new Error('cleanup failed');
    });
    await expect(
      createPixi({ integrations: [{ setup: fixtures.setupIntegration }] }),
    ).rejects.toMatchObject({
      errors: [
        expect.objectContaining({ message: 'renderer failed' }),
        expect.objectContaining({ message: 'cleanup failed' }),
      ],
    });
    expect(fixtures.destroyStage).not.toHaveBeenCalled();
    expect(fixtures.unregisterAtlas).toHaveBeenCalledOnce();
  });
});
