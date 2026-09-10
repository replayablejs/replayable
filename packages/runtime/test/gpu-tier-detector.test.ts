import type { TierResult } from '@pmndrs/detect-gpu';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createGpuTierDetector,
  readMobilePlatform,
} from '../src/screen/gpu/create-gpu-tier-detector.js';
import { loadLocalBenchmarks } from '../src/screen/gpu/load-local-benchmarks.js';

type GetGPUTier = typeof import('@pmndrs/detect-gpu').getGPUTier;

const { getGPUTier } = vi.hoisted(() => ({ getGPUTier: vi.fn<GetGPUTier>() }));

vi.mock('@pmndrs/detect-gpu', () => ({ getGPUTier }));

const benchmarkResult = {
  fps: 60,
  gpu: 'apple gpu',
  isMobile: true,
  tier: 3,
  type: 'BENCHMARK',
} satisfies TierResult;

afterEach(() => {
  getGPUTier.mockReset();
  vi.unstubAllGlobals();
});

describe('GPU tier detection', () => {
  it.each([
    'Mozilla/5.0 (Linux; Android 14)',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_1 like Mac OS X)',
    'Mozilla/5.0 (iPad; CPU OS 16_1 like Mac OS X)',
    'Mozilla/5.0 (iPod touch; CPU iPhone OS 16_1 like Mac OS X)',
  ])('recognizes the mobile user agent %s', (userAgent) => {
    expect(readMobilePlatform(createNavigator(userAgent))).toMatchObject({ mobile: true });
  });

  it('recognizes an iPad using its desktop user agent', () => {
    expect(readMobilePlatform(createNavigator('Mozilla/5.0 (Macintosh)', 'MacIntel', 5))).toEqual({
      ipad: true,
      mobile: true,
    });
  });

  it('skips desktop detection and caches the result', async () => {
    vi.stubGlobal('navigator', createNavigator('Mozilla/5.0 (Macintosh)', 'MacIntel'));
    const detector = createGpuTierDetector();
    const firstDetection = detector.detect();

    expect(detector.detect()).toBe(firstDetection);
    await expect(firstDetection).resolves.toEqual({ device: 'desktop' });
    expect(getGPUTier).not.toHaveBeenCalled();
  });

  it('detects a mobile GPU once with the local loader and iPad facts', async () => {
    vi.stubGlobal('navigator', createNavigator('Mozilla/5.0 (Macintosh)', 'MacIntel', 5));
    getGPUTier.mockResolvedValue(benchmarkResult);
    const detector = createGpuTierDetector();
    const firstDetection = detector.detect();

    expect(detector.detect()).toBe(firstDetection);
    await expect(firstDetection).resolves.toEqual({ device: 'mobile', result: benchmarkResult });
    expect(getGPUTier).toHaveBeenCalledOnce();
    expect(getGPUTier).toHaveBeenCalledWith({
      override: {
        isIpad: true,
        isMobile: true,
        loadBenchmarks: loadLocalBenchmarks,
      },
    });
  });
});

function createNavigator(
  userAgent: string,
  platform = '',
  maxTouchPoints = 0,
): Pick<Navigator, 'maxTouchPoints' | 'platform' | 'userAgent'> {
  return { maxTouchPoints, platform, userAgent };
}
