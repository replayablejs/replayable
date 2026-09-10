import type { Container } from 'pixi.js';

import type { DisplayObjectOptions } from '#types/factories.js';

const ZERO_POINT = { x: 0, y: 0 };
const UNIT_SCALE = { x: 1, y: 1 };

/** Applies the transform and visibility defaults shared by Pixi containers. */
export function applyContainerOptions(container: Container, options: DisplayObjectOptions): void {
  container.position.copyFrom(options.position ?? ZERO_POINT);
  container.scale.copyFrom(options.scale ?? UNIT_SCALE);
  container.pivot.copyFrom(options.pivot ?? ZERO_POINT);
  container.rotation = options.rotation ?? 0;
  container.alpha = options.alpha ?? 1;
  container.visible = options.visible ?? true;
  container.zIndex = options.zIndex ?? 0;
}
