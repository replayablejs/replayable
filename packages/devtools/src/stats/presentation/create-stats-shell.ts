import type { RuntimeStatsConfig } from '@replayablejs/runtime';

import type { StatsShell } from '#types/presentation.js';

import { installDevtoolsInteraction } from '../../interaction/install-devtools-interaction.js';
import { createStatsShellElements } from './create-stats-shell-elements.js';

/** Mounts the shell, stylesheet, and optional compact input interception. */
export function createStatsShell(
  cardElements: readonly HTMLElement[],
  display: RuntimeStatsConfig['display'],
  onCycleCard: () => void,
): StatsShell {
  const compact = display === 'compact';
  const { root, style } = createStatsShellElements(cardElements, display);
  const updateAccessibility = compact ? updateCompactAccessibility : noop;

  document.head.append(style);
  document.body.append(root);

  const removeInteraction = compact ? installDevtoolsInteraction(root, onCycleCard) : undefined;

  return { updateAccessibility, show, hide, destroy };

  /** Describes selection without leaving an empty view as an invisible click target. */
  function updateCompactAccessibility(label: string | undefined): void {
    if (label !== undefined) {
      root.setAttribute('role', 'button');
      root.tabIndex = 0;
      root.setAttribute('aria-label', `${label}. Show next stats card`);
    } else {
      root.removeAttribute('role');
      root.removeAttribute('tabindex');
      root.setAttribute('aria-label', 'Development stats');
    }
  }

  /** Visibility alone does not change card data or selection. */
  function show(): void {
    root.hidden = false;
  }

  /** Hidden shells do not intercept input. */
  function hide(): void {
    root.hidden = true;
  }

  /** Removes this shell's input listeners, DOM, and stylesheet. */
  function destroy(): void {
    removeInteraction?.();
    root.remove();
    style.remove();
  }
}

/** Expanded accessibility is static and already initialized by the shell elements. */
function noop(): void {}
