import { z } from 'zod';

/** Enabled stats request every metric in expanded mode unless explicitly configured. */
const statsOptionsSchema = z.strictObject({
  display: z.enum(['expanded', 'compact']).default('expanded'),
  fps: z.boolean().default(true),
  frameInterval: z.boolean().default(true),
  jsHeap: z.boolean().default(true),
  /** Submitted draw operations, not rendered objects, triangles, or instances. */
  drawCalls: z.boolean().default(true),
  /** Calls to bindTexture, not the number of allocated or unique textures. */
  textureBinds: z.boolean().default(true),
  /** Calls to useProgram, not the number of allocated or unique programs. */
  programUses: z.boolean().default(true),
});

/** Resolves the shorthand once into disabled stats or explicit display and panel settings. */
export const statsSchema = z
  .union([z.boolean(), statsOptionsSchema])
  .default(false)
  .transform((stats) => (stats === true ? statsOptionsSchema.parse({}) : stats));
