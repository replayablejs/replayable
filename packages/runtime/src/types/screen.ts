/** Inclusive numeric bounds already validated by project configuration. */
export interface RuntimeRange {
  readonly max: number;
  readonly min: number;
}

/** One orientation's authored coordinate system and supported viewport ratios. */
export interface RuntimeOrientationConfig {
  readonly enabled: boolean;
  readonly height: number;
  readonly ratio: RuntimeRange;
  readonly width: number;
}

/** Render-resolution multipliers ordered from the lowest to highest quality policy. */
export interface RuntimeRenderScaleConfig {
  readonly balanced: number;
  readonly full: number;
  readonly minimal: number;
  readonly reduced: number;
}

/** Device-pixel bounds and renderer-quality scaling policy. */
export interface RuntimeResolutionConfig {
  readonly pixelRatio: RuntimeRange;
  readonly renderScale: RuntimeRenderScaleConfig;
}

/** Resolved rendering dimensions and resolution policy. */
export interface RuntimeScreenConfig {
  readonly orientations: {
    readonly landscape: RuntimeOrientationConfig;
    readonly portrait: RuntimeOrientationConfig;
  };
  readonly resolution: RuntimeResolutionConfig;
}

/** Orientation derived from the current viewport and configured capabilities. */
export type RuntimeOrientation = 'landscape' | 'portrait';

/** Current dimensions of the ad container in CSS pixels. */
export interface RuntimeViewport {
  readonly width: number;
  readonly height: number;
}

/** Authored width and height expressed in playable design units. */
export interface ScreenDesign {
  readonly width: number;
  readonly height: number;
}

/** Usable CSS-pixel area after applying the configured aspect-ratio limits. */
export interface ScreenFrame extends RuntimeViewport {
  readonly x: number;
  readonly y: number;
}

/** Complete engine-neutral layout snapshot for the current playable viewport. */
export interface Screen {
  /** Authored coordinate system selected for the active orientation. */
  readonly design: ScreenDesign;
  /** Constrained area in which the playable should render. */
  readonly frame: ScreenFrame;
  /** Cached content rectangle in frame-local CSS pixels; never shrinks the canvas. */
  readonly safeArea: ScreenFrame;
  /** Orientation selected from the configured screen capabilities. */
  readonly orientation: RuntimeOrientation;
  /** Device-pixel multiplier to use for renderer resolution. */
  readonly resolution: number;
  /** CSS pixels represented by one authored design unit. */
  readonly scale: number;
  /** Full ad-container dimensions reported by the active host. */
  readonly viewport: RuntimeViewport;
}
