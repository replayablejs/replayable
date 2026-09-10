import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createScreen } from '../src/screen/create-screen.js';
import { measureSafeArea } from '../src/screen/measure-safe-area.js';
import type { RuntimeScreenConfig } from '../src/types/screen.js';

const gpu = vi.hoisted(() => {
  const state = {
    renderPolicy: 'full' as 'balanced' | 'full' | 'minimal' | 'reduced',
  };

  function detectRenderPolicy(): Promise<typeof state.renderPolicy> {
    return Promise.resolve(state.renderPolicy);
  }

  return {
    detectRenderPolicy: vi.fn<typeof detectRenderPolicy>(detectRenderPolicy),
    state,
  };
});

vi.mock('../src/screen/gpu/create-gpu-tier-detector.js', () => ({
  createGpuTierDetector: () => ({ detect: (): Promise<never> => Promise.reject() }),
}));
vi.mock('../src/screen/gpu/resolve-render-policy.js', () => ({
  detectRenderPolicy: gpu.detectRenderPolicy,
}));

const screenConfig = {
  orientations: {
    landscape: {
      enabled: true,
      height: 700,
      ratio: { max: 2.4, min: 1.32 },
      width: 1400,
    },
    portrait: {
      enabled: true,
      height: 1400,
      ratio: { max: 0.76, min: 0.44 },
      width: 700,
    },
  },
  resolution: {
    pixelRatio: { max: 2, min: 1 },
    renderScale: { balanced: 0.85, full: 1, minimal: 0.55, reduced: 0.65 },
  },
} satisfies RuntimeScreenConfig;

// Only the dataset is touched; computed CSS is supplied by the test browser stub.
// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const root = { dataset: {} } as HTMLElement;
const readStyle = vi.fn<
  () => Pick<CSSStyleDeclaration, 'paddingLeft' | 'paddingRight' | 'paddingTop' | 'paddingBottom'>
>(() => ({
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '36px',
  paddingBottom: '24px',
}));

beforeEach(() => {
  readStyle.mockClear();
  vi.stubGlobal('getComputedStyle', readStyle);
});

afterEach(() => {
  gpu.detectRenderPolicy.mockClear();
  gpu.state.renderPolicy = 'full';
  vi.unstubAllGlobals();
});

describe('screen resolution', () => {
  it('uses the whole local frame when CSS provides no insets', () => {
    readStyle.mockReturnValueOnce({
      paddingLeft: '',
      paddingRight: '',
      paddingTop: '',
      paddingBottom: '',
    });
    expect(measureSafeArea(root, { x: 50, y: 20, width: 400, height: 800 }, 'portrait')).toEqual({
      x: 0,
      y: 0,
      width: 400,
      height: 800,
    });
  });

  it('never returns negative content dimensions when margins exceed the frame', () => {
    expect(measureSafeArea(root, { x: 0, y: 0, width: 10, height: 10 }, 'portrait')).toEqual({
      x: 10,
      y: 10,
      width: 0,
      height: 0,
    });
  });

  it('caches content bounds until resize without changing the fullscreen frame', async () => {
    vi.stubGlobal('window', { devicePixelRatio: 2 });
    const screen = createScreen(screenConfig, root);
    await screen.initialize();
    screen.update({ width: 400, height: 800 });
    const area = screen.safeArea;
    expect(area).toEqual({ x: 12, y: 36, width: 376, height: 740 });
    expect(screen.safeArea).toBe(area);
    expect(readStyle).toHaveBeenCalledExactlyOnceWith(root, '::before');
    expect(root.dataset.orientation).toBe('portrait');
    screen.update({ width: 800, height: 400 });
    expect(readStyle).toHaveBeenCalledTimes(2);
    expect(root.dataset.orientation).toBe('landscape');
    expect(screen.safeArea).toEqual({ x: 12, y: 36, width: 776, height: 340 });
    expect(screen.frame).toEqual({ x: 0, y: 0, width: 800, height: 400 });
  });

  it.each([
    ['minimal', 1.1],
    ['reduced', 1.3],
    ['balanced', 1.7],
    ['full', 2],
  ] as const)('applies the %s render scale after clamping DPR', async (renderPolicy, expected) => {
    gpu.state.renderPolicy = renderPolicy;
    vi.stubGlobal('window', { devicePixelRatio: 3 });
    const screen = createScreen(screenConfig, root);

    await screen.initialize();
    screen.update({ height: 800, width: 400 });

    expect(screen.resolution).toBeCloseTo(expected);
  });

  it.each([
    [0.5, 1],
    [1.5, 1.5],
    [3, 2],
  ])('clamps device pixel ratio %f to %f before scaling', async (devicePixelRatio, expected) => {
    vi.stubGlobal('window', { devicePixelRatio });
    const screen = createScreen(screenConfig, root);

    await screen.initialize();
    screen.update({ height: 800, width: 400 });

    expect(screen.resolution).toBe(expected);
  });

  it('requires initialization once and reuses its policy across resizes', async () => {
    vi.stubGlobal('window', { devicePixelRatio: 2 });
    const screen = createScreen(screenConfig, root);

    expect(() => screen.update({ height: 800, width: 400 })).toThrow(
      'Replayable screen must be initialized before it can be updated.',
    );

    await screen.initialize();
    screen.update({ height: 800, width: 400 });
    screen.update({ height: 400, width: 800 });

    expect(gpu.detectRenderPolicy).toHaveBeenCalledOnce();
  });

  it('does not change logical screen geometry when reducing renderer resolution', async () => {
    gpu.state.renderPolicy = 'minimal';
    vi.stubGlobal('window', { devicePixelRatio: 2 });
    const screen = createScreen(screenConfig, root);

    await screen.initialize();
    screen.update({ height: 800, width: 400 });

    expect(screen).toMatchObject({
      design: { height: 1400, width: 700 },
      frame: { height: 800, width: 400, x: 0, y: 0 },
      orientation: 'portrait',
      scale: 400 / 700,
      viewport: { height: 800, width: 400 },
    });
  });
});
