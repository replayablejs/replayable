/** Unmounted shell elements; mounting and cleanup belong to the shell lifecycle. */
export interface StatsShellElements {
  readonly root: HTMLElement;
  readonly style: HTMLStyleElement;
}
