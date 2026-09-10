import {
  REPLAYABLE_CONTAINER_ID,
  REPLAYABLE_LOADING_INDICATOR_ID,
  REPLAYABLE_ROOT_ID,
} from '#shell/index.js';
import type { PlayableShell } from '#types/shell.js';

/**
 * Resolves the mount points emitted by Replayable's HTML builder.
 *
 * Keeping this lookup in one place prevents runtime features from independently
 * querying the document or duplicating the framework's element IDs.
 */
export function resolvePlayableShell(): PlayableShell {
  return {
    root: requireShellElement(REPLAYABLE_ROOT_ID),
    container: requireShellElement(REPLAYABLE_CONTAINER_ID),
    loadingIndicator: document.getElementById(REPLAYABLE_LOADING_INDICATOR_ID) ?? undefined,
  };
}

/** Returns one required shell element with an actionable initialization error. */
function requireShellElement(id: string): HTMLElement {
  const element = document.getElementById(id);

  if (element === null) {
    throw new Error(`Replayable shell element #${id} was not found.`);
  }

  return element;
}
