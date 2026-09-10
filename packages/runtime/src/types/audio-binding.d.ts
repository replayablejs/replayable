declare module '#audio' {
  import type { AudioController } from '#types/audio.js';
  import type { AssetLoader } from '#types/loader.js';

  /** Creates the audio implementation selected by Replayable's build pipeline. */
  export function createAudio(loader: AssetLoader): AudioController;
}
