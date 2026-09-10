import type { AnimationPlaybackControlsWithThen } from 'motion';
import { describe, expect, it, vi } from 'vitest';

import { createTweenLifecycle } from '../src/lifecycle/create-tween-lifecycle.js';

vi.mock('@replayablejs/runtime', () => ({ playable: {} }));

type MotionPlaybackState = AnimationPlaybackControlsWithThen['state'];

class FakeMotionControls {
  readonly duration = 1;
  cancelCalls = 0;
  completeCalls = 0;
  pauseCalls = 0;
  playCalls = 0;
  speed = 1;
  state: MotionPlaybackState;
  stopCalls = 0;
  time = 0;

  #completion = Promise.withResolvers<void>();

  constructor(state: MotionPlaybackState = 'running') {
    this.state = state;
  }

  get finished(): Promise<void> {
    return this.#completion.promise;
  }

  cancel(): void {
    this.cancelCalls += 1;
    this.state = 'idle';
  }

  complete(): void {
    this.completeCalls += 1;
    this.state = 'finished';
    this.#completion.resolve();
  }

  finishNaturally(): void {
    this.state = 'finished';
    this.#completion.resolve();
  }

  pause(): void {
    this.pauseCalls += 1;
    this.state = 'paused';
  }

  play(): void {
    this.playCalls += 1;

    if (this.state === 'finished' || this.state === 'idle') {
      this.#completion = Promise.withResolvers<void>();
    }

    this.state = 'running';
  }

  stop(): void {
    this.stopCalls += 1;
    this.state = 'idle';
  }

  then(onResolve: () => void, onReject?: () => void): Promise<void> {
    return this.finished.then(onResolve, onReject);
  }
}

describe('tween lifecycle', () => {
  it('resumes only the children paused by visibility', () => {
    const host = createVisibilityHost(true);
    const lifecycle = createTweenLifecycle(host.runtime);
    const finished = new FakeMotionControls('finished');
    const paused = new FakeMotionControls('paused');
    const running = new FakeMotionControls();
    const group = Object.assign(new FakeMotionControls('finished'), {
      animations: [finished, paused, running],
    });
    const controls = lifecycle.manage(group);
    host.setVisible(false);
    host.setVisible(true);
    expect(finished.pauseCalls).toBe(0);
    expect(finished.playCalls).toBe(0);
    expect(paused.playCalls).toBe(0);
    expect(running.pauseCalls).toBe(1);
    expect(running.playCalls).toBe(1);
    controls.stop();
  });

  it('retains a replay requested while the previous completion settles hidden', async () => {
    const host = createVisibilityHost(true);
    const lifecycle = createTweenLifecycle(host.runtime);
    const motionControls = new FakeMotionControls();
    const controls = lifecycle.manage(motionControls);
    motionControls.finishNaturally();
    host.setVisible(false);
    controls.play();
    await motionControls.finished;
    await Promise.resolve();
    host.setVisible(true);
    expect(motionControls.playCalls).toBe(1);
    host.setVisible(false);
    expect(motionControls.pauseCalls).toBe(1);
    controls.stop();
  });

  it('observes the same playback only once across repeated play and visibility resumes', () => {
    const host = createVisibilityHost(true);
    const lifecycle = createTweenLifecycle(host.runtime);
    const motionControls = new FakeMotionControls();
    const subscribe = vi.spyOn(motionControls.finished, 'then');
    const controls = lifecycle.manage(motionControls);

    for (let index = 0; index < 5; index += 1) {
      controls.play();
      host.setVisible(false);
      controls.play();
      host.setVisible(true);
    }
    expect(subscribe).toHaveBeenCalledOnce();
    controls.stop();
  });

  it.each(['cancel', 'complete', 'stop'] as const)(
    'releases tracking when %s throws',
    (operation) => {
      const host = createVisibilityHost(true);
      const lifecycle = createTweenLifecycle(host.runtime);
      const motionControls = new FakeMotionControls();
      const controls = lifecycle.manage(motionControls);
      const failure = new Error('Consumer callback failed');
      vi.spyOn(motionControls, operation).mockImplementation(() => {
        throw failure;
      });

      expect(() => controls[operation]()).toThrow(failure);
      host.setVisible(false);
      expect(motionControls.pauseCalls).toBe(0);
    },
  );

  it('attempts termination for every group child even if one throws', () => {
    const host = createVisibilityHost(true);
    const lifecycle = createTweenLifecycle(host.runtime);
    const first = new FakeMotionControls();
    const second = new FakeMotionControls();
    const group = Object.assign(new FakeMotionControls(), { animations: [first, second] });
    const controls = lifecycle.manage(group);
    vi.spyOn(first, 'stop').mockImplementation(() => {
      throw new Error('Failed first child');
    });
    expect(() => controls.stop()).toThrow('Failed first child');
    expect(second.stopCalls).toBe(1);
    host.setVisible(false);
    expect(first.pauseCalls).toBe(0);
  });

  it('subscribes once and pauses and resumes running animation with visibility', () => {
    const host = createVisibilityHost(true);
    const lifecycle = createTweenLifecycle(host.runtime);
    const motionControls = new FakeMotionControls();

    expect(host.listenerCount()).toBe(1);

    const controls = lifecycle.manage(motionControls);

    expect(host.listenerCount()).toBe(1);

    host.setVisible(false);
    expect(motionControls.pauseCalls).toBe(1);

    host.setVisible(true);
    expect(motionControls.playCalls).toBe(1);

    controls.complete();
    expect(host.listenerCount()).toBe(1);
  });

  it('preserves a manual pause made while hidden', () => {
    const host = createVisibilityHost(true);
    const lifecycle = createTweenLifecycle(host.runtime);
    const motionControls = new FakeMotionControls();
    const controls = lifecycle.manage(motionControls);

    host.setVisible(false);
    controls.pause();
    host.setVisible(true);

    expect(motionControls.pauseCalls).toBe(2);
    expect(motionControls.playCalls).toBe(0);
  });

  it('defers a hidden-time play request until visibility returns', () => {
    const host = createVisibilityHost(false);
    const lifecycle = createTweenLifecycle(host.runtime);
    const motionControls = new FakeMotionControls('paused');
    const controls = lifecycle.manage(motionControls);

    controls.play();

    expect(motionControls.playCalls).toBe(0);

    host.setVisible(true);

    expect(motionControls.playCalls).toBe(1);
  });

  it.each(['cancel', 'complete', 'stop'] as const)('releases tracking after %s()', (operation) => {
    const host = createVisibilityHost(true);
    const lifecycle = createTweenLifecycle(host.runtime);
    const motionControls = new FakeMotionControls();
    const controls = lifecycle.manage(motionControls);

    controls[operation]();
    motionControls.state = 'running';
    host.setVisible(false);

    expect(motionControls.pauseCalls).toBe(0);
  });

  it('releases tracking after natural completion', async () => {
    const host = createVisibilityHost(true);
    const lifecycle = createTweenLifecycle(host.runtime);
    const motionControls = new FakeMotionControls();

    lifecycle.manage(motionControls);
    motionControls.finishNaturally();
    await motionControls.finished;
    // Lifecycle completion waits for the aggregate of all child promises.
    await Promise.resolve();
    motionControls.state = 'running';
    host.setVisible(false);

    expect(motionControls.pauseCalls).toBe(0);
  });

  it('tracks playback restarted after natural completion', async () => {
    const host = createVisibilityHost(true);
    const lifecycle = createTweenLifecycle(host.runtime);
    const motionControls = new FakeMotionControls();
    const controls = lifecycle.manage(motionControls);

    motionControls.finishNaturally();
    await motionControls.finished;
    controls.play();
    host.setVisible(false);

    expect(motionControls.pauseCalls).toBe(1);
  });

  it('does not let an older completion release immediately restarted playback', async () => {
    const host = createVisibilityHost(true);
    const lifecycle = createTweenLifecycle(host.runtime);
    const motionControls = new FakeMotionControls();
    const controls = lifecycle.manage(motionControls);

    controls.complete();
    controls.play();
    await Promise.resolve();
    host.setVisible(false);

    expect(motionControls.pauseCalls).toBe(1);
  });

  it('does not track playback after permanent stop', () => {
    const host = createVisibilityHost(true);
    const lifecycle = createTweenLifecycle(host.runtime);
    const motionControls = new FakeMotionControls();
    const controls = lifecycle.manage(motionControls);

    controls.stop();
    controls.play();
    host.setVisible(false);

    expect(motionControls.playCalls).toBe(0);
    expect(motionControls.pauseCalls).toBe(0);
  });

  it('preserves autoplay-disabled playback through visibility changes', () => {
    const host = createVisibilityHost(true);
    const lifecycle = createTweenLifecycle(host.runtime);
    const motionControls = new FakeMotionControls('paused');

    lifecycle.manage(motionControls);
    host.setVisible(false);
    host.setVisible(true);

    expect(motionControls.pauseCalls).toBe(0);
    expect(motionControls.playCalls).toBe(0);
  });

  it('ignores repeated identical visibility transitions', () => {
    const host = createVisibilityHost(true);
    const lifecycle = createTweenLifecycle(host.runtime);
    const motionControls = new FakeMotionControls();

    lifecycle.manage(motionControls);
    host.setVisible(false);
    host.setVisible(false);
    host.setVisible(true);
    host.setVisible(true);

    expect(motionControls.pauseCalls).toBe(1);
    expect(motionControls.playCalls).toBe(1);
  });

  it('rejects lifecycle creation before the runtime is ready', () => {
    const runtime = {
      get state(): never {
        throw new Error('Replayable runtime is not ready. Await playable.ready() first.');
      },
      on(): () => void {
        return (): void => {};
      },
    };

    expect(() => createTweenLifecycle(runtime)).toThrow('Await playable.ready() first.');
  });
});

function createVisibilityHost(initialVisible: boolean) {
  const listeners = new Set<(visible: boolean) => void>();
  let visible = initialVisible;

  return {
    listenerCount: (): number => listeners.size,

    runtime: {
      get state() {
        return { visible };
      },

      on(_event: 'visibilitychange', listener: (nextVisible: boolean) => void): () => void {
        listeners.add(listener);

        return (): void => {
          listeners.delete(listener);
        };
      },
    },

    setVisible(nextVisible: boolean): void {
      visible = nextVisible;

      for (const listener of listeners) {
        listener(visible);
      }
    },
  };
}
