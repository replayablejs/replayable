import { playable } from '@replayablejs/runtime';
import type { TweenPlaybackControls } from '@replayablejs/tween';

import { animateBuildingPlacement } from '../features/building/animate-building-placement';
import { createBuildingPath } from '../features/building/create-building-path';
import { createBuildingSession } from '../features/building/create-building-session';
import { installPlotInput } from '../features/building/install-plot-input';
import { createPlotHint } from '../features/hint/create-plot-hint';
import type { GameplayConfig, PlacedHome } from '../types/gameplay';

/** Connects placement rules, canvas taps, and the appearance of newly built homes. */
export function createGameplay({ camera, neighborhood }: GameplayConfig) {
  const session = createBuildingSession();
  // Project config validates the number of placements needed for completion.
  const buildingsToEndcard = Number(playable.config.params.buildingsToEndcard);
  // Keep each home and its entrance together for completion and cleanup.
  const homes: PlacedHome[] = [];
  const hint = playable.config.params.hint
    ? createPlotHint({
        markers: neighborhood.plotMarkers,
        delay: Number(playable.config.params.hintDelay),
      })
    : undefined;
  let placementAnimation: TweenPlaybackControls | undefined;
  let placing = false;
  let stopped = false;

  const removeInput = installPlotInput({ camera, onPlotTap: placeBuilding });

  const removeCompletion = playable.on('complete', stop);

  hint?.start();

  return { session, stop, destroy };

  /** A valid tap consumes one building; repeated taps cannot overwrite a plot. */
  function placeBuilding(plotIndex: number): void {
    if (stopped || placing) {
      return;
    }
    const placement = session.place(plotIndex);
    if (placement === undefined) {
      return;
    }
    placing = true;
    hint?.stop();

    const model = neighborhood.createInstance({
      asset: placement.building.asset,
      ...placement.plot,
    });
    const path = createBuildingPath({
      plot: placement.plot,
      neighborhood,
    });
    const home = { model, path };
    homes.push(home);

    // Replace the marker with the model's full-size ground before animating.
    neighborhood.hidePlot(plotIndex);
    playable.audio.playOneShot(placement.building.sound, { volume: 0.6 });
    revealHome(home);
  }

  /** Unlock the next tap only after both the building and its entrance have arrived. */
  function revealHome({ model, path }: PlacedHome): void {
    // Both animations belong to one placement. Start them together, with the
    // path's short lead-in delay, and unlock only after both have finished.
    let remainingAnimations = 2;
    // Source GLBs expose separate ground and building nodes. Only the building
    // scales; the ground stays full-size from the first rendered frame.
    placementAnimation = animateBuildingPlacement(model, finishAnimation);
    path.show(finishAnimation);

    function finishAnimation(): void {
      remainingAnimations -= 1;
      if (remainingAnimations === 0) {
        finishPlacement();
      }
    }
  }

  /** Show the end card only after the requested buildings and their paths have settled. */
  function finishPlacement(): void {
    placing = false;
    if (!stopped && session.placedCount >= buildingsToEndcard) {
      playable.complete('success');
    } else if (!stopped) {
      hint?.start();
    }
  }

  /** End interaction and settle any unfinished placement into its final appearance. */
  function stop(): void {
    stopped = true;
    hint?.stop();
    removeInput();
    placementAnimation?.stop();
    for (const { model, path } of homes) {
      path.settle();
      model.root.getObjectByName('building')!.scale.setScalar(1);
      model.update();
    }
  }

  /** Stop input/animation before destroying models; shared assets outlive this layer. */
  function destroy(): void {
    stop();
    removeCompletion();
    for (const { model, path } of homes) {
      path.destroy();
      model.destroy();
    }
    homes.length = 0;
  }
}
