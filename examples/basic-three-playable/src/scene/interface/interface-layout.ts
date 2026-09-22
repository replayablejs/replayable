import { playable } from '@replayablejs/runtime';

import { fonts } from '../../assets/registries/fonts';

/** Give each UI layer the same font and overlay positioning. */
export function createInterfaceContainer(): HTMLDivElement {
  const container = document.createElement('div');
  container.className = 'city-interface';
  container.style.fontFamily = `${JSON.stringify(fonts['Kenney Future'])}, sans-serif`;
  return container;
}

/** Position a UI layer inside the runtime's existing safe area. */
export function applySafeArea(element: HTMLElement): void {
  const { x, y, width, height } = playable.screen.safeArea;
  element.style.left = `${x}px`;
  element.style.top = `${y}px`;
  element.style.width = `${width}px`;
  element.style.height = `${height}px`;
}
