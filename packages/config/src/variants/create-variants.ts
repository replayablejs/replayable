import { networkSchema } from '#config/schemas/variants.js';
import type { ReplayableConfig } from '#types/config.js';
import type { PlayableVariant, VariantOverride, VariantSelection } from '#types/variant.js';

const ALL_SOUNDS_PATTERN = 'sounds/**';

/**
 * Expands one project configuration into every version/network/language combination.
 *
 * Every returned variant contains resolved values. Base parameters are extended
 * by network parameters and then version parameters, making the version the
 * most specific override. Asset exclusions follow the same precedence.
 *
 * @param config - Validated Replayable project configuration.
 * @returns The ordered concrete playable variants.
 */
export function createVariants(config: ReplayableConfig): PlayableVariant[] {
  const variants: PlayableVariant[] = [];

  for (const [version, versionOverride] of Object.entries(config.versions)) {
    for (const network of networkSchema.options) {
      const networkOverride = config.networks[network];

      if (networkOverride === undefined) {
        continue;
      }

      for (const language of config.localization.languages) {
        variants.push(
          createPlayableVariant(config, {
            language,
            network,
            networkOverride,
            version,
            versionOverride,
          }),
        );
      }
    }
  }

  return variants;
}

/** Creates one fully concrete playable from the three configured dimensions. */
function createPlayableVariant(
  config: ReplayableConfig,
  selection: VariantSelection,
): PlayableVariant {
  const { language, network, networkOverride, version, versionOverride } = selection;
  const audio = resolveAudio(config.audio, networkOverride.audio, versionOverride.audio);
  const localization = {
    language,
    fallback: config.localization.fallback,
  };

  return {
    assets: resolveAssetConfig(
      config.assets,
      localization,
      audio,
      networkOverride.assets,
      versionOverride.assets,
    ),
    audio,
    backgroundColor: config.backgroundColor,
    completion: resolveCompletion(
      config.completion,
      networkOverride.completion,
      versionOverride.completion,
    ),
    controls: config.controls,
    devtools: config.devtools,
    entry: config.entry,
    id: `${version}/${network}/${language}`,
    localization,
    network,
    params: resolveParams(config.params, networkOverride.params, versionOverride.params),
    projectName: config.name,
    screen: config.screen,
    store: config.store,
    version,
  };
}

/** Resolves each completion timer independently using project, network, then version precedence. */
function resolveCompletion(
  project: ReplayableConfig['completion'],
  network: VariantOverride['completion'],
  version: VariantOverride['completion'],
): PlayableVariant['completion'] {
  const duration = resolveCompletionDuration(
    project.duration,
    network?.duration,
    version?.duration,
  );
  const inactivity = resolveCompletionDuration(
    project.inactivity,
    network?.inactivity,
    version?.inactivity,
  );
  const completion: { duration?: number; inactivity?: number } = {};

  if (duration !== undefined) {
    completion.duration = duration;
  }

  if (inactivity !== undefined) {
    completion.inactivity = inactivity;
  }

  return completion;
}

/** Selects the most specific timer value and removes an explicit `false`. */
function resolveCompletionDuration(
  project: number | undefined,
  network: number | false | undefined,
  version: number | false | undefined,
): number | undefined {
  const resolved = version ?? network ?? project;

  return resolved === false ? undefined : resolved;
}

/** Completes the shared asset configuration for one fixed-language variant. */
function resolveAssetConfig(
  base: ReplayableConfig['assets'],
  localization: PlayableVariant['localization'],
  audio: boolean,
  network: VariantOverride['assets'],
  version: VariantOverride['assets'],
): PlayableVariant['assets'] {
  const exclude = [...base.exclude, ...(network?.exclude ?? []), ...(version?.exclude ?? [])];

  // A silent variant must not process or emit sound files. Preserve an authored
  // all-sounds exclusion without adding the same pattern a second time.
  if (!audio && !exclude.includes(ALL_SOUNDS_PATTERN)) {
    exclude.push(ALL_SOUNDS_PATTERN);
  }

  return {
    ...base,
    localization,
    exclude,
  };
}

/** Resolves audio as a capability that any configuration dimension may disable. */
function resolveAudio(
  project: boolean,
  network: VariantOverride['audio'],
  version: VariantOverride['audio'],
): boolean {
  return project && network !== false && version !== false;
}

/** Extracts authored defaults, then applies network and version value overrides. */
function resolveParams(
  definitions: ReplayableConfig['params'],
  network: VariantOverride['params'],
  version: VariantOverride['params'],
): PlayableVariant['params'] {
  const defaults = Object.fromEntries(
    Object.entries(definitions).map(([name, definition]) => [name, definition.default]),
  );

  return {
    ...defaults,
    ...network,
    ...version,
  };
}
