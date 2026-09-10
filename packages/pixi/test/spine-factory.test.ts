import { BoneData, SkeletonData } from '@esotericsoftware/spine-pixi-v8';
import { Ticker } from 'pixi.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fixtures = vi.hoisted(() => ({
  spines: {} as Record<string, unknown>,
}));

vi.mock('@replayablejs/runtime', () => ({
  playable: { loader: { cache: { spines: fixtures.spines } } },
}));

import { createSpine } from '../src/spine/factories/create-spine.js';

beforeEach(() => {
  // createPixi performs this setup before application factories are used.
  Ticker.shared.autoStart = false;
  Ticker.shared.stop();

  for (const id of Object.keys(fixtures.spines)) {
    delete fixtures.spines[id];
  }
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Spine factory', () => {
  it('resolves loaded skeleton data and applies Replayable defaults', () => {
    fixtures.spines.hero = createSkeletonData();

    const spine = createSpine({ skeleton: 'hero' });

    expect(spine.position).toMatchObject({ x: 0, y: 0 });
    expect(spine.scale).toMatchObject({ x: 1, y: 1 });
    expect(spine.state.data.defaultMix).toBe(0.2);
    expect(spine.state.timeScale).toBe(1);
    expect(spine.autoUpdate).toBe(true);
    expect(spine.parent).toBeNull();

    spine.destroy();
  });

  it('applies transform and animation overrides', () => {
    fixtures.spines.hero = createSkeletonData();

    const spine = createSpine({
      alpha: 0.5,
      defaultMix: 0.1,
      position: { x: 12, y: 24 },
      scale: { x: 2, y: 3 },
      skeleton: 'hero',
      speed: 1.5,
      visible: false,
    });

    expect(spine.position).toMatchObject({ x: 12, y: 24 });
    expect(spine.scale).toMatchObject({ x: 2, y: 3 });
    expect(spine.alpha).toBe(0.5);
    expect(spine.visible).toBe(false);
    expect(spine.state.data.defaultMix).toBe(0.1);
    expect(spine.state.timeScale).toBe(1.5);

    spine.destroy();
  });

  it('rejects skeleton IDs that have not been loaded', () => {
    expect(() => createSpine({ skeleton: 'missing' })).toThrow(
      'Spine asset "missing" has not been loaded.',
    );
  });

  it('updates from the Replayable-driven Pixi ticker and detaches when destroyed', () => {
    const requestFrame = vi.fn<(callback: FrameRequestCallback) => number>();
    vi.stubGlobal('requestAnimationFrame', requestFrame);
    fixtures.spines.hero = createSkeletonData();
    const spine = createSpine({ skeleton: 'hero' });
    const updateAnimationState = vi.spyOn(spine.state, 'update');

    Ticker.shared.lastTime = 0;
    Ticker.shared.update(16);

    expect(updateAnimationState).toHaveBeenCalledOnce();
    expect(updateAnimationState).toHaveBeenCalledWith(0.016);
    expect(requestFrame).not.toHaveBeenCalled();

    spine.destroy();
    Ticker.shared.update(32);

    expect(updateAnimationState).toHaveBeenCalledOnce();
  });
});

function createSkeletonData(): SkeletonData {
  const skeletonData = new SkeletonData();

  skeletonData.bones.push(new BoneData(0, 'root', null));

  return skeletonData;
}
