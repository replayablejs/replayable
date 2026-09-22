import { animate } from '@replayablejs/tween';
import type { TweenPlaybackControls } from '@replayablejs/tween';

import type { CityModelInstance } from '../../types/city-instances';

/** Pops only the structure, uploading its transform to the shared city batch. */
export function animateBuildingPlacement(
  model: CityModelInstance,
  onComplete: () => void,
): TweenPlaybackControls {
  const structure = model.root.getObjectByName('building')!;

  updateScale(0.05);

  return animate(0.05, [0.05, 1.06, 1], {
    duration: 0.35,
    ease: 'easeOut',
    onUpdate: updateScale,
    onComplete,
  });

  // Ground remains full-size; the source GLB provides a separate building pivot.
  function updateScale(scale: number): void {
    structure.scale.setScalar(scale);
    model.update();
  }
}
