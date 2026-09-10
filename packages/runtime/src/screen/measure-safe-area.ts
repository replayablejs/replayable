import type { RuntimeOrientation, ScreenFrame } from '#types/screen.js';

/**
 * Reads the shell's invisible CSS probe once per screen update, before application
 * resize listeners run. The shared shell combines native insets with Replayable's
 * minimum content margins; applications only consume this cached rectangle.
 * The resulting rectangle is local to the content frame, not device pixels.
 * Backgrounds and renderers continue using the unchanged fullscreen frame.
 */
export function measureSafeArea(
  root: HTMLElement,
  frame: ScreenFrame,
  orientation: RuntimeOrientation,
): ScreenFrame {
  root.dataset.orientation = orientation;
  const style = getComputedStyle(root, '::before');
  const left = readInset(style.paddingLeft);
  const right = readInset(style.paddingRight);
  const top = readInset(style.paddingTop);
  const bottom = readInset(style.paddingBottom);

  return {
    x: Math.min(left, frame.width),
    y: Math.min(top, frame.height),
    width: Math.max(0, frame.width - left - right),
    height: Math.max(0, frame.height - top - bottom),
  };
}

/** Missing shell styles resolve to zero rather than propagating NaN into layout. */
function readInset(value: string): number {
  return Number.parseFloat(value) || 0;
}
