import type { PlayableVariant } from '@replayablejs/config';
import type { RuntimeConfig, RuntimeDefinition } from '@replayablejs/runtime';

import type { PlayableProfile } from '#types/network.js';

const RUNTIME_DEFINITION = 'REPLAYABLE_RUNTIME_DEFINITION';

/** Creates the platform-neutral value completed by the browser config entry. */
export function createRuntimeDefine(
  variant: PlayableVariant,
  profile: PlayableProfile,
): Record<string, string> {
  const definition: Pick<RuntimeDefinition, 'assetMode' | 'config'> = {
    assetMode: profile.assetMode,
    config: {
      audio: variant.audio,
      backgroundColor: variant.backgroundColor,
      completion: createRuntimeCompletionConfig(variant, profile),
      controls: {
        persistentCta: profile.controls.persistentCta,
      },
      devtools: variant.devtools,
      endCard: profile.endCard,
      id: variant.id,
      localization: variant.localization,
      network: variant.network,
      params: variant.params,
      screen: variant.screen,
      store: variant.store,
      version: variant.version,
    },
  };

  return {
    [RUNTIME_DEFINITION]: JSON.stringify(definition),
  };
}

/** Removes disabled timers while adding the network-owned duration start policy. */
function createRuntimeCompletionConfig(
  variant: PlayableVariant,
  profile: PlayableProfile,
): RuntimeConfig['completion'] {
  const { duration, inactivity } = variant.completion;

  return {
    durationStart: profile.completionDurationStart,
    ...(duration === undefined ? {} : { duration }),
    ...(inactivity === undefined ? {} : { inactivity }),
  };
}
