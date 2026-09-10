import { animate, type TweenPlaybackControls } from '@replayablejs/tween';

import type { WordGardenHint, WordGardenHintOptions } from '../../types/hint';
import type { PuzzleLevel, PuzzleWord } from '../../types/puzzle';

const LETTER_HIGHLIGHT_DURATION_SECONDS = 0.3;

/**
 * Creates an inactivity hint that previews one unresolved word letter by letter.
 *
 * The preview affects only each button's transient visual style. It never uses
 * the selection input, draws its SVG path, changes the current-word output, or
 * submits the hinted answer to the puzzle session.
 */
export function createHint({
  audio,
  delay,
  game,
  level,
  timers,
  view,
}: WordGardenHintOptions): WordGardenHint {
  const hintButtonsByAnswer = indexHintButtons(level, view.letterButtons);
  const inactivityTimer = timers.createInactivityTimer({
    duration: delay,
    onTimeout: previewNextWord,
  });
  let activeTween: TweenPlaybackControls | undefined;
  let activeButton: HTMLButtonElement | undefined;
  let previewVersion = 0;
  let nextWordIndex = 0;
  let running = false;

  return {
    beginInteraction(): void {
      if (!running) {
        return;
      }

      cancelPreview();
      inactivityTimer.stop();
    },

    endInteraction(): void {
      if (!running) {
        return;
      }

      inactivityTimer.restart();
    },

    start(): void {
      if (running) {
        return;
      }

      running = true;
      inactivityTimer.start();
    },

    stop(): void {
      running = false;
      inactivityTimer.stop();
      cancelPreview();
    },
  };

  /** Selects the next authored unresolved word and starts its visual sequence. */
  function previewNextWord(): void {
    const word = findNextUnsolvedWord();

    if (word === undefined) {
      return;
    }

    const buttons = hintButtonsByAnswer.get(word.answer);

    if (buttons === undefined) {
      throw new Error(`Hint buttons for ${word.answer} were not found.`);
    }

    const currentPreviewVersion = ++previewVersion;

    void highlightButtons(buttons, currentPreviewVersion);
  }

  /**
   * Returns the next unresolved word after the previous hint position.
   *
   * At most one full pass is needed. Advancing the cursor immediately means a
   * later timeout continues with the following authored word, while solved
   * words are skipped without disturbing that stable order.
   */
  function findNextUnsolvedWord(): PuzzleWord | undefined {
    for (let offset = 0; offset < level.words.length; offset += 1) {
      const wordIndex = (nextWordIndex + offset) % level.words.length;
      const word = level.words[wordIndex];

      if (word !== undefined && !game.isWordSolved(word.answer)) {
        nextWordIndex = (wordIndex + 1) % level.words.length;

        return word;
      }
    }

    return undefined;
  }

  /** Highlights exactly one button at a time and restarts inactivity afterward. */
  async function highlightButtons(
    buttons: readonly HTMLButtonElement[],
    currentPreviewVersion: number,
  ): Promise<void> {
    for (const button of buttons) {
      if (!running || currentPreviewVersion !== previewVersion) {
        return;
      }

      activeButton = button;
      audio.playHintLetter();
      activeTween = animate(
        button,
        {
          filter: ['brightness(1)', 'brightness(1.4)', 'brightness(1)'],
          scale: [1, 1.18, 1],
        },
        { duration: LETTER_HIGHLIGHT_DURATION_SECONDS },
      );

      try {
        await activeTween;
      } catch {
        // Cancellation is the expected result of immediate player activity.
      } finally {
        clearHintStyles(button);
        activeButton = undefined;
        activeTween = undefined;
      }
    }

    if (running && currentPreviewVersion === previewVersion) {
      inactivityTimer.start();
    }
  }

  /** Invalidates the whole sequence before cancelling its currently active tween. */
  function cancelPreview(): void {
    previewVersion += 1;
    activeTween?.cancel();

    if (activeButton !== undefined) {
      clearHintStyles(activeButton);
    }

    activeTween = undefined;
    activeButton = undefined;
  }
}

/**
 * Resolves every answer to distinct wheel buttons once during initialization.
 *
 * Repeated characters consume matching authored tokens in order. With the
 * level's `o-1` and `o-2` tokens, `BLOOM` therefore becomes the button
 * sequence `b`, `l`, `o-1`, `o-2`, `m` instead of reusing one `O`.
 */
function indexHintButtons(
  level: PuzzleLevel,
  letterButtons: ReadonlyMap<string, HTMLButtonElement>,
): ReadonlyMap<string, readonly HTMLButtonElement[]> {
  const buttonsByAnswer = new Map<string, readonly HTMLButtonElement[]>();

  for (const word of level.words) {
    const availableLetters = level.letters.map((letter) => ({
      ...letter,
      button: letterButtons.get(letter.id),
    }));
    const buttons: HTMLButtonElement[] = [];
    let remainingAnswer = word.answer;

    while (remainingAnswer.length > 0) {
      const letterIndex = availableLetters.findIndex(
        (letter) => letter.value.length > 0 && remainingAnswer.startsWith(letter.value),
      );
      const letter = availableLetters[letterIndex];

      if (letter?.button === undefined) {
        throw new Error(`Word ${word.answer} cannot be represented by the letter wheel.`);
      }

      availableLetters.splice(letterIndex, 1);
      buttons.push(letter.button);
      remainingAnswer = remainingAnswer.slice(letter.value.length);
    }

    buttonsByAnswer.set(word.answer, buttons);
  }

  return buttonsByAnswer;
}

/** Removes Motion's transient inline properties after completion or cancellation. */
function clearHintStyles(button: HTMLButtonElement): void {
  button.style.removeProperty('filter');
  button.style.removeProperty('transform');
  button.style.removeProperty('transform-origin');
}
