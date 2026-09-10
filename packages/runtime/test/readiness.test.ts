import { describe, expect, it, vi } from 'vitest';

import type { Assets } from '../src/types/assets.js';
import type { HostAdapter } from '../src/types/host-adapter.js';
import type { Playable, RuntimeDefinition, RuntimeState } from '../src/types/runtime.js';

const harness = vi.hoisted(() => {
  const primaryLoad = Promise.withResolvers<void>();
  const screenInitialization = Promise.withResolvers<void>();

  function load(): Promise<void> {
    return primaryLoad.promise;
  }

  function markReady(): void {}

  function initializeScreen(): Promise<void> {
    return screenInitialization.promise;
  }

  return {
    initializeScreen: vi.fn<typeof initializeScreen>(initializeScreen),
    load: vi.fn<typeof load>(load),
    markReady: vi.fn<typeof markReady>(markReady),
    primaryLoad,
    screenInitialization,
  };
});

vi.mock('#audio', () => ({
  createAudio: () => ({
    setVisible: (): void => {},
    unlock: (): void => {},
    update: (): void => {},
  }),
}));
vi.mock('#lifecycle/interaction.js', () => ({ observeUserActivity: (): void => {} }));
vi.mock('#loader/create-asset-loader.js', () => ({
  createAssetLoader: () => ({ load: harness.load }),
}));
vi.mock('#localization/create-localization.js', () => ({
  createLocalization: () => ({}),
}));
vi.mock('#screen/create-screen.js', () => ({
  createScreen: () => ({
    frame: { height: 100, width: 100, x: 0, y: 0 },
    initialize: harness.initializeScreen,
    update: (): void => {},
  }),
}));
vi.mock('#shell/apply-screen-frame.js', () => ({ applyScreenFrame: (): void => {} }));
vi.mock('#shell/install-interaction-guards.js', () => ({
  installInteractionGuards: (): void => {},
}));
vi.mock('#shell/resolve-playable-shell.js', () => ({
  resolvePlayableShell: () => ({
    container: {},
    loadingIndicator: { remove: (): void => {} },
    root: {},
  }),
}));
vi.mock('#update/create-runtime-updates.js', () => ({
  createRuntimeUpdates: () => ({
    activeTime: { add: () => (): void => {} },
    fixedUpdate: { add: () => (): void => {} },
    markReady: harness.markReady,
    setVisible: (): void => {},
    update: { add: () => (): void => {} },
  }),
}));

describe('runtime readiness', () => {
  it('exposes state only after primary loading and before update scheduling', async () => {
    const { createRuntime } = await import('../src/lifecycle/create-runtime.js');
    const notifyComplete = vi.fn<() => void>();
    const notifyReady = vi.fn<() => void>();
    const openStore = vi.fn<(url: string) => void>();
    let stateObservedAtMarkReady: RuntimeState | undefined;
    let runtime: Playable;

    harness.markReady.mockImplementation(() => {
      stateObservedAtMarkReady = runtime.state;
    });

    runtime = createRuntime({
      adapter: createHostAdapter({ notifyComplete, notifyReady, openStore }),
      assets: { primary: {} } satisfies Assets,
      definition: createRuntimeDefinition(),
    });

    expect(() => runtime.state).toThrow('Await playable.ready() first.');
    expect(() => runtime.complete('success')).toThrow('before await playable.ready()');

    let stateObservedAtCompletion: RuntimeState | undefined;
    const completions: RuntimeState['completion'][] = [];

    runtime.on('complete', (completion) => {
      stateObservedAtCompletion = runtime.state;
      completions.push(completion);
    });

    const readiness = runtime.ready();

    expect(harness.initializeScreen).toHaveBeenCalledOnce();
    expect(harness.load).not.toHaveBeenCalled();

    harness.screenInitialization.resolve();
    await vi.waitFor(() => expect(harness.load).toHaveBeenCalledWith('primary'));
    expect(notifyReady).not.toHaveBeenCalled();
    expect(() => runtime.state).toThrow('Await playable.ready() first.');

    harness.primaryLoad.resolve();
    await readiness;

    expect(runtime.state.visible).toBe(true);
    expect(notifyReady).toHaveBeenCalledOnce();
    expect(stateObservedAtMarkReady?.visible).toBe(true);
    expect(runtime.state.completion).toBeUndefined();

    runtime.openStore();

    expect(openStore).toHaveBeenCalledExactlyOnceWith(
      'https://play.google.com/store/apps/details?id=replayable',
    );

    runtime.complete('success');

    expect(runtime.state.completion).toEqual({ reason: 'success' });
    expect(notifyComplete).toHaveBeenCalledOnce();
    expect(stateObservedAtCompletion?.completion).toEqual({ reason: 'success' });
    expect(completions).toEqual([{ reason: 'success' }]);
    expect(() => runtime.complete('success')).toThrow(
      'Playable already completed with reason "success".',
    );
    expect(() => runtime.complete('failure')).toThrow(
      'Playable already completed with reason "success".',
    );
  });
});

function createHostAdapter(
  implementation: Pick<HostAdapter, 'notifyComplete' | 'notifyReady' | 'openStore'>,
): HostAdapter {
  return {
    async initialize() {
      return {
        visible: true,
        volume: 1,
        viewport: { height: 844, width: 390 },
      };
    },

    ...implementation,
  };
}

function createRuntimeDefinition(): RuntimeDefinition {
  const orientation = {
    enabled: true,
    height: 844,
    ratio: { max: 1, min: 0 },
    width: 390,
  };

  return {
    assetMode: 'resource',
    config: {
      audio: false,
      backgroundColor: '#000000',
      devtools: { stats: false, endCardTrigger: false, soundControl: false },
      completion: { durationStart: 'ready' },
      controls: { persistentCta: true },
      endCard: { animation: 'continuous', interaction: 'full-screen' },
      id: 'default/preview/en',
      localization: { language: 'en' },
      network: 'preview',
      params: {},
      screen: {
        orientations: {
          landscape: orientation,
          portrait: orientation,
        },
        resolution: {
          pixelRatio: { max: 1, min: 1 },
          renderScale: { balanced: 1, full: 1, minimal: 1, reduced: 1 },
        },
      },
      store: {
        androidUrl: 'https://play.google.com/store/apps/details?id=replayable',
        iosUrl: 'https://apps.apple.com/app/replayable',
      },
      version: 'default',
    },
    storeUrl: 'https://play.google.com/store/apps/details?id=replayable',
  };
}
