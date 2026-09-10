const STAGE_SIZE_PIXELS = 500;
const STAGE_INSET_PIXELS = 16;

/** Uniformly fits one complete authored composition inside its responsive panel. */
export function fitStageToPanel(panel: HTMLElement, stage: HTMLElement): () => void {
  stage.style.width = `${STAGE_SIZE_PIXELS}px`;
  stage.style.height = `${STAGE_SIZE_PIXELS}px`;

  const observer = new ResizeObserver(([entry]) => {
    if (entry === undefined) {
      return;
    }

    const { height, width } = entry.contentRect;
    const availableSize = Math.max(0, Math.min(width, height) - STAGE_INSET_PIXELS);
    const scale = availableSize / STAGE_SIZE_PIXELS;

    stage.style.setProperty('--stage-scale', String(scale));
  });

  observer.observe(panel);

  return () => observer.disconnect();
}
