import { createAudio } from '#audio';
import { createRuntimeState } from '#lifecycle/create-runtime-state.js';
import { observeUserActivity } from '#lifecycle/interaction.js';
import { createAssetLoader } from '#loader/create-asset-loader.js';
import { createLocalization } from '#localization/create-localization.js';
import { createScreen } from '#screen/create-screen.js';
import { applyScreenFrame } from '#shell/apply-screen-frame.js';
import { installInteractionGuards } from '#shell/install-interaction-guards.js';
import { resolvePlayableShell } from '#shell/resolve-playable-shell.js';
import { createTimers } from '#timers/create-timers.js';
import type { PlayableCompletionReason } from '#types/completion.js';
import type { CreateRuntimeOptions } from '#types/lifecycle.js';
import type {
  Playable,
  RuntimeEventListener,
  RuntimeEventMap,
  RuntimeState,
} from '#types/runtime.js';
import { createRuntimeUpdates } from '#update/create-runtime-updates.js';

/**
 * Creates the public runtime around one concrete host adapter.
 *
 * Host-specific facts enter through the adapter, the state controller applies
 * Replayable lifecycle policy, and this function owns their shared readiness.
 */
export function createRuntime({ adapter, assets, definition }: CreateRuntimeOptions): Playable {
  const { assetMode, config, storeUrl } = definition;
  const shell = resolvePlayableShell();
  const loader = createAssetLoader(assets, assetMode);
  const runtimeState = createRuntimeState(config);
  const screen = createScreen(config.screen, shell.root);
  const localization = createLocalization(config.localization, loader);
  const audio = createAudio(loader);
  const runtimeUpdates = createRuntimeUpdates();
  const timerController = createTimers(runtimeUpdates.activeTime);
  const completionTimers = timerController.createCompletion(config.completion, runtimeState);
  let readiness: Promise<void> | undefined;
  let runtimeReady = false;

  installInteractionGuards(shell.root);
  runtimeState.on('audiochange', handleAudioChange);
  runtimeState.on('complete', handleCompletion);
  runtimeState.on('interaction', handleFirstInteraction);
  runtimeState.on('resize', handleResize);
  runtimeState.on('visibilitychange', handleVisibilityChange);

  return {
    ready,
    config,

    get state(): RuntimeState {
      return requireRuntimeState();
    },

    container: shell.container,
    screen,
    loader,
    localization,
    audio,
    timers: timerController.timers,

    update: runtimeUpdates.update,
    fixedUpdate: runtimeUpdates.fixedUpdate,
    postRender: runtimeUpdates.postRender,
    on,

    complete,
    openStore,
  };

  /** Initializes the runtime once and returns the same promise to every caller. */
  function ready(): Promise<void> {
    readiness ??= initializeRuntime();

    return readiness;
  }

  /** Returns lifecycle state only after runtime initialization has completed. */
  function requireRuntimeState(): RuntimeState {
    if (!runtimeReady) {
      throw new Error('Replayable runtime is not ready. Await playable.ready() first.');
    }

    return runtimeState.get();
  }

  /** Subscribes to one normalized runtime lifecycle event. */
  function on<Event extends keyof RuntimeEventMap>(
    event: Event,
    listener: RuntimeEventListener<Event>,
  ): () => void {
    return runtimeState.on(event, listener);
  }

  /** Commits the playable's terminal outcome after initialization. */
  function complete(reason: PlayableCompletionReason): void {
    if (!runtimeReady) {
      throw new Error('Cannot complete the playable before await playable.ready().');
    }

    runtimeState.applyCompletion(reason);
  }

  /** Opens the platform-specific store destination through the active host. */
  function openStore(): void {
    adapter.openStore(storeUrl);
  }

  /** Resolves host and screen capability concurrently, then loads startup assets. */
  async function initializeRuntime(): Promise<void> {
    const [snapshot] = await Promise.all([
      adapter.initialize(runtimeState.applyHostUpdate),
      screen.initialize(),
    ]);

    runtimeUpdates.setVisible(snapshot.visible);
    runtimeState.initialize(snapshot);
    handleAudioChange(runtimeState.get().audio);
    observeUserActivity(handleUserActivity);

    await loader.load('primary');

    shell.loadingIndicator?.remove();
    runtimeReady = true;
    adapter.notifyReady?.();
    completionTimers.start(runtimeState.get().interacted);
    runtimeUpdates.markReady();
  }

  /** Keeps the selected audio implementation aligned with effective runtime state. */
  function handleAudioChange(state: RuntimeState['audio']): void {
    audio.update(state);
  }

  /** Stops automatic timer work after either manual or automatic completion. */
  function handleCompletion(): void {
    completionTimers.stop();
    adapter.notifyComplete?.();
  }

  /** Applies one-time policies while the first interaction owns user activation. */
  function handleFirstInteraction(): void {
    audio.unlock();
    completionTimers.recordFirstInteraction();
  }

  /** Publishes first interaction when necessary and resets activity-driven timers. */
  function handleUserActivity(): void {
    runtimeState.applyFirstInteraction();
    completionTimers.recordActivity();
    timerController.recordActivity();
  }

  /** Updates engine-neutral screen state before applying its frame to the DOM shell. */
  function handleResize(viewport: RuntimeState['viewport']): void {
    screen.update(viewport);
    applyScreenFrame(shell.container, screen.frame);
  }

  /** Keeps frame scheduling aligned with the host's normalized viewability. */
  function handleVisibilityChange(visible: boolean): void {
    audio.setVisible(visible);
    runtimeUpdates.setVisible(visible);
  }
}
