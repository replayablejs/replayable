import { playable, type UpdateContext } from '@replayablejs/runtime';
import { Ticker, type Container, type WebGLRenderer } from 'pixi.js';

const MILLISECONDS_PER_SECOND = 1000;

/** Connects Pixi's ticker and rendering to Replayable's lifecycle-aware frame loop. */
export function startPixiRendering(renderer: WebGLRenderer, stage: Container): () => void {
  const ticker = Ticker.shared;
  let elapsedMilliseconds = 0;

  // Pixi systems may register work on the shared ticker, but Replayable alone
  // owns browser-frame scheduling so Pixi must never request another RAF loop.
  ticker.autoStart = false;
  ticker.stop();
  ticker.lastTime = 0;

  return playable.update.add(renderFrame);

  /** Advances Pixi systems and renders the stage once for this Replayable frame. */
  function renderFrame({ deltaSeconds }: UpdateContext): void {
    elapsedMilliseconds += deltaSeconds * MILLISECONDS_PER_SECOND;

    renderer.resetState();
    ticker.update(elapsedMilliseconds);
    renderer.render(stage);
  }
}
