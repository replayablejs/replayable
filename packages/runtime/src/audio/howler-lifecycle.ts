import { Howler } from '#audio/howler.js';
import type { RuntimeAudioState } from '#types/audio.js';

const CONTEXT_RESUME_DELAY_MS = 200;

/**
 * Coordinates Howler with Replayable's normalized host lifecycle.
 *
 * Howler's automatic suspension is disabled because iOS Safari can leave its
 * `AudioContext` suspended after an ad becomes visible again. The WebKit
 * workaround suspends immediately and schedules an independent resume 200 ms
 * later. The recovery deliberately does not sequence those operations through
 * promise settlement: affected WebKit versions can leave an audio-context
 * transition promise unsettled indefinitely.
 *
 * A subsequent hidden transition cancels the pending resume and suspends the
 * context again, preventing the delayed recovery from starting background
 * audio.
 *
 * @see https://bugs.webkit.org/show_bug.cgi?id=276016
 * @see https://bugs.webkit.org/show_bug.cgi?id=281566
 */
export function createHowlerLifecycle() {
  let recoveryTimeout: number | undefined;
  let visible = false;

  Howler.autoSuspend = false;
  Howler.mute(true);

  return {
    setVisible(nextVisible: boolean): void {
      visible = nextVisible;
      clearRecoveryTimeout();

      if (!Howler.usingWebAudio) {
        return;
      }

      // Do not await this promise. The following resume must remain
      // independently scheduled rather than depending on WebKit settling the
      // preceding audio-context transition.
      void Howler.ctx.suspend().catch(() => {
        // The context may already be closed or unavailable.
      });

      if (!visible) {
        return;
      }

      // WebKit's published reproduction uses 200 ms to let the visibility
      // transition settle before attempting to resume the context.
      recoveryTimeout = window.setTimeout(() => {
        recoveryTimeout = undefined;

        if (!visible) {
          return;
        }

        void Howler.ctx.resume().catch(() => {
          // A later trusted interaction or visibility transition can retry.
        });
      }, CONTEXT_RESUME_DELAY_MS);
    },

    update({ allowed, volume }: RuntimeAudioState, muted: boolean): void {
      Howler.volume(volume);
      Howler.mute(!allowed || muted);
    },

    unlock(): void {
      if (!Howler.usingWebAudio || Howler.ctx.state === 'running') {
        return;
      }

      // Invocation—not promise settlement—must occur in the trusted event task.
      // Howler also installs an unlock listener; this explicit attempt makes the
      // runtime contract independent of that internal implementation detail.
      void Howler.ctx.resume().catch(() => {
        // A later trusted interaction or visibility recovery can retry.
      });
    },
  };

  function clearRecoveryTimeout(): void {
    if (recoveryTimeout === undefined) {
      return;
    }

    window.clearTimeout(recoveryTimeout);
    recoveryTimeout = undefined;
  }
}
