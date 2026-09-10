import { createAnimatedSprite } from '@replayablejs/pixi';
import { playable } from '@replayablejs/runtime';
import { Container, Rectangle, Texture } from 'pixi.js';

import { atlases } from '../../assets/registries';
import type { TutorialScroll } from '../../types/tutorial';
import { createTutorialText } from './create-tutorial-text';

/** Owns the paper animation, synchronized text, and a stable box for scene layout. */
export function createTutorialScroll(): TutorialScroll {
  const { tutorialLabel } = playable.config.params;
  if (typeof tutorialLabel !== 'string') {
    throw new Error('Tutorial scroll requires a localized label key.');
  }
  const text = playable.localization.translate(tutorialLabel);

  const container = new Container({ label: 'tutorial', eventMode: 'none', visible: false });

  const scroll = createAnimatedSprite({
    frames: Object.values(atlases.scroll),
    anchor: { x: 0, y: 0 },
    animationSpeed: 0.5,
    autoPlay: false,
  });
  const { width, height } = Texture.from(atlases.scroll['5']).orig;
  const label = createTutorialText(text, width, height);

  // Measure the open scroll, never its changing frame or partially revealed text.
  container.boundsArea = new Rectangle(0, 0, width, height);
  container.addChild(scroll, label.container);

  return { container, open, close, destroy };

  /** Start paper and ink together. The tutorial lifecycle calls this only once. */
  function open(): void {
    container.visible = true;
    scroll.play();
    // Pixi expresses animationSpeed as frames per 60 Hz tick, not frames per second.
    label.reveal(scroll.totalFrames / (scroll.animationSpeed * 60));
  }

  /** Reverse from the current frame, including an interrupted opening. */
  function close(): void {
    scroll.stop();
    scroll.onComplete = hide;
    scroll.animationSpeed = -0.5;
    // Text follows the remaining reverse travel, not the full opening duration.
    const duration = Math.max(1, scroll.currentFrame) / (Math.abs(scroll.animationSpeed) * 60);
    label.dismiss(duration);

    if (scroll.currentFrame === 0) {
      hide();
    } else {
      scroll.play();
    }
  }

  /** Retain the layout box after closing so nearby content never shifts. */
  function hide(): void {
    scroll.stop();
    delete scroll.onComplete;
    container.visible = false;
  }

  /** Release text animation before its objects; shared atlas textures stay alive. */
  function destroy(): void {
    delete scroll.onComplete;
    label.destroy();
    container.destroy({ children: true });
  }
}
