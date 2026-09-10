import type { RenderPolicy, GpuTierDetection, GpuTierDetector } from '#types/gpu.js';

const benchmarkPolicyByTier: Readonly<Record<number, RenderPolicy>> = {
  0: 'minimal',
  1: 'reduced',
  2: 'balanced',
  3: 'full',
};

/** Detects and normalizes capability, using a conservative policy when detection throws. */
export async function detectRenderPolicy(detector: GpuTierDetector): Promise<RenderPolicy> {
  try {
    return resolveRenderPolicy(await detector.detect());
  } catch {
    return 'reduced';
  }
}

/** Converts detector-specific output into Replayable's stable named policy. */
export function resolveRenderPolicy(detection: unknown): RenderPolicy {
  if (!isGpuTierDetection(detection)) {
    return 'reduced';
  }

  if (detection.device === 'desktop') {
    return 'full';
  }

  const { result } = detection;

  switch (result.type) {
    case 'BLOCKLISTED':
    case 'WEBGL_UNSUPPORTED':
      return 'minimal';
    case 'BENCHMARK':
      return benchmarkPolicyByTier[result.tier] ?? 'reduced';
    case 'BENCHMARK_FETCH_FAILED':
    case 'FALLBACK':
    case 'SSR':
      return 'reduced';
    default:
      return 'reduced';
  }
}

/** Validates the small detector result surface before policy selection. */
function isGpuTierDetection(value: unknown): value is GpuTierDetection {
  if (typeof value !== 'object' || value === null || !('device' in value)) {
    return false;
  }

  if (value.device === 'desktop') {
    return true;
  }

  if (value.device !== 'mobile' || !('result' in value)) {
    return false;
  }

  const { result } = value;

  return (
    typeof result === 'object' &&
    result !== null &&
    'tier' in result &&
    typeof result.tier === 'number' &&
    'type' in result &&
    typeof result.type === 'string'
  );
}
