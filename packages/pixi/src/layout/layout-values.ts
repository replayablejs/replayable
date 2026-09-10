import type { LayoutAlignment, LayoutScaleMode } from '#types/layout.js';

/** Supported positions of content inside one resolved layout area. */
export const layoutAlignments = [
  'top-left',
  'top-center',
  'top-right',
  'center-left',
  'center',
  'center-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
] as const satisfies readonly LayoutAlignment[];

/** Supported ways to scale content relative to one resolved layout area. */
export const layoutScaleModes = [
  'none',
  'fit',
  'contain',
  'cover',
  'stretch',
] as const satisfies readonly LayoutScaleMode[];

/** Placement used when an area does not explicitly choose an alignment. */
export const DEFAULT_LAYOUT_ALIGNMENT = 'center' satisfies LayoutAlignment;

/** Safe scaling default: shrink oversized content without unexpectedly enlarging it. */
export const DEFAULT_LAYOUT_SCALE_MODE = 'fit' satisfies LayoutScaleMode;
