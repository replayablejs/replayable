import { getGPUTier } from '@pmndrs/detect-gpu';

import type { GpuTierDetection, GpuTierDetector } from '#types/gpu.js';

import { loadLocalBenchmarks } from './load-local-benchmarks.js';

const MOBILE_USER_AGENT_PATTERN = /Android|iPad|iPhone|iPod/i;
const IPAD_USER_AGENT_PATTERN = /iPad/i;
const IPAD_DESKTOP_PLATFORM = 'MacIntel';

/**
 * Creates lazy GPU detection without owning a WebGL context.
 *
 * `getGPUTier` creates and releases its intended temporary context internally. Replayable supplies
 * only platform facts and the bundled benchmark loader, ensuring the operation performs no fetch.
 */
export function createGpuTierDetector(): GpuTierDetector {
  let detection: Promise<GpuTierDetection> | undefined;

  return {
    detect(): Promise<GpuTierDetection> {
      detection ??= detectGpuTier();

      return detection;
    },
  };
}

/** Skips desktop benchmarking and classifies supported mobile platform forms. */
async function detectGpuTier(): Promise<GpuTierDetection> {
  const platform = readMobilePlatform(navigator);

  if (!platform.mobile) {
    return { device: 'desktop' };
  }

  const result = await getGPUTier({
    override: {
      isIpad: platform.ipad,
      isMobile: true,
      loadBenchmarks: loadLocalBenchmarks,
    },
  });

  return { device: 'mobile', result };
}

/** Recognizes mobile user agents and iPads that request their desktop user agent. */
export function readMobilePlatform(
  navigatorValue: Pick<Navigator, 'maxTouchPoints' | 'platform' | 'userAgent'>,
): { readonly ipad: boolean; readonly mobile: boolean } {
  const desktopIpad =
    navigatorValue.platform === IPAD_DESKTOP_PLATFORM && navigatorValue.maxTouchPoints > 1;
  const ipad = IPAD_USER_AGENT_PATTERN.test(navigatorValue.userAgent) || desktopIpad;

  return {
    ipad,
    mobile: ipad || MOBILE_USER_AGENT_PATTERN.test(navigatorValue.userAgent),
  };
}
