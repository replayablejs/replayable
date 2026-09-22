import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createDracoIntegration } from '../src/draco/index.js';
import { acquireModelDecoder, registerModelDecoder } from '../src/integrations/model-decoders.js';
import { setupThreeIntegrations } from '../src/integrations/setup-three-integrations.js';
import { loadThreeModel } from '../src/loader/load-three-model.js';
import { createMeshoptIntegration } from '../src/meshopt/index.js';

const cleanups: (() => void)[] = [];
afterEach(() => {
  while (cleanups.length) {
    cleanups.pop()?.();
  }
  vi.restoreAllMocks();
});

describe('optional model decoders', () => {
  it('shares Meshopt across loaders and unregisters idempotently', () => {
    const destroy = createMeshoptIntegration().setup();
    cleanups.push(destroy);
    const first = new GLTFLoader(),
      second = new GLTFLoader();
    const a = vi.spyOn(first, 'setMeshoptDecoder'),
      b = vi.spyOn(second, 'setMeshoptDecoder');
    acquireModelDecoder('meshopt', first)();
    acquireModelDecoder('meshopt', second)();
    expect(a.mock.calls[0]?.[0]).toBe(b.mock.calls[0]?.[0]);
    destroy();
    destroy();
    expect(() => acquireModelDecoder('meshopt', first)).toThrow('createMeshoptIntegration');
  });

  it('shares a Draco worker pool and delays disposal until all active loads release it', () => {
    const dispose = vi.spyOn(DRACOLoader.prototype, 'dispose');
    const workers = vi.spyOn(DRACOLoader.prototype, 'setWorkerLimit');
    const destroy = createDracoIntegration({ workerLimit: 2 }).setup();
    cleanups.push(destroy);
    const first = new GLTFLoader(),
      second = new GLTFLoader();
    const a = vi.spyOn(first, 'setDRACOLoader'),
      b = vi.spyOn(second, 'setDRACOLoader');
    const releaseFirst = acquireModelDecoder('draco', first);
    const releaseSecond = acquireModelDecoder('draco', second);
    expect(a.mock.calls[0]?.[0]).toBe(b.mock.calls[0]?.[0]);
    expect(workers).toHaveBeenCalledWith(2);
    destroy();
    expect(dispose).not.toHaveBeenCalled();
    expect(() => acquireModelDecoder('draco', first)).toThrow('createDracoIntegration');
    releaseFirst();
    releaseFirst();
    expect(dispose).not.toHaveBeenCalled();
    releaseSecond();
    expect(dispose).toHaveBeenCalledOnce();
  });

  it('warns once for both codecs but allows both to load', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    cleanups.push(setupThreeIntegrations([createMeshoptIntegration(), createDracoIntegration()]));
    expect(warn).toHaveBeenCalledOnce();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Prefer one codec'));
    acquireModelDecoder('meshopt', new GLTFLoader())();
    acquireModelDecoder('draco', new GLTFLoader())();
  });

  it('rolls back earlier integrations when a duplicate codec is registered', () => {
    expect(() =>
      setupThreeIntegrations([createMeshoptIntegration(), createMeshoptIntegration()]),
    ).toThrow('already registered');
    expect(() => acquireModelDecoder('meshopt', new GLTFLoader())).toThrow('not registered');
  });

  it('does not retain a lease when loader configuration throws', () => {
    const dispose = vi.fn<() => void>();
    const destroy = registerModelDecoder(
      'meshopt',
      () => {
        throw new Error('configuration failed');
      },
      dispose,
    );
    cleanups.push(destroy);
    expect(() => acquireModelDecoder('meshopt', new GLTFLoader())).toThrow('configuration failed');
    destroy();
    expect(dispose).toHaveBeenCalledOnce();
  });

  it('releases the decoder lease when model parsing fails after unregister', async () => {
    const dispose = vi.fn<() => void>();
    const destroy = registerModelDecoder('meshopt', () => {}, dispose);
    cleanups.push(destroy);
    let rejectLoad: (error: Error) => void = () => {};
    vi.spyOn(GLTFLoader.prototype, 'loadAsync').mockReturnValue(
      new Promise((_, reject) => {
        rejectLoad = reject;
      }),
    );
    const pending = loadThreeModel({
      category: 'models',
      id: 'broken',
      assetMode: 'resource',
      source: { src: 'broken.glb', compression: 'meshopt' },
    });
    destroy();
    expect(dispose).not.toHaveBeenCalled();
    rejectLoad(new Error('parse failed'));
    await expect(pending).rejects.toThrow('Cannot load model "broken": parse failed');
    expect(dispose).toHaveBeenCalledOnce();
  });

  it.each([0, -1, 1.5])('rejects invalid worker limit %s before registration', (workerLimit) => {
    expect(() => createDracoIntegration({ workerLimit }).setup()).toThrow('positive integer');
  });
});
