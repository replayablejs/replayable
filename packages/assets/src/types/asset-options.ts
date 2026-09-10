import type { z } from 'zod';

import type { atlasOptionsSchema } from '#config/schemas/atlas.js';
import type { fontOptionsSchema } from '#config/schemas/font.js';
import type { imageOptionsSchema } from '#config/schemas/image.js';
import type { soundOptionsSchema } from '#config/schemas/sound.js';
import type { spineOptionsSchema } from '#config/schemas/spine.js';

/** Author-written atlas options accepted before defaults are applied. */
export type AtlasAssetOptions = z.input<typeof atlasOptionsSchema>;

/** Validated atlas options with every default applied. */
export type AtlasOptions = z.infer<typeof atlasOptionsSchema>;

/** Author-written font options accepted before validation. */
export type FontAssetOptions = z.input<typeof fontOptionsSchema>;

/** Validated options required to process and register one font. */
export type FontOptions = z.infer<typeof fontOptionsSchema>;

/** Author-written image options accepted before defaults are applied. */
export type ImageAssetOptions = z.input<typeof imageOptionsSchema>;

/** Validated image options with every default applied. */
export type ImageOptions = z.infer<typeof imageOptionsSchema>;

/** Author-written sound options accepted before defaults are applied. */
export type SoundAssetOptions = z.input<typeof soundOptionsSchema>;

/** Validated audio encoding options with every default applied. */
export type SoundOptions = z.infer<typeof soundOptionsSchema>;

/** Author-written image options applied to Spine texture pages. */
export type SpineAssetOptions = z.input<typeof spineOptionsSchema>;
