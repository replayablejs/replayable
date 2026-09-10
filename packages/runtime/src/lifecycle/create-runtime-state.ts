import { hasEqualAudioState, resolveAudioState } from '#audio/resolve-audio-state.js';
import type { PlayableCompletionReason } from '#types/completion.js';
import type { HostSnapshot, HostUpdate } from '#types/host-adapter.js';
import type { RuntimeListeners } from '#types/lifecycle.js';
import type {
  RuntimeConfig,
  RuntimeEventListener,
  RuntimeEventMap,
  RuntimeState,
} from '#types/runtime.js';
import type { RuntimeOrientation, RuntimeViewport } from '#types/screen.js';

/**
 * Owns normalized runtime state and the public events produced by its changes.
 *
 * Adapters report raw host facts without retaining Replayable state. This
 * controller applies lifecycle policy, suppresses duplicate changes, and emits
 * events only after the corresponding state has been committed. Project audio
 * capability participates in every effective-audio calculation, so a disabled
 * variant can never become allowed through interaction or host updates.
 *
 * For example, initializing from this browser-host snapshot:
 *
 * ```ts
 * {
 *   visible: true,
 *   volume: 0.5,
 *   viewport: { width: 390, height: 844 },
 * }
 * ```
 *
 * produces portrait runtime state with `interacted: false` and therefore
 * `audio: { allowed: false, volume: 0.5 }`. A later first interaction commits
 * `interacted: true`, synchronously emits `interaction`, and only then emits the
 * resulting allowed audio state.
 */
export function createRuntimeState(config: RuntimeConfig) {
  const audioEnabled = config.audio;
  const listeners: RuntimeListeners = {
    audiochange: new Set(),
    complete: new Set(),
    interaction: new Set(),
    resize: new Set(),
    visibilitychange: new Set(),
  };

  // An SDK may synchronously publish an event while its adapter is registering
  // listeners but before initialize() returns the authoritative first snapshot.
  // Those updates are preserved in arrival order and replayed after that
  // snapshot establishes the state against which they must be applied.
  const pendingHostUpdates: HostUpdate[] = [];

  let state: RuntimeState | undefined;

  /** Synchronously notifies the current listeners for one committed event. */
  const emit = <Event extends keyof RuntimeEventMap>(
    event: Event,
    value: RuntimeEventMap[Event],
  ): void => {
    for (const listener of listeners[event]) {
      listener(value);
    }
  };

  /** Commits changed viewport dimensions and their derived orientation. */
  const applyResize = (viewport: RuntimeViewport): void => {
    const currentState = requireState(state);

    if (hasEqualDimensions(currentState.viewport, viewport)) {
      return;
    }

    state = {
      ...currentState,
      orientation: deriveOrientation(viewport),
      viewport,
    };
    emit('resize', viewport);
  };

  /** Commits host viewability together with its derived effective audio state. */
  const applyVisibility = (visible: boolean): void => {
    const currentState = requireState(state);

    if (currentState.visible === visible) {
      return;
    }

    // Losing viewability also disables effective audio, even when host volume
    // and the user's interaction state have not changed.
    const audio = resolveAudioState(
      audioEnabled,
      currentState.interacted,
      visible,
      currentState.audio.volume,
    );

    state = { ...currentState, audio, visible };

    // Visibility listeners suspend or recover the audio context before the
    // following audio event applies its effective volume and muting policy.
    emit('visibilitychange', visible);

    if (!hasEqualAudioState(currentState.audio, audio)) {
      emit('audiochange', audio);
    }
  };

  /** Commits changed host volume and emits its resulting effective audio state. */
  const applyVolume = (volume: number): void => {
    const currentState = requireState(state);

    if (currentState.audio.volume === volume) {
      return;
    }

    const audio = resolveAudioState(
      audioEnabled,
      currentState.interacted,
      currentState.visible,
      volume,
    );

    state = { ...currentState, audio };
    emit('audiochange', audio);
  };

  /** Routes one host update now, or queues it until the first snapshot exists. */
  const applyHostUpdate = (update: HostUpdate): void => {
    if (state === undefined) {
      pendingHostUpdates.push(update);
      return;
    }

    switch (update.type) {
      case 'resize':
        applyResize(update.viewport);
        break;
      case 'visibilitychange':
        applyVisibility(update.visible);
        break;
      case 'volumechange':
        applyVolume(update.volume);
        break;
    }
  };

  /** Commits Replayable's one-time trusted-interaction transition. */
  const applyFirstInteraction = (): void => {
    const currentState = requireState(state);

    if (currentState.interacted) {
      return;
    }

    // A trusted first interaction satisfies Replayable's autoplay policy and
    // may therefore change effective audio together with interaction state.
    const audio = resolveAudioState(
      audioEnabled,
      true,
      currentState.visible,
      currentState.audio.volume,
    );

    state = { ...currentState, audio, interacted: true };

    // Runtime listeners use this event to invoke AudioContext.resume() while
    // the browser still considers the current task a trusted user interaction.
    // Effective audio is emitted afterward so unmuting cannot precede unlock.
    emit('interaction', true);

    if (!hasEqualAudioState(currentState.audio, audio)) {
      emit('audiochange', audio);
    }
  };

  /** Commits the only terminal outcome and synchronously publishes it. */
  const applyCompletion = (reason: PlayableCompletionReason): void => {
    const currentState = requireState(state);

    if (currentState.completion !== undefined) {
      throw new Error(
        `Playable already completed with reason "${currentState.completion.reason}".`,
      );
    }

    const completion = { reason };

    state = { ...currentState, completion };
    emit('complete', completion);
  };

  return {
    applyCompletion,
    applyFirstInteraction,
    applyHostUpdate,

    get(): RuntimeState {
      return requireState(state);
    },

    initialize(snapshot: HostSnapshot): void {
      state = createInitialState(snapshot, audioEnabled);

      // Initialization establishes the first real viewport. Publishing it
      // through the normal resize event lets renderer integrations subscribe
      // before ready() without starting runtime initialization themselves.
      emit('resize', snapshot.viewport);

      // Replay events captured during adapter initialization against the first
      // complete snapshot so no synchronous host change is lost. splice(0)
      // drains the queue exactly once while preserving its arrival order.
      for (const update of pendingHostUpdates.splice(0)) {
        applyHostUpdate(update);
      }
    },

    on<Event extends keyof RuntimeEventMap>(
      event: Event,
      listener: RuntimeEventListener<Event>,
    ): () => void {
      listeners[event].add(listener);

      // The returned function gives consumers ownership of subscription cleanup.
      return (): void => {
        listeners[event].delete(listener);
      };
    },
  };
}

/** Converts the first host snapshot into the complete public runtime state. */
function createInitialState(snapshot: HostSnapshot, audioEnabled: boolean): RuntimeState {
  return {
    audio: resolveAudioState(audioEnabled, false, snapshot.visible, snapshot.volume),
    completion: undefined,
    interacted: false,
    orientation: deriveOrientation(snapshot.viewport),
    visible: snapshot.visible,
    viewport: snapshot.viewport,
  };
}

/** Derives orientation from the actual ad container rather than the physical screen. */
function deriveOrientation(viewport: RuntimeViewport): RuntimeOrientation {
  return viewport.height >= viewport.width ? 'portrait' : 'landscape';
}

/** Compares only dimensions because viewport objects are recreated for every host event. */
function hasEqualDimensions(left: RuntimeViewport, right: RuntimeViewport): boolean {
  return left.height === right.height && left.width === right.width;
}

/** Prevents consumers from reading or invoking runtime behavior before host readiness. */
function requireState(state: RuntimeState | undefined): RuntimeState {
  if (state === undefined) {
    throw new Error('Replayable runtime is not ready.');
  }

  return state;
}
