import { rm, stat } from 'node:fs/promises';

import { settleAssetTasks } from '#pipeline/settle-asset-tasks.js';
import type { GeneratedOutput } from '#types/encoding.js';

/**
 * Selects the smallest file among equivalent generated candidates.
 *
 * The function measures the files on disk, deletes every larger candidate, and
 * returns the measured winner.
 * For example, `[hero.avif 8 KB, hero.webp 12 KB]` selects only `hero.avif`.
 * Equal sizes preserve input order, so the earlier automatic candidate wins a
 * tie. Callers must pass candidates for the same logical asset or texture page.
 */
export async function selectSmallestOutput<Asset extends GeneratedOutput>(
  outputs: readonly Asset[],
): Promise<Asset> {
  const firstOutput = outputs[0];

  if (firstOutput === undefined) {
    throw new Error('Cannot select an output from an empty candidate list.');
  }

  if (outputs.length === 1) {
    return firstOutput;
  }

  const outputsWithSizes = await settleAssetTasks(
    outputs.map(async (output) => ({ output, size: (await stat(output.path)).size })),
  );
  const smallestOutput = outputsWithSizes.reduce((selected, candidate) =>
    candidate.size < selected.size ? candidate : selected,
  ).output;

  // Deleting rejected candidates here ensures emitted modules and on-disk
  // files describe the same selected output.
  await settleAssetTasks(
    outputs
      .filter((output) => output !== smallestOutput)
      .map((output) => rm(output.path, { force: true })),
  );

  return smallestOutput;
}
