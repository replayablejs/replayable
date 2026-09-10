import type { TierResult } from '@pmndrs/detect-gpu';

/** Internal result that lets policy normalization distinguish a skipped desktop benchmark. */
export type GpuTierDetection =
  | { readonly device: 'desktop' }
  | { readonly device: 'mobile'; readonly result: TierResult };

/** One cached GPU-tier query scoped to a single runtime instance. */
export interface GpuTierDetector {
  /** Returns the same detection promise for every call, including failures. */
  detect(): Promise<GpuTierDetection>;
}

/** Internal quality policy selected before calculating renderer resolution. */
export type RenderPolicy = 'minimal' | 'reduced' | 'balanced' | 'full';
