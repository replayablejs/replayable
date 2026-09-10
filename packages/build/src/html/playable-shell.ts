import {
  REPLAYABLE_CONTAINER_ID,
  REPLAYABLE_LOADING_INDICATOR_ID,
  REPLAYABLE_ROOT_ID,
} from '@replayablejs/runtime/shell';
import { h } from 'hastscript';

import type { LoadingIndicatorOwner } from '#types/network.js';

import loadingIndicatorStyles from './loading-indicator.scss?inline';
import playableShellStyles from './playable-shell.scss?inline';

/** Returns only the framework styles required by the active loading owner. */
export function resolvePlayableShellStyles(loadingIndicator: LoadingIndicatorOwner): string {
  if (loadingIndicator === 'host') {
    return playableShellStyles;
  }

  return `${playableShellStyles}${loadingIndicatorStyles}`;
}

/** Renders the framework mount points shared by DOM and canvas playables. */
export function renderPlayableShell(loadingIndicator: LoadingIndicatorOwner): ReturnType<typeof h> {
  const children = [h('div', { id: REPLAYABLE_CONTAINER_ID })];

  if (loadingIndicator === 'replayable') {
    children.unshift(
      h('div', {
        id: REPLAYABLE_LOADING_INDICATOR_ID,
        role: 'status',
        ariaLabel: 'Loading',
      }),
    );
  }

  return h('div', { id: REPLAYABLE_ROOT_ID }, children);
}
