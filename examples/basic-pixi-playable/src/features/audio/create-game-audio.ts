import { playable } from '@replayablejs/runtime';

import { sounds } from '../../assets/registries';
import type { GameAudio } from '../../types/audio';

/** Maps the reference's music and chime to runtime's managed and one-shot playback. */
export function createGameAudio(): GameAudio {
  // Request once. Runtime waits for secondary loading and audio permission;
  // disabled-audio variants return the same harmless playback interface.
  const music = playable.audio.play(sounds.loop, { loop: true, fadeIn: 0.5 });

  return { playCardReveal, destroy };

  /** An unloaded or blocked chime is dropped rather than replayed after the tap. */
  function playCardReveal(): void {
    playable.audio.playOneShot(sounds.chime);
  }

  /** Music continues through completion, as in the reference, until scene teardown. */
  function destroy(): void {
    music.stop();
  }
}
