/** One mounted DOM scene; its layers own their input, animations, and cleanup. */
export interface MainScene {
  readonly container: HTMLElement;
  /** Begin entrances after the scene has been mounted. */
  show(): void;
  destroy(): void;
}
