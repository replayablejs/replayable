import { z } from 'zod';

import type { ParsedPixiAtlasLayout } from '#types/adapters.js';

const pixiAtlasLayoutSchema = z.object({
  frames: z.union([z.record(z.string(), z.unknown()), z.array(z.object({ filename: z.string() }))]),
});

/**
 * Parses one third-party Pixi atlas layout while it is still in memory.
 *
 * Pixi atlas exporters support either an object keyed by frame name or an
 * array whose entries carry a `filename`. Replayable extracts those names for
 * registry generation and serializes the original object—not Zod's parsed
 * projection—so unrelated runtime fields such as `meta` remain intact.
 *
 * @param buffer - UTF-8 JSON bytes returned by the texture packer.
 * @returns Frame metadata and the complete minified JSON written at runtime.
 * @throws When the packer returns malformed JSON or an unsupported frame shape.
 */
export function parsePixiAtlasLayout(buffer: Buffer): ParsedPixiAtlasLayout {
  const layout: unknown = JSON.parse(buffer.toString('utf8'));
  const { frames } = pixiAtlasLayoutSchema.parse(layout);
  const frameNames = Array.isArray(frames)
    ? frames.map((frame) => frame.filename)
    : Object.keys(frames);

  return {
    frameNames,
    serializedJson: JSON.stringify(layout),
  };
}
