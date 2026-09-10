/** Campaign click-through API shared by Meta and Moloco hosts. */
export interface FbPlayableApi {
  onCTAClick(): void;
}

/** Host commands and lifecycle callbacks exchanged with Mintegral. */
export interface MintegralWindow extends Window {
  gameClose?: () => void;
  gameEnd?: () => void;
  gameReady?: () => void;
  gameStart?: () => void;
  install?: () => void;
}

/** Optional Liftoff campaign API layered on its MRAID host. */
export interface LiftoffApi {
  open(): void;
  ready(callback: () => void): void;
}

/** Browser global carrying the optional Liftoff API. */
export interface LiftoffWindow extends Window {
  readonly Liftoff?: LiftoffApi;
}
