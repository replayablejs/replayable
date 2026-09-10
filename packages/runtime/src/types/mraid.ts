/** Lifecycle states exposed by MRAID 2 and retained by MRAID 3. */
type MraidState = 'default' | 'expanded' | 'hidden' | 'loading' | 'resized';

/** Rectangle reported in CSS pixels relative to the host ad container. */
interface MraidRectangle {
  readonly height: number;
  readonly width: number;
  readonly x: number;
  readonly y: number;
}

/** Listener signatures for the subset of MRAID events consumed by Replayable. */
interface MraidEventMap {
  /** MRAID 3 host volume from `0` through `100`, or `null` when unavailable. */
  readonly audioVolumeChange: (volume: number | null) => void;
  /** MRAID 3 exposure details; Replayable currently consumes only the percentage. */
  readonly exposureChange: (
    exposedPercentage: number,
    visibleRectangle: MraidRectangle | null,
    occlusionRectangles: readonly MraidRectangle[] | null,
  ) => void;
  /** Fired when an SDK that began in `loading` becomes safe to use. */
  readonly ready: () => void;
  /** Current ad-container dimensions after the host resizes it. */
  readonly sizeChange: (width: number, height: number) => void;
  /** MRAID 2 viewability signal used when exposure events are unavailable. */
  readonly viewableChange: (visible: boolean) => void;
}

/** Minimal external MRAID surface required by the Replayable host adapter. */
export interface MraidApi {
  addEventListener<Event extends keyof MraidEventMap>(
    event: Event,
    listener: MraidEventMap[Event],
  ): void;
  getCurrentPosition(): MraidRectangle;
  getState(): MraidState;
  getVersion(): string;
  isViewable(): boolean;
  open(url?: string): void;
  removeEventListener<Event extends keyof MraidEventMap>(
    event: Event,
    listener: MraidEventMap[Event],
  ): void;
}
