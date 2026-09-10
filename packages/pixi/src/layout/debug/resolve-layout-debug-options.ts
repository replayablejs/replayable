import type { ResolvedLayoutDebugLabels, ResolvedLayoutDebugOptions } from '#types/layout-debug.js';
import type { LayoutConfig, LayoutDebugOptions } from '#types/layout.js';

const allLabels: ResolvedLayoutDebugLabels = {
  areas: true,
  content: true,
  layout: true,
};

/** Canonical defaults shared by boolean shorthand and selective option objects. */
const allDiagnostics: ResolvedLayoutDebugOptions = {
  areaBounds: true,
  contentBounds: true,
  labels: allLabels,
  layoutBounds: true,
};

/**
 * Resolves the public debug shorthand into the complete internal configuration.
 *
 * `true` enables every diagnostic. An options object starts from the same set
 * and can selectively disable individual diagnostics. `false` and omission
 * both disable the overlay.
 */
export function resolveLayoutDebugOptions(
  debug: LayoutConfig['debug'],
): ResolvedLayoutDebugOptions | undefined {
  if (debug === undefined || debug === false) {
    return undefined;
  }

  if (debug === true) {
    return allDiagnostics;
  }

  return {
    ...allDiagnostics,
    ...debug,
    labels: resolveLabels(debug.labels),
  };
}

/** Resolves the label shorthand independently from the other debug switches. */
function resolveLabels(labels: LayoutDebugOptions['labels']): ResolvedLayoutDebugLabels {
  if (labels === false) {
    return { areas: false, content: false, layout: false };
  }

  if (labels === undefined || labels === true) {
    return allLabels;
  }

  return { ...allLabels, ...labels };
}
