import { buildingPlots } from '../../scene/neighborhood-layout';
import { buildings } from './configs/buildings';

/** Owns placement rules and progress without depending on rendering or input. */
export function createBuildingSession() {
  const occupiedPlots = new Set<number>();

  return {
    get placedCount() {
      return occupiedPlots.size;
    },
    get selectedBuilding() {
      return buildings.find((_, index) => !occupiedPlots.has(index));
    },
    get complete() {
      return occupiedPlots.size === buildings.length;
    },
    place,
  };

  /** Each plot owns its building type, so tap order cannot change the height arrangement. */
  function place(plotIndex: number) {
    const plot = buildingPlots[plotIndex];
    const building = buildings[plotIndex];
    if (plot === undefined || building === undefined || occupiedPlots.has(plotIndex)) {
      return undefined;
    }
    occupiedPlots.add(plotIndex);
    return { plot, building };
  }
}
