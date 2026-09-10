/** Example sound cues; loading and audio permission remain runtime responsibilities. */
export interface GameAudio {
  /** Plays the chime for an accepted reveal, never for an ignored repeat tap. */
  playCardReveal(): void;
  /** Stops active music or cancels its deferred start before releasing the scene. */
  destroy(): void;
}
