/** Header and persistent CTA remain direct grid children, without a wrapper. */
export interface GameInterface {
  readonly header: HTMLElement;
  readonly persistentCta: HTMLButtonElement;
  show(): void;
  showEndCard(): void;
  destroy(): void;
}
