import type { Container, PointData } from 'pixi.js';

/** Internal ownership record shared by core layout and its debug decorator. */
export interface LayoutAttachment {
  /** Name used to resolve the attachment's area after a configuration update. */
  readonly areaName: string;
  /** Exact listener removed during detach or destruction. */
  readonly handleDestroyed: () => void;
}

/** Resolved transform staged before changing a live Pixi object. */
export interface ContentLayout {
  /** Position aligning the scaled local bounds along the horizontal axis. */
  readonly x: number;
  /** Position aligning the scaled local bounds along the vertical axis. */
  readonly y: number;
  /** Final horizontal scale owned by the layout. */
  readonly scaleX: number;
  /** Final vertical scale owned by the layout. */
  readonly scaleY: number;
}

/** Alignment of laid-out content inside one named area. */
export type LayoutAlignment =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

/** How laid-out content is scaled relative to its named area. */
export type LayoutScaleMode = 'none' | 'fit' | 'contain' | 'cover' | 'stretch';

/**
 * Axis-aligned rectangle.
 *
 * `LayoutConfig.bounds` and resolved areas use layout-local pixels. Authored
 * `LayoutAreaConfig.bounds` uses normalized fractions relative to the outer
 * layout rectangle.
 */
export interface LayoutBounds {
  /** Horizontal coordinate of the left edge. */
  readonly x: number;
  /** Vertical coordinate of the top edge. */
  readonly y: number;
  /** Horizontal extent; outer layout bounds require a positive value. */
  readonly width: number;
  /** Vertical extent; outer layout bounds require a positive value. */
  readonly height: number;
}

/** Author-defined normalized bounds and placement behavior for one named area. */
export interface LayoutAreaConfig {
  /** Position of scaled content inside the resolved area; defaults to `center`. */
  readonly align?: LayoutAlignment;
  /** Normalized rectangle resolved relative to the outer layout bounds. */
  readonly bounds: LayoutBounds;
  /** Final pixel adjustment applied to content after alignment. */
  readonly offset?: PointData;
  /** Scaling policy applied before content alignment; defaults to `fit`. */
  readonly scale?: LayoutScaleMode;
}

/** Selects which diagnostic labels are visible during development. */
export interface LayoutDebugLabelOptions {
  /** Shows dimensions for every resolved named area. */
  readonly areas?: boolean;
  /** Shows dimensions for every attached content box. */
  readonly content?: boolean;
  /** Shows the outer layout dimensions. */
  readonly layout?: boolean;
}

/** Selects which development-only layout diagnostics are visible. */
export interface LayoutDebugOptions {
  /** Shows green occupied and amber empty named-area rectangles. */
  readonly areaBounds?: boolean;
  /** Shows the magenta axis-aligned boxes used to place and scale content. */
  readonly contentBounds?: boolean;
  /** Enables every label or independently configures layout, area, and content labels. */
  readonly labels?: boolean | LayoutDebugLabelOptions;
  /** Shows the cyan outer layout rectangle. */
  readonly layoutBounds?: boolean;
}

/** Complete named-area layout definition. */
export interface LayoutConfig {
  /** Layout-local rectangle against which normalized areas are resolved. */
  readonly bounds: LayoutBounds;
  /** Enables all diagnostics or selectively configures them during development. */
  readonly debug?: boolean | LayoutDebugOptions;
  /** Named normalized regions to which application display objects can be attached. */
  readonly areas: Readonly<Record<string, LayoutAreaConfig>>;
}

/** Read-only resolved placement of one named area in layout-local coordinates. */
export interface ResolvedLayoutArea {
  /** Fully defaulted content alignment. */
  readonly align: LayoutAlignment;
  /** Area rectangle resolved into layout-local pixels. */
  readonly bounds: LayoutBounds;
  /** Stable authored key used by attach and move operations. */
  readonly name: string;
  /** Immutable pixel adjustment applied after alignment. */
  readonly offset: Readonly<PointData>;
  /** Fully defaulted scaling policy. */
  readonly scale: LayoutScaleMode;
}

/** Controller returned by `createLayout()`. */
export interface ReplayableLayout {
  /**
   * Pixi container that the application adds to its chosen stage.
   * Attached content remains a direct child; named areas are calculations, not
   * additional scene-graph containers.
   */
  readonly container: Container;

  /**
   * Attaches content to a named area and immediately lays it out.
   *
   * The layout owns the attached object's position and, unless the area's
   * scale mode is `none`, its scale. Automatic fitting measures local bounds;
   * it does not include rotation or skew applied directly to the attached
   * object. Put transformed content inside an untransformed application-owned
   * container when those transforms must contribute to fitting.
   * Throws for unknown areas, duplicate attachment, destroyed content, parent
   * cycles, or content that cannot be measured for its scaling mode.
   */
  attach(areaName: string, content: Container): void;
  /**
   * Stops managing and removes attached content from the layout container.
   * The content remains alive and can be attached elsewhere by the application.
   */
  detach(content: Container): void;
  /**
   * Returns an immutable resolved-area snapshot, or `undefined` when absent.
   * Previously returned snapshots do not change after `update()`.
   */
  getArea(name: string): ResolvedLayoutArea | undefined;
  /**
   * Moves attached content to another named area without reparenting it.
   * The operation is atomic: failure preserves its previous area and transform.
   */
  move(content: Container, areaName: string): void;
  /**
   * Atomically replaces the layout definition and recalculates all attachments.
   * An occupied area cannot be removed until its content is detached or moved.
   */
  update(config: LayoutConfig): void;
  /**
   * Releases bookkeeping and destroys the owned container without destroying
   * application content. Repeated calls are harmless.
   */
  destroy(): void;
}
