import type { ScreenFrame } from '#types/screen.js';

/** Applies the calculated playable frame to its framework-owned container. */
export function applyScreenFrame(container: HTMLElement, frame: ScreenFrame): void {
  container.style.left = `${frame.x}px`;
  container.style.top = `${frame.y}px`;
  container.style.width = `${frame.width}px`;
  container.style.height = `${frame.height}px`;
}
