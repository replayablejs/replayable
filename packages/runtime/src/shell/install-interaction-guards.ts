/**
 * Prevents browser gestures that interfere with touch-first playable ads.
 *
 * Preventing the default behavior does not stop propagation, so playable input
 * handlers still receive each event.
 */
export function installInteractionGuards(root: HTMLElement): void {
  root.addEventListener('contextmenu', preventBrowserBehavior);
  root.addEventListener('selectstart', preventBrowserBehavior);
  root.addEventListener('dragstart', preventBrowserBehavior);

  root.addEventListener('touchstart', preventBrowserBehavior, { passive: false });
  root.addEventListener('touchmove', preventBrowserBehavior, { passive: false });
  root.addEventListener('touchend', preventBrowserBehavior, { passive: false });
}

/** Cancels the browser behavior while allowing the event to keep propagating. */
function preventBrowserBehavior(event: Event): void {
  event.preventDefault();
}
