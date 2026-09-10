import { spawn } from 'node:child_process';

import ffmpeg from '@ffmpeg-installer/ffmpeg';

import type { AudioTranscodeRequest } from '#types/adapters.js';
import type { SoundOptions } from '#types/asset-options.js';

/**
 * Runs the bundled FFmpeg executable to produce one encoded audio candidate.
 *
 * The executable is spawned directly rather than through a shell, so paths are
 * passed as literal arguments and require no quoting. Standard output is not
 * used. FFmpeg's standard error is retained because it contains both progress
 * information and the useful diagnostic when decoding or encoding fails.
 *
 * The promise resolves only after FFmpeg exits successfully. It rejects when
 * the executable cannot start or exits with a non-zero status.
 *
 * @example
 *
 * ```ts
 * await transcodeAudio({
 *   format: 'mp3',
 *   inputPath: '/project/raw-assets/sounds/click.wav',
 *   options: { bitrate: 96, channels: 'mono', sampleRate: 32000 },
 *   outputPath: '/project/assets/generated/sounds/click.mp3',
 * });
 * ```
 */
export function transcodeAudio(request: AudioTranscodeRequest): Promise<void> {
  const ffmpegArguments = createFfmpegArguments(request);

  return new Promise((resolve, reject) => {
    const childProcess = spawn(ffmpeg.path, ffmpegArguments, {
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    let diagnostics = '';

    // FFmpeg reports ordinary progress and failures through stderr. Preserve
    // the complete stream so a non-zero exit includes the original diagnostic.
    childProcess.stderr.on('data', (chunk: Buffer) => {
      diagnostics += chunk.toString();
    });

    // `error` means the process itself could not be started, for example when
    // the bundled executable is missing or is not executable.
    childProcess.on('error', reject);

    // `close` fires after the process exits and its stdio streams are closed,
    // ensuring every diagnostic chunk has been collected before rejection.
    childProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`FFmpeg failed for ${request.inputPath}: ${diagnostics}`));
    });
  });
}

/**
 * Converts a transcode request into a deterministic FFmpeg argument list.
 *
 * For an MP3 request using 96 kbps, 32 kHz, and mono audio, the returned
 * arguments represent this command:
 *
 * ```text
 * ffmpeg -y -i click.wav -map 0:a:0 -c:a libmp3lame -b:a 96k -ar 32000 -ac 1 click.mp3
 * ```
 *
 * M4A uses FFmpeg's AAC encoder instead. When `channels` is `source`, the
 * `-ac` pair is omitted and FFmpeg preserves the input stream's channel count.
 * The returned array excludes the executable path because `spawn` receives it
 * separately.
 */
function createFfmpegArguments(request: AudioTranscodeRequest): string[] {
  const { format, inputPath, options, outputPath } = request;
  const codec = format === 'm4a' ? 'aac' : 'libmp3lame';
  const channelArguments = createChannelArguments(options.channels);

  return [
    // Replace a stale candidate from an interrupted previous build.
    '-y',
    // Read the authored source and select its first audio stream. Explicit
    // mapping prevents embedded cover art or video streams from entering M4A.
    '-i',
    inputPath,
    '-map',
    '0:a:0',
    // Encode with the codec belonging to the requested output container.
    '-c:a',
    codec,
    // Apply identical size-sensitive settings to both candidate formats.
    '-b:a',
    `${options.bitrate}k`,
    '-ar',
    String(options.sampleRate),
    ...channelArguments,
    outputPath,
  ];
}

/** Returns FFmpeg's optional output-channel arguments. */
function createChannelArguments(channels: SoundOptions['channels']): string[] {
  if (channels === 'source') {
    return [];
  }

  return ['-ac', channels === 'mono' ? '1' : '2'];
}
