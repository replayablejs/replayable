import { Container, Rectangle, type FederatedPointerEvent } from 'pixi.js';

import type { CreateButtonOptions, ReplayableButton } from '#types/button.js';

/**
 * Wraps artwork in a stable hit target without choosing its visuals or action.
 * Children are non-interactive: the button owns completed taps for the whole artwork.
 * Bounds are captured once, including the content's initial transform. Later artwork
 * animations do not shrink the hit target or change the bounds consumed by layout.
 *
 * @example
 * const button = createButton({ content: artwork, onActivate: handleAction });
 * stage.addChild(button.container);
 * button.setEnabled(false);
 * // Disposing the button also destroys artwork, but not its shared textures.
 * button.destroy();
 */
export function createButton(options: CreateButtonOptions): ReplayableButton {
  const container = new Container({ label: 'button' });
  const { content, onActivate } = options;
  content.eventMode = 'none';
  container.addChild(content);

  const bounds = container.getLocalBounds();
  const buttonBounds = new Rectangle(bounds.x, bounds.y, bounds.width, bounds.height);
  container.boundsArea = buttonBounds;
  container.hitArea = buttonBounds;

  let enabled = options.enabled ?? true;
  setEnabled(enabled);
  container.on('pointertap', handleTap);

  return { container, setEnabled, destroy };

  /** Keep the action in the trusted input call stack; never await or defer it. */
  function handleTap(event: FederatedPointerEvent): void {
    event.stopPropagation();
    if (enabled) {
      onActivate();
    }
  }

  /** Change input policy only; the consumer owns visibility and disabled styling. */
  function setEnabled(value: boolean): void {
    if (container.destroyed) {
      return;
    }
    enabled = value;
    container.eventMode = enabled ? 'static' : 'none';
    container.cursor = enabled ? 'pointer' : 'default';
  }

  /** Retire input before destroying owned display objects, never shared textures. */
  function destroy(): void {
    if (container.destroyed) {
      return;
    }
    setEnabled(false);
    container.off('pointertap', handleTap);
    container.destroy({ children: true });
  }
}
