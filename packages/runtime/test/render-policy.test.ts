import type { TierType } from '@pmndrs/detect-gpu';
import { describe, expect, it } from 'vitest';

import {
  detectRenderPolicy,
  resolveRenderPolicy,
} from '../src/screen/gpu/resolve-render-policy.js';
import type { GpuTierDetector, RenderPolicy } from '../src/types/gpu.js';

describe('GPU render policy', () => {
  it('uses full resolution policy on desktop without a benchmark', () => {
    expect(resolveRenderPolicy({ device: 'desktop' })).toBe('full');
  });

  it.each<[number, RenderPolicy]>([
    [0, 'minimal'],
    [1, 'reduced'],
    [2, 'balanced'],
    [3, 'full'],
  ])('maps benchmark tier %i to %s', (tier, expectedPolicy) => {
    expect(resolveRenderPolicy(createMobileDetection('BENCHMARK', tier))).toBe(expectedPolicy);
  });

  it.each<TierType>(['BLOCKLISTED', 'WEBGL_UNSUPPORTED'])('uses minimal policy for %s', (type) => {
    expect(resolveRenderPolicy(createMobileDetection(type, 3))).toBe('minimal');
  });

  it.each<TierType>(['FALLBACK', 'BENCHMARK_FETCH_FAILED', 'SSR'])(
    'uses reduced policy for %s',
    (type) => {
      expect(resolveRenderPolicy(createMobileDetection(type, 0))).toBe('reduced');
    },
  );

  it.each([
    undefined,
    null,
    {},
    { device: 'mobile' },
    { device: 'mobile', result: { tier: '2', type: 'BENCHMARK' } },
    createMobileDetection('BENCHMARK', -1),
    createMobileDetection('BENCHMARK', 4),
    createMobileDetection('UNKNOWN', 2),
  ])('uses reduced policy for malformed or unknown output', (detection) => {
    expect(resolveRenderPolicy(detection)).toBe('reduced');
  });

  it('uses reduced policy when detection throws', async () => {
    const detector: GpuTierDetector = {
      detect: () => Promise.reject(new Error('WebGL failed')),
    };

    await expect(detectRenderPolicy(detector)).resolves.toBe('reduced');
  });
});

function createMobileDetection(type: string, tier: number): unknown {
  return {
    device: 'mobile',
    result: { tier, type },
  };
}
