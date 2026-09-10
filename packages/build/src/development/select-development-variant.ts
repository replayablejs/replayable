import type { PlayableVariant } from '@replayablejs/config';

import type { VariantSelection } from '#types/build.js';

/** Selects the preview variant that satisfies every explicit development choice. */
export function selectDevelopmentVariant(
  variants: readonly PlayableVariant[],
  selection: VariantSelection,
): PlayableVariant {
  const variant = variants.find(
    (candidate) =>
      candidate.network === 'preview' &&
      (selection.version === undefined || candidate.version === selection.version) &&
      (selection.language === undefined || candidate.localization.language === selection.language),
  );

  if (variant === undefined) {
    throw new Error(`No configured playable variant matches ${describeSelection(selection)}.`);
  }

  return variant;
}

/** Produces a concise, actionable description for an invalid selection. */
function describeSelection(selection: VariantSelection): string {
  return [
    `version=${selection.version ?? '*'}`,
    'network=preview',
    `language=${selection.language ?? '*'}`,
  ].join(', ');
}
