import { animate } from '@replayablejs/tween';
import type { TweenPlaybackControls } from '@replayablejs/tween';

import { models } from '../../assets/registries/models';
import { road } from '../../scene/neighborhood-layout';
import type { BuildingPathConfig } from '../../types/building-path';
import type { CityModelInstance } from '../../types/city-instances';
import { buildingPathConfig } from './configs/building-path';

/** Owns the pavement connecting one building to the main road. */
export function createBuildingPath({ plot, neighborhood }: BuildingPathConfig) {
  const tiles: CityModelInstance[] = [];
  const animations: TweenPlaybackControls[] = [];

  // Start outside the building's base and stop before the road itself.
  for (let z = plot.z + 1; z < road.streetZ; z++) {
    const tile = createTile(z);
    tiles.push(tile);
  }

  return { show, settle, destroy };

  /** Keep pavement hidden until its animation replaces the original grass. */
  function createTile(z: number): CityModelInstance {
    const tile = neighborhood.createInstance({ asset: models['city/pavement'], x: plot.x, z });
    tile.root.visible = false;
    tile.update();
    return tile;
  }

  /** Reveal tiles from the building toward the road, with a short stagger. */
  function show(onComplete: () => void): void {
    // The roadside building needs no entrance tiles.
    if (tiles.length === 0) {
      onComplete();
      return;
    }

    tiles.forEach((tile, index) => {
      const isLastTile = index === tiles.length - 1;
      animateTile(tile, index, () => {
        if (isLastTile) {
          onComplete();
        }
      });
    });
  }

  /** Move a full-size tile downward without exposing gaps in the ground. */
  function animateTile(tile: CityModelInstance, index: number, onComplete: () => void): void {
    const { startHeight, delay, stagger, duration, ease } = buildingPathConfig;
    tile.root.position.y = startHeight;
    let started = false;

    const animation = animate(0, 1, {
      delay: delay + index * stagger,
      duration,
      ease,
      onUpdate: updateTile,
      onComplete: finishTile,
    });
    animations.push(animation);

    function updateTile(progress: number): void {
      if (progress > 0 && !started) {
        revealTile(tile);
        started = true;
      }
      tile.root.position.y = startHeight * (1 - progress);
      tile.update();
    }

    function finishTile(): void {
      settleTile(tile);
      onComplete();
    }
  }

  /** Lower the old grass first, so the two surfaces never fight for the same depth. */
  function revealTile(tile: CityModelInstance): void {
    const { x, z } = tile.root.position;
    neighborhood.lowerGround(x, z);
    tile.root.visible = true;
  }

  /** Also used when gameplay completes before a tile finishes animating. */
  function settleTile(tile: CityModelInstance): void {
    revealTile(tile);
    tile.root.position.y = 0;
    tile.update();
  }

  /** Stop movement and leave the entire entrance connected to the road. */
  function settle(): void {
    stopAnimations();
    tiles.forEach(settleTile);
  }

  function stopAnimations(): void {
    for (const animation of animations) {
      animation.stop();
    }
    animations.length = 0;
  }

  /** Stop callbacks before releasing the pavement instances. */
  function destroy(): void {
    stopAnimations();
    for (const tile of tiles) {
      tile.destroy();
    }
  }
}
