import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

import { transcodeAudio } from '#adapters/audio-transcoder.js';
import { createSimpleAssetId } from '#pipeline/asset-identity.js';
import { settleAssetTasks } from '#pipeline/settle-asset-tasks.js';
import type {
  GeneratedAudioFormat,
  GeneratedFile,
  ProcessedSoundAsset,
} from '#types/processed-assets.js';
import type { ResolvedSoundAsset } from '#types/resolved-assets.js';

import { selectSmallestOutput } from '../output-selection.js';

const SOUND_CANDIDATE_FORMATS = ['mp3', 'm4a'] as const satisfies readonly GeneratedAudioFormat[];

/**
 * Encodes one sound as MP3 and M4A, then keeps the smaller file.
 *
 * Both candidates pass through FFmpeg with the same bitrate, sample rate, and
 * channel configuration. Source files are never copied directly because that
 * would make their encoding settings incomparable with the other candidate.
 *
 * For example, `sounds/ui/click.wav` is encoded as temporary candidates
 * `click.mp3` and `click.m4a`. After their file sizes are measured, only the
 * smaller candidate remains on disk and becomes the file of the returned
 * runtime sound asset. The rejected candidate is deleted.
 *
 * Candidate order also provides deterministic tie-breaking: if both files
 * have exactly the same size, MP3 wins because it appears first. The returned
 * one-item array follows the common processor contract: one resolved sound
 * produces one processed asset.
 */
export async function processSound(asset: ResolvedSoundAsset): Promise<ProcessedSoundAsset[]> {
  const outputDirectory = dirname(asset.outputBasePath);

  await mkdir(outputDirectory, { recursive: true });

  const encodedCandidates = await settleAssetTasks(
    SOUND_CANDIDATE_FORMATS.map((format) => encodeSoundCandidate(asset, format)),
  );
  const selectedFile = await selectSmallestOutput(encodedCandidates);

  return [
    {
      bundle: asset.bundle,
      category: 'sounds',
      file: selectedFile,
      id: createSimpleAssetId(asset),
    },
  ];
}

/**
 * Encodes one candidate file and returns the metadata consumed by later stages.
 *
 * The generated-file descriptor identifies the candidate's format and path;
 * it does not contain audio data. After all candidates are encoded, their
 * descriptors allow smallest-file selection to measure and remove files.
 */
async function encodeSoundCandidate(
  asset: ResolvedSoundAsset,
  format: GeneratedAudioFormat,
): Promise<GeneratedFile<GeneratedAudioFormat>> {
  const outputPath = `${asset.outputBasePath}.${format}`;

  await transcodeAudio({
    format,
    inputPath: asset.absolutePath,
    options: asset.options,
    outputPath,
  });

  return { format, path: outputPath };
}
