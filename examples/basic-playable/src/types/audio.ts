/** Semantic sounds used by Word Garden without exposing generated asset IDs. */
export interface WordGardenAudio {
  playAcceptedWord(): void;
  playCompletedPuzzle(): void;
  playHintLetter(): void;
  playLetterVisit(): void;
  playRejectedWord(): void;
  startMusic(): void;
  stopMusic(): void;
}
