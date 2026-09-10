/** Framework-owned elements that contain the active playable. */
export interface PlayableShell {
  readonly root: HTMLElement;
  readonly container: HTMLElement;
  readonly loadingIndicator: HTMLElement | undefined;
}
