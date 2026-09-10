import type { PlayableTimers } from '@replayablejs/runtime';

import type { WordGardenAudio } from './audio';
import type { WordGardenGame } from './game';
import type { PuzzleLevel } from './puzzle';
import type { WheelView } from './view';

/** Controls Word Garden's non-destructive inactivity hint sequence. */
export interface WordGardenHint {
  /** Cancels an active preview and suspends inactivity during a pointer gesture. */
  beginInteraction(): void;
  /** Starts a fresh inactivity window after the pointer gesture ends. */
  endInteraction(): void;
  /** Starts the first inactivity window. */
  start(): void;
  /** Permanently stops the timer and any active letter highlight. */
  stop(): void;
}

export interface WordGardenHintOptions {
  readonly audio: WordGardenAudio;
  readonly delay: number;
  readonly game: WordGardenGame;
  readonly level: PuzzleLevel;
  readonly timers: PlayableTimers;
  readonly view: WheelView;
}
