import type {
  LayoutAreaConfig,
  LayoutBounds,
  LayoutConfig,
  ResolvedLayoutArea,
} from '#types/layout.js';

import {
  DEFAULT_LAYOUT_ALIGNMENT,
  DEFAULT_LAYOUT_SCALE_MODE,
  layoutAlignments,
  layoutScaleModes,
} from './layout-values.js';

/** Shared read-only fallback copied into each resolved area's immutable offset. */
const ZERO_OFFSET = { x: 0, y: 0 };

/**
 * Validates and resolves all authored areas into layout-local pixel coordinates.
 *
 * Area bounds are normalized fractions relative to `config.bounds`; the outer
 * layout bounds themselves are already expressed in pixels. Each result is a
 * newly frozen snapshot so consumers cannot mutate controller state through
 * `getArea()`. The returned map is replaced wholesale during layout updates.
 */
export function resolveLayout(config: LayoutConfig): ReadonlyMap<string, ResolvedLayoutArea> {
  validateLayoutBounds(config.bounds);

  const areas = new Map<string, ResolvedLayoutArea>();

  for (const [name, area] of Object.entries(config.areas)) {
    if (name.trim().length === 0) {
      throw new Error('Layout area names must not be empty.');
    }

    areas.set(name, resolveLayoutArea(name, area, config.bounds));
  }

  return areas;
}

/**
 * Resolves one normalized area without applying its content offset.
 *
 * `bounds` describes the area's rectangle. `offset` belongs to content
 * placement inside that rectangle, so adding it here would incorrectly move
 * the debug rectangle and change what normalized area definitions mean.
 */
function resolveLayoutArea(
  name: string,
  config: LayoutAreaConfig,
  layoutBounds: LayoutBounds,
): ResolvedLayoutArea {
  validateAreaBounds(name, config.bounds);
  const offset = config.offset ?? ZERO_OFFSET;

  validateFiniteNumber(offset.x, `Layout area "${name}" offset.x`);
  validateFiniteNumber(offset.y, `Layout area "${name}" offset.y`);
  validatePlacementValues(name, config);

  return Object.freeze({
    name,
    bounds: Object.freeze({
      x: layoutBounds.x + config.bounds.x * layoutBounds.width,
      y: layoutBounds.y + config.bounds.y * layoutBounds.height,
      width: config.bounds.width * layoutBounds.width,
      height: config.bounds.height * layoutBounds.height,
    }),
    align: config.align ?? DEFAULT_LAYOUT_ALIGNMENT,
    scale: config.scale ?? DEFAULT_LAYOUT_SCALE_MODE,
    offset: Object.freeze({ x: offset.x, y: offset.y }),
  });
}

/** Rejects runtime strings outside the unions even when untyped JavaScript supplied them. */
function validatePlacementValues(name: string, config: LayoutAreaConfig): void {
  if (config.align !== undefined && !layoutAlignments.includes(config.align)) {
    throw new Error(`Layout area "${name}" has an unknown alignment: ${config.align}.`);
  }

  if (config.scale !== undefined && !layoutScaleModes.includes(config.scale)) {
    throw new Error(`Layout area "${name}" has an unknown scale mode: ${config.scale}.`);
  }
}

/** Ensures the coordinate space itself can resolve normalized rectangles. */
function validateLayoutBounds(bounds: LayoutBounds): void {
  validateBounds('Layout bounds', bounds);

  if (bounds.width <= 0 || bounds.height <= 0) {
    throw new Error('Layout bounds width and height must be greater than zero.');
  }
}

/** Allows empty areas but rejects negative sizes that invert their geometry. */
function validateAreaBounds(name: string, bounds: LayoutBounds): void {
  validateBounds(`Layout area "${name}" bounds`, bounds);

  if (bounds.width < 0 || bounds.height < 0) {
    throw new Error(`Layout area "${name}" width and height must not be negative.`);
  }
}

/** Validates the four numeric components shared by layout and area rectangles. */
function validateBounds(label: string, bounds: LayoutBounds): void {
  validateFiniteNumber(bounds.x, `${label}.x`);
  validateFiniteNumber(bounds.y, `${label}.y`);
  validateFiniteNumber(bounds.width, `${label}.width`);
  validateFiniteNumber(bounds.height, `${label}.height`);
}

/** Rejects `NaN` and infinities before they can poison Pixi transforms. */
function validateFiniteNumber(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number.`);
  }
}
