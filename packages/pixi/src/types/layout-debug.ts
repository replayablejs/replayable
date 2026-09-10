import type { LayoutBounds, LayoutDebugLabelOptions, ResolvedLayoutArea } from './layout.js';

/** Internal form in which every label switch has an explicit value. */
export type ResolvedLayoutDebugLabels = Required<LayoutDebugLabelOptions>;

/** Internal form in which every diagnostic switch has an explicit value. */
export interface ResolvedLayoutDebugOptions {
  readonly areaBounds: boolean;
  readonly contentBounds: boolean;
  readonly labels: ResolvedLayoutDebugLabels;
  readonly layoutBounds: boolean;
}

/** Resolved area plus the diagnostic facts needed to draw it. */
export interface DebugLayoutArea extends ResolvedLayoutArea {
  /** Placement boxes measured only when content diagnostics are enabled. */
  readonly contentBounds: readonly LayoutBounds[];
  /** Whether the decorator tracks at least one attachment in this area. */
  readonly occupied: boolean;
}

/** Complete read-only input consumed by one overlay redraw. */
export interface DebugLayoutInspection {
  readonly areas: readonly DebugLayoutArea[];
  /** Outer layout rectangle in layout-local pixels. */
  readonly bounds: LayoutBounds;
  readonly options: ResolvedLayoutDebugOptions;
}

/** Visual diagnostics owned by the development decorator. */
export interface LayoutDebugRenderer {
  /** Releases every Pixi resource created for the overlay. */
  readonly destroy: () => void;
  /** Draws current diagnostics, or clears the overlay for undefined. */
  readonly render: (inspection: DebugLayoutInspection | undefined) => void;
}
