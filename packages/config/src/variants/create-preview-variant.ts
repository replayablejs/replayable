import { defineConfig } from '#config/define-config.js';
import {
  previewOverridesSchema,
  type ReplayablePreviewOverrides,
} from '#config/preview-overrides.js';
import type { ReplayableConfigInput } from '#types/config.js';
import type { PlayableVariant } from '#types/variant.js';

import { createVariants } from './create-variants.js';

/** Resolve one preview, applying temporary values after project, version, and network values. */
export function createPreviewVariant(
  input: ReplayableConfigInput,
  overrides: ReplayablePreviewOverrides = {},
): PlayableVariant {
  const config = defineConfig(input);
  const parsed = previewOverridesSchema.parse(overrides);
  const selected = createVariants(config).find(
    (variant) =>
      variant.network === 'preview' &&
      (parsed.version === undefined || variant.version === parsed.version) &&
      (parsed.language === undefined || variant.localization.language === parsed.language),
  );
  if (!selected) {
    throw new Error(
      `No configured playable variant matches version=${parsed.version ?? '*'}, network=preview, language=${parsed.language ?? '*'}.`,
    );
  }

  // Reuse the authored config validation for parameter names, types, ranges, and options.
  const previewConfig = defineConfig({
    ...config,
    controls: { ...config.controls, ...parsed.controls },
    devtools: { ...config.devtools, ...parsed.devtools },
    networks: {
      ...config.networks,
      preview: {
        ...config.networks.preview,
        params: { ...config.networks.preview?.params, ...parsed.params },
      },
    },
  });
  const variant = createVariants(previewConfig).find((candidate) => candidate.id === selected.id);
  if (!variant) {
    throw new Error('The selected preview variant is no longer available.');
  }
  return variant;
}
