import canvasStyles from './canvas.scss?inline';

const CANVAS_STYLE_ID = 'replayable-canvas-styles';

/** Installs canvas host base styles once per document. */
export function installCanvasStyles(): void {
  if (document.getElementById(CANVAS_STYLE_ID) !== null) {
    return;
  }

  const style = document.createElement('style');
  style.id = CANVAS_STYLE_ID;
  style.textContent = canvasStyles.trim();
  document.head.append(style);
}
