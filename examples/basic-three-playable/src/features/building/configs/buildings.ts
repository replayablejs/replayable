import { models } from '../../../assets/registries/models';
import { sounds } from '../../../assets/registries/sounds';

/** Match plot order: medium on the left, tallest in the middle, short on the right. */
export const buildings = [
  { asset: models['city/building-small-b'], sound: sounds['placement-b'] },
  { asset: models['city/building-small-c'], sound: sounds['placement-c'] },
  { asset: models['city/building-small-a'], sound: sounds['placement-a'] },
] as const;
