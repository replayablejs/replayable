import type { SoundOptions } from './asset-options.js';
import type { GeneratedAudioFormat } from './processed-assets.js';

/** Complete instruction for producing one encoded audio candidate. */
export interface AudioTranscodeRequest {
  /** Container format and corresponding codec to generate. */
  readonly format: GeneratedAudioFormat;
  /** Absolute path of the authored source audio. */
  readonly inputPath: string;
  /** Validated encoding settings shared by MP3 and M4A candidates. */
  readonly options: SoundOptions;
  /** Absolute destination path, including the matching file extension. */
  readonly outputPath: string;
}

/** Parsed values consumed by atlas processing and registry generation. */
export interface ParsedPixiAtlasLayout {
  /** Frame names needed later for the generated atlas registry. */
  readonly frameNames: readonly string[];
  /** Complete minified Pixi layout, including fields outside the metadata schema. */
  readonly serializedJson: string;
}

/** Runtime names extracted from one authored Spine skeleton. */
export interface SpineSkeletonMetadata {
  readonly animationNames: readonly string[];
  readonly skinNames: readonly string[];
}

/** Authored skeleton input understood by the Spine runtime adapter. */
export interface SpineSkeletonSource {
  readonly format: 'json' | 'skel';
  readonly path: string;
}
