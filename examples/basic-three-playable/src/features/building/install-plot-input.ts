import { getCanvasHost } from '@replayablejs/canvas';
import { playable } from '@replayablejs/runtime';

import type { PlotInputConfig } from '../../types/gameplay';
import { createPlotPicker } from './create-plot-picker';

/** Connects canvas input to plot selection and returns listener cleanup. */
export function installPlotInput({ camera, onPlotTap }: PlotInputConfig): () => void {
  const canvas = getCanvasHost().getCanvas();
  const pickPlot = createPlotPicker(camera);

  // Replayable suppresses mobile click events, so use pointerup for mouse and touch.
  canvas.addEventListener('pointerup', handlePointerUp);

  return destroy;

  function handlePointerUp(event: PointerEvent): void {
    if (!event.isPrimary || event.button !== 0) {
      return;
    }
    if (!playable.state.visible || playable.state.completion !== undefined) {
      return;
    }

    const plotIndex = pickPlot(event.clientX, event.clientY);
    if (plotIndex !== -1) {
      onPlotTap(plotIndex);
    }
  }

  function destroy(): void {
    canvas.removeEventListener('pointerup', handlePointerUp);
  }
}
