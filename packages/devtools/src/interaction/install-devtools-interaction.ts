/** Includes compatibility mouse events so a touch cannot leak into gameplay twice. */
const DEVTOOLS_INPUT_EVENTS = [
  'pointerdown',
  'pointermove',
  'pointerup',
  'pointercancel',
  'mousedown',
  'mousemove',
  'mouseup',
  'touchstart',
  'touchmove',
  'touchend',
  'touchcancel',
  'click',
  'dblclick',
  'contextmenu',
  'keydown',
  'keyup',
] as const;

/**
 * Keeps development-control input out of gameplay. Runtime observes document capture,
 * so interception must happen earlier, at window capture—not on the card.
 * Only events whose composed path contains this shell are intercepted.
 */
export function installDevtoolsInteraction(shell: HTMLElement, onActivate: () => void): () => void {
  for (const event of DEVTOOLS_INPUT_EVENTS) {
    window.addEventListener(event, handleInput, { capture: true, passive: false });
  }

  return removeListeners;

  /** Removes the same handlers and capture registrations installed by this instance. */
  function removeListeners(): void {
    for (const event of DEVTOOLS_INPUT_EVENTS) {
      window.removeEventListener(event, handleInput, true);
    }
  }

  /** Stops gameplay propagation, then applies only the matching control action. */
  function handleInput(event: Event): void {
    if (!shouldIntercept(event)) {
      return;
    }
    // Let the global development Escape shortcut work while a control is focused.
    if (event instanceof KeyboardEvent && event.key === 'Escape') {
      return;
    }
    event.stopImmediatePropagation();

    // Do not cancel touchstart/pointerdown: the browser must still produce the
    // click for a tap. Activating on click avoids counting its compatibility mouse
    // events as additional taps. CSS touch-action prevents scrolling here.
    if (event.type === 'click') {
      event.preventDefault();
      onActivate();
    } else if (event instanceof KeyboardEvent) {
      handleKeyboardInput(event);
    } else if (event.type === 'contextmenu') {
      event.preventDefault();
    }
  }

  /** Hidden or unavailable shells must not intercept input, nor may events outside this shell. */
  function shouldIntercept(event: Event): boolean {
    return !shell.hidden && shell.hasAttribute('role') && event.composedPath().includes(shell);
  }

  /** Enter and Space activate once per press; keyup and repeats must not activate again. */
  function handleKeyboardInput(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    if (event.type === 'keydown' && !event.repeat) {
      onActivate();
    }
  }
}
