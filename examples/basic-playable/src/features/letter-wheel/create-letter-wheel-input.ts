import type {
  LetterSelection,
  LetterWheelInput,
  LetterWheelInputOptions,
  SelectableLetter,
  Point,
  WheelCoordinates,
} from '../../types/input';
import type { WheelView } from '../../types/view';

/**
 * Connects one mobile-first pointer gesture to the letter wheel.
 *
 * Crossing a new petal appends it. Returning directly to the previous petal
 * removes the latest letter, which gives the player natural swipe backtracking.
 * Earlier selected petals cannot be reused during the same gesture.
 */
export function createLetterWheelInput(
  view: WheelView,
  { onSelection, onVisit }: LetterWheelInputOptions,
): LetterWheelInput {
  const lettersByButton = indexSelectableLetters(view.letterButtons);
  const selectedLetters: SelectableLetter[] = [];
  let activePointerId: number | undefined;
  let enabled = true;

  view.letterWheel.addEventListener('pointerdown', handlePointerDown);
  view.letterWheel.addEventListener('pointermove', handlePointerMove);
  view.letterWheel.addEventListener('pointerup', handlePointerUp);
  view.letterWheel.addEventListener('pointercancel', handlePointerCancel);
  const removeResizeListener = playable.on('resize', cancelSelection);
  const removeVisibilityListener = playable.on('visibilitychange', handleVisibilityChange);

  return {
    dispose(): void {
      removeResizeListener();
      removeVisibilityListener();
      cancelSelection();
      view.letterWheel.removeEventListener('pointerdown', handlePointerDown);
      view.letterWheel.removeEventListener('pointermove', handlePointerMove);
      view.letterWheel.removeEventListener('pointerup', handlePointerUp);
      view.letterWheel.removeEventListener('pointercancel', handlePointerCancel);
    },

    reset: cancelSelection,

    setEnabled(nextEnabled): void {
      enabled = nextEnabled;

      for (const button of view.letterButtons.values()) {
        button.disabled = !enabled;
      }

      if (!enabled) {
        cancelSelection();
      }
    },
  };

  /** A hidden host can abandon a gesture without sending pointercancel. */
  function handleVisibilityChange(visible: boolean): void {
    if (!visible) {
      cancelSelection();
    }
  }

  /** Releases the old gesture without submitting a word or dismissing the tutorial. */
  function cancelSelection(): void {
    releaseActivePointer();
    resetSelection();
  }

  /** Starts one primary touch, pen, or left-mouse gesture on a letter. */
  function handlePointerDown(event: PointerEvent): void {
    if (!enabled || activePointerId !== undefined || !event.isPrimary || event.button !== 0) {
      return;
    }

    const letter = resolveEventLetter(event.target);

    if (letter === undefined) {
      return;
    }

    resetSelection();
    activePointerId = event.pointerId;
    view.letterWheel.setPointerCapture(event.pointerId);
    visitLetter(letter);
    renderSelection(event.clientX, event.clientY);
    event.preventDefault();
  }

  /** Extends or backtracks the active selection as the pointer crosses petals. */
  function handlePointerMove(event: PointerEvent): void {
    if (event.pointerId !== activePointerId) {
      return;
    }

    const letter = resolvePointLetter(event.clientX, event.clientY);

    if (letter !== undefined) {
      visitLetter(letter);
    }

    renderSelection(event.clientX, event.clientY);
    event.preventDefault();
  }

  /** Emits the selected IDs and word once, then clears transient wheel state. */
  function handlePointerUp(event: PointerEvent): void {
    if (event.pointerId !== activePointerId) {
      return;
    }

    const finalLetter = resolvePointLetter(event.clientX, event.clientY);

    if (finalLetter !== undefined) {
      visitLetter(finalLetter);
    }

    const selection = createSelection();

    releaseActivePointer();
    resetSelection();

    if (selection.word.length > 0) {
      onSelection(selection);
    }

    event.preventDefault();
  }

  /** Cancels an interrupted host or browser gesture without submitting a word. */
  function handlePointerCancel(event: PointerEvent): void {
    if (event.pointerId === activePointerId) {
      cancelSelection();
    }
  }

  /** Applies append, ignore, or one-step backtrack semantics to a crossed petal. */
  function visitLetter(letter: SelectableLetter): void {
    const selectedIndex = selectedLetters.indexOf(letter);
    const lastIndex = selectedLetters.length - 1;

    if (selectedIndex === -1) {
      selectedLetters.push(letter);
    } else if (selectedIndex === lastIndex) {
      return;
    } else if (selectedIndex === lastIndex - 1) {
      selectedLetters.pop();
    } else {
      return;
    }

    updateSelectionPresentation();
    onVisit?.();
  }

  /** Draws selected petal centers plus the live pointer tail in wheel coordinates. */
  function renderSelection(clientX: number, clientY: number): void {
    const coordinates = getWheelCoordinates();
    const points = selectedLetters.map(({ button }) => getButtonCenter(button, coordinates));

    points.push(toWheelPoint(clientX, clientY, coordinates));
    view.selectionLine.setAttribute('points', points.map(({ x, y }) => `${x},${y}`).join(' '));
  }

  /** Returns the immutable payload consumed later by gameplay validation. */
  function createSelection(): LetterSelection {
    return {
      letterIds: selectedLetters.map(({ id }) => id),
      word: selectedLetters.map(({ value }) => value).join(''),
    };
  }

  /** Clears selected petals, text, and the SVG trace without emitting anything. */
  function resetSelection(): void {
    selectedLetters.length = 0;
    updateSelectionPresentation();
    view.selectionLine.removeAttribute('points');
  }

  /** Reflects the current selection across all five petals and the word label. */
  function updateSelectionPresentation(): void {
    const selectedButtons = new Set(selectedLetters.map(({ button }) => button));

    for (const button of view.letterButtons.values()) {
      const selected = selectedButtons.has(button);

      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    }

    view.currentWord.value = selectedLetters.map(({ value }) => value).join('');
  }

  /** Releases capture before clearing the active pointer identity. */
  function releaseActivePointer(): void {
    if (activePointerId !== undefined && view.letterWheel.hasPointerCapture(activePointerId)) {
      view.letterWheel.releasePointerCapture(activePointerId);
    }

    activePointerId = undefined;
  }

  /** Resolves the initial event target only when it belongs to this wheel. */
  function resolveEventLetter(target: EventTarget | null): SelectableLetter | undefined {
    return target instanceof HTMLButtonElement ? lettersByButton.get(target) : undefined;
  }

  /** Finds the wheel petal currently below a captured pointer. */
  function resolvePointLetter(clientX: number, clientY: number): SelectableLetter | undefined {
    const element = document.elementFromPoint(clientX, clientY);

    return element instanceof HTMLButtonElement ? lettersByButton.get(element) : undefined;
  }

  /**
   * Creates one direct mapping from the rendered SVG rectangle to its viewBox.
   *
   * Ad-network tester WebViews may scale the creative outside its own layout.
   * Rectangle ratios remain stable under that scaling, unlike SVG screen
   * matrices whose treatment of ancestor CSS transforms differs by WebView.
   */
  function getWheelCoordinates(): WheelCoordinates {
    const selectionPath = view.selectionLine.ownerSVGElement;

    if (selectionPath === null) {
      throw new Error('The letter-wheel selection trace is not attached to the document.');
    }

    const bounds = selectionPath.getBoundingClientRect();
    const viewBox = selectionPath.viewBox.baseVal;

    return {
      origin: {
        x: bounds.left,
        y: bounds.top,
      },
      scale: {
        x: viewBox.width / bounds.width,
        y: viewBox.height / bounds.height,
      },
    };
  }

  /** Converts one viewport coordinate into the SVG trace's local coordinates. */
  function toWheelPoint(clientX: number, clientY: number, coordinates: WheelCoordinates): Point {
    return {
      x: (clientX - coordinates.origin.x) * coordinates.scale.x,
      y: (clientY - coordinates.origin.y) * coordinates.scale.y,
    };
  }

  /** Returns one petal center in the same fixed coordinates as the SVG trace. */
  function getButtonCenter(button: HTMLButtonElement, coordinates: WheelCoordinates): Point {
    const bounds = button.getBoundingClientRect();

    return toWheelPoint(
      bounds.left + bounds.width / 2,
      bounds.top + bounds.height / 2,
      coordinates,
    );
  }
}

/** Captures stable token identity and display value for every petal element. */
function indexSelectableLetters(
  letterButtons: ReadonlyMap<string, HTMLButtonElement>,
): ReadonlyMap<HTMLButtonElement, SelectableLetter> {
  const letters = new Map<HTMLButtonElement, SelectableLetter>();

  for (const [id, button] of letterButtons) {
    letters.set(button, {
      button,
      id,
      value: button.textContent ?? '',
    });
  }

  return letters;
}
import { playable } from '@replayablejs/runtime';
