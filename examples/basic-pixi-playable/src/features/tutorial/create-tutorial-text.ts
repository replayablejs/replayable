import { createSplitText, fitText } from '@replayablejs/pixi';
import { animate, type TweenPlaybackControls } from '@replayablejs/tween';
import { Rectangle, type SplitText } from 'pixi.js';

import { fonts } from '../../assets/registries';
import type {
  TutorialText,
  TutorialTextCharacter,
  TutorialTextSequence,
} from '../../types/tutorial';

/** Total horizontal inset in authored scroll units: 50 on each side for curled paper. */
const HORIZONTAL_INSET = 100;
/** Hidden letters move 6 local units toward the sentence center, creating an unfolding effect. */
const INWARD_DISTANCE = 6;
/** Positive Y points down in Pixi; hidden letters begin 5 units below their resting baseline. */
const HIDDEN_Y_OFFSET = 5;

/**
 * Creates the scroll's ink: one fitted sentence with individually animated letters.
 *
 * Ownership is deliberately narrow:
 * - The caller supplies already-localized text and the open paper's authored size.
 * - This file owns text objects, their prepared poses, and the current text tween.
 * - The scroll owns paper frames and passes matching durations in seconds.
 * - The tutorial owns when to show/dismiss; layout owns responsive scene placement.
 *
 * Split, fit, and measure before hiding any letters. Rotation subsequently scales
 * the surrounding tutorial; it does not resplit text or rebuild character targets.
 * This preserves line breaks and object identity throughout an in-flight animation.
 *
 * The owner calls reveal once, may interrupt it with dismiss, then destroys the
 * object when the scene is disposed. This is not a reusable play/pause controller.
 *
 * @param text - Translated sentence, not a localization key.
 * @param width - Open scroll width in its local artwork coordinates, not viewport pixels.
 * @param height - Open scroll height in the same coordinates.
 */
export function createTutorialText(text: string, width: number, height: number): TutorialText {
  const container = createTutorialLabel(text, width, height);
  const characters = prepareCharacters(container);
  let animation: TweenPlaybackControls | undefined;

  return { container, reveal, dismiss, destroy };

  /**
   * Start the prepared hidden letters unfolding from center to edges.
   * Duration is the paper's opening time, not a duration per letter. Normalizing
   * by horizontal distance keeps long translations inside the same time window.
   * Empty text has no targets and needs no tween. The owner guarantees one reveal.
   */
  function reveal(duration: number): void {
    if (characters.length === 0) {
      return;
    }
    animation = animate(createRevealSequence(characters, duration));
  }

  /**
   * Stop opening first, then retract only letters that have become visible.
   * Stopping retains the current poses. The closing sequence reads those poses
   * instead of resetting to fully revealed ones, avoiding a flash on early dismissal.
   * Letters still at alpha zero already need no further visual work.
   *
   * This reverses spatial order, not playback time: outer letters leave before
   * central letters, using separately tuned timing to clear the closing paper edges.
   * Duration is the scroll's remaining closing time, which may be short after an
   * interrupted opening. Filtering happens after stopping so both see the same pose.
   */
  function dismiss(duration: number): void {
    animation?.stop();
    const visibleCharacters = characters.filter(({ character }) => character.alpha > 0);
    if (visibleCharacters.length === 0) {
      return;
    }

    animation = animate(createDismissSequence(visibleCharacters, duration));
  }

  /**
   * Stop writes to character properties before destroying SplitText and its children.
   * No reveal/close completion is awaited during disposal. The scroll owns its own
   * paper animation and removes the surrounding tutorial container separately.
   */
  function destroy(): void {
    animation?.stop();
    container.destroy({ children: true });
  }
}

/**
 * Creates the tutorial-specific typography, wrapping, stable bounds, and placement.
 * This is not a second generic text factory: createSplitText and fitText provide
 * those shared operations; the choices below belong to this scroll's artwork.
 *
 * Wrapping happens at the authored width first, then uniform fitting shrinks the
 * complete result if necessary. Fitting never changes font size or line breaks.
 */
function createTutorialLabel(text: string, width: number, height: number): SplitText {
  const container = createSplitText({
    text,
    autoSplit: false,
    eventMode: 'none',
    style: {
      fontFamily: fonts['Patrick Hand'],
      fontSize: 42,
      fill: '#000000',
      align: 'center',
      wordWrap: true,
      wordWrapWidth: width - HORIZONTAL_INSET,
    },
  });
  // Manual splitting gives us a single, explicit measurement point. Characters
  // must exist before fitting, and must keep their identity once tweens target them.
  container.split();

  const bounds = container.getLocalBounds();
  // Freeze the complete sentence's local rectangle. Hidden/moving characters
  // must not shrink layout bounds. boundsArea is a measurement override, not a mask.
  container.boundsArea = new Rectangle(bounds.x, bounds.y, bounds.width, bounds.height);
  // Bounds can start away from (0, 0); use their actual center, not width/2 alone.
  // This pivot also supplies the sentence center used by character preparation.
  container.pivot.set(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  // Slightly above the paper's center, inside its usable middle 65% of height.
  container.position.set(width * 0.5, height * 0.48);
  fitText(container, { width: width - HORIZONTAL_INSET, height: height * 0.65 });
  return container;
}

/**
 * Measures each letter once and prepares its invisible starting pose.
 *
 * Two coordinate spaces serve different purposes:
 * - Sentence-local horizontal centers determine when letters animate.
 * - Each letter's parent-local x/y determine where its tween moves it.
 * Do not replace restingX/restingY with sentence coordinates: nested line/word
 * containers would then receive positions expressed in the wrong space.
 *
 * Distance is horizontal only, not Euclidean distance or reading order. Letters
 * at the same horizontal distance on different lines receive the same start time,
 * making the text unfold with the paper from its center toward both edges.
 */
function prepareCharacters(container: SplitText): TutorialTextCharacter[] {
  const centerX = container.pivot.x;
  const characters = container.chars.map((character) => {
    const bounds = character.getLocalBounds();
    // Characters may belong to line/word containers. Compare their centers in
    // sentence coordinates so multiline translations open symmetrically. The
    // source argument tells toLocal which object's coordinates the point uses.
    const center = container.toLocal({ x: bounds.x + bounds.width / 2, y: 0 }, character);
    return {
      character,
      restingX: character.x,
      restingY: character.y,
      distance: Math.abs(center.x - centerX),
      // Left-side letters start to their right; right-side letters start to their
      // left. A letter exactly at center receives zero horizontal displacement.
      inwardOffset: Math.sign(centerX - center.x) * INWARD_DISTANCE,
    };
  });

  // Finish measuring every letter before mutating any pose. Explicit sequence
  // start times determine reveal order; sorting the character array is unnecessary.
  for (const { character, restingX, restingY, inwardOffset } of characters) {
    character.alpha = 0;
    character.x = restingX + inwardOffset;
    character.y = restingY + HIDDEN_Y_OFFSET;
  }
  return characters;
}

/**
 * Builds center-out keyframes without starting a tween or changing character state.
 * Each tuple is [target, property keyframes, timing]. `at` is an absolute start
 * time within this sequence, so array order does not determine playback order.
 *
 * For a 1-second opening and a normal nonzero text span:
 * - A center letter starts at 0.15s and finishes at 0.55s.
 * - The farthest letter starts at 0.60s and finishes at 1.00s.
 * Equal-distance letters on either side start together; all use the same duration.
 */
function createRevealSequence(
  characters: readonly TutorialTextCharacter[],
  duration: number,
): TutorialTextSequence {
  // Wait through the first 15% of paper opening. Each letter takes 40%;
  // distribute its start across the remaining 45% so the outer letters finish last.
  const startDelay = duration * 0.15;
  const letterDuration = duration * 0.4;
  const spreadDuration = duration - startDelay - letterDuration;
  // Keep division finite for a single centered character or a zero-width span.
  // This floor may shorten the spread for sub-unit spans; it never extends it.
  const maximumDistance = Math.max(1, ...characters.map(({ distance }) => distance));

  return characters.map(({ character, restingX, restingY, inwardOffset, distance }) => [
    character,
    {
      alpha: [0, 1],
      x: [restingX + inwardOffset, restingX],
      // Rise past the resting baseline by one pixel, then settle.
      y: [restingY + HIDDEN_Y_OFFSET, restingY - 1, restingY],
    },
    {
      at: startDelay + (distance / maximumDistance) * spreadDuration,
      duration: letterDuration,
      ease: 'easeInOut',
    },
  ]);
}

/**
 * Builds outside-in closing keyframes from the stopped animation's current poses.
 * The caller has already removed invisible letters; this helper only reads targets.
 *
 * Closing is intentionally faster than opening, not an exact time reversal.
 * With 1 second of paper travel, the ink has a 0.55-second window: each letter
 * takes 0.22s, with starts spread across 0.33s. The farthest visible letter starts
 * first; a center letter starts last and finishes at 0.55s.
 *
 * Normalizing against visible letters matters for interrupted opening: the outer
 * letters that never appeared must not postpone the retreat of the visible ones.
 */
function createDismissSequence(
  visibleCharacters: readonly TutorialTextCharacter[],
  duration: number,
): TutorialTextSequence {
  // Clear the ink within the first 55% of paper closing. Normalize using only
  // visible letters so partially opened text still retreats within that window.
  const closingDuration = duration * 0.55;
  const letterDuration = closingDuration * 0.4;
  const spreadDuration = closingDuration - letterDuration;
  const maximumDistance = Math.max(1, ...visibleCharacters.map(({ distance }) => distance));

  return visibleCharacters.map(({ character, restingX, restingY, inwardOffset, distance }) => [
    character,
    {
      alpha: [character.alpha, 0],
      x: [character.x, restingX + inwardOffset],
      y: [character.y, restingY + HIDDEN_Y_OFFSET],
    },
    {
      at: (1 - distance / maximumDistance) * spreadDuration,
      duration: letterDuration,
      ease: 'easeOut',
    },
  ]);
}
