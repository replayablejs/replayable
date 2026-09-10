import { Container, Graphics, WebGLRenderer } from 'pixi.js';

import { destroyPixiRenderer } from '../../src/renderer/destroy-pixi-renderer.js';

/** Browser regression: disposing a borrowing Pixi renderer must not lose its host's GL context. */
async function verifySharedContext(): Promise<void> {
  const canvas = document.createElement('canvas');
  document.body.append(canvas);
  const context = canvas.getContext('webgl2', { stencil: true });
  if (context === null) {
    throw new Error('WebGL 2 unavailable; shared-context check cannot run.');
  }

  const renderer = new WebGLRenderer();
  await renderer.init({ canvas, context, width: 80, height: 80, autoDensity: false });
  const stage = new Container();
  stage.addChild(new Graphics().rect(0, 0, 40, 40).fill('red'));
  renderer.render(stage);
  stage.destroy({ children: true });
  destroyPixiRenderer(renderer, false);

  if (context.isContextLost()) {
    throw new Error('Borrowed context was lost during Pixi destruction.');
  }
  // Issue a real GL operation after disposal, not merely a check of our own flags.
  context.clearColor(0, 1, 0, 1);
  context.clear(context.COLOR_BUFFER_BIT);
  if (context.getError() !== context.NO_ERROR) {
    throw new Error('Borrowed context is no longer usable.');
  }
  const result = document.createElement('p');
  result.textContent = 'PASS: borrowed WebGL context survives Pixi destruction and remains usable.';
  document.body.append(result);
}

void verifySharedContext().catch((error: unknown) => {
  document.body.append(String(error));
});
