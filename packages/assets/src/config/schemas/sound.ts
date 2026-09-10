import { z } from 'zod';

import { assetRuleSchema } from './base.js';

/** Encoding settings applied to every generated MP3 and M4A candidate. */
export const soundOptionsSchema = z.strictObject({
  /** Target audio bitrate in kilobits per second. */
  bitrate: z.number().int().min(8).max(512).default(96),
  /** Output channel layout, or the source file's original channel count. */
  channels: z.enum(['mono', 'stereo', 'source']).default('mono'),
  /** Output sample rate in hertz. */
  sampleRate: z.number().int().min(8000).max(192000).default(32000),
});

/**
 * Rule for producing the smallest MP3 or M4A runtime file.
 * Defaults favor compact playable delivery: 96 kbps, mono, and 32 kHz.
 */
export const soundRuleSchema = assetRuleSchema.extend({
  options: soundOptionsSchema.prefault({}),
});
