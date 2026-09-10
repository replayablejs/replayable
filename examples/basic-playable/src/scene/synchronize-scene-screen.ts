import { playable } from '@replayablejs/runtime';

/** Publishes runtime orientation and safe spacing while keeping the background fullscreen. */
export function synchronizeSceneScreen(root: HTMLElement): () => void {
  updateScreen();
  return playable.on('resize', updateScreen);

  /** Runtime has already measured native insets and host fallbacks before this event. */
  function updateScreen(): void {
    const { frame, safeArea, orientation } = playable.screen;

    root.dataset.orientation = orientation;
    root.style.setProperty('--frame-short-edge', `${Math.min(frame.width, frame.height)}px`);
    root.style.setProperty('--safe-width', `${safeArea.width}px`);
    root.style.setProperty('--safe-height', `${safeArea.height}px`);

    // safeArea is frame-local. Convert that rectangle to CSS padding, not a
    // second safe-area policy; ordinary decorative spacing remains in CSS.
    root.style.setProperty('--content-safe-top', `${safeArea.y}px`);
    root.style.setProperty('--content-safe-left', `${safeArea.x}px`);
    root.style.setProperty(
      '--content-safe-right',
      `${Math.max(0, frame.width - safeArea.x - safeArea.width)}px`,
    );
    root.style.setProperty(
      '--content-safe-bottom',
      `${Math.max(0, frame.height - safeArea.y - safeArea.height)}px`,
    );
  }
}
