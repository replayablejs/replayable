import type { PlayableVariant, ReplayableNetwork } from '@replayablejs/config';

import type { NetworkHtmlHead, NetworkProfile, PlayableProfile } from '#types/network.js';

import { resolveGoogleHtmlHead } from './google.js';
import { resolveUnityHtmlHead } from './unity.js';

const fullScreenEndCard = { animation: 'continuous', interaction: 'full-screen' } as const;
const ctaOnlyEndCard = { animation: 'finite', interaction: 'cta-only' } as const;
const previewControls = { persistentCta: true } as const;
const hiddenControls = { persistentCta: false } as const;
const liftoffControls = { persistentCta: true } as const;
const noCompileTimeDefinitions: Readonly<Record<string, string>> = {};

const emptyHtmlHead: NetworkHtmlHead = {
  metaTags: [],
  scripts: [],
};

const networkProfiles = {
  preview: {
    assetMode: 'inline',
    applicationMode: 'single-module',
    compileTimeDefinitions: noCompileTimeDefinitions,
    completionDurationStart: 'ready',
    controls: previewControls,
    endCard: fullScreenEndCard,
    loadingIndicator: 'replayable',
    resolveHtmlHead: resolveEmptyHtmlHead,
    runtime: 'browser',
  },
  applovin: {
    assetMode: 'inline',
    applicationMode: 'single-module',
    compileTimeDefinitions: noCompileTimeDefinitions,
    completionDurationStart: 'interaction',
    controls: hiddenControls,
    endCard: fullScreenEndCard,
    loadingIndicator: 'replayable',
    resolveHtmlHead: resolveEmptyHtmlHead,
    runtime: 'applovin',
  },
  meta: {
    assetMode: 'inline',
    applicationMode: 'single-module',
    compileTimeDefinitions: noCompileTimeDefinitions,
    completionDurationStart: 'ready',
    controls: hiddenControls,
    endCard: fullScreenEndCard,
    loadingIndicator: 'replayable',
    resolveHtmlHead: resolveEmptyHtmlHead,
    runtime: 'meta',
  },
  google: {
    assetMode: 'resource',
    applicationMode: 'module-graph',
    compileTimeDefinitions: noCompileTimeDefinitions,
    completionDurationStart: 'ready',
    controls: hiddenControls,
    endCard: ctaOnlyEndCard,
    loadingIndicator: 'replayable',
    resolveHtmlHead: resolveGoogleHtmlHead,
    runtime: 'google',
  },
  liftoff: {
    assetMode: 'resource',
    applicationMode: 'module-graph',
    compileTimeDefinitions: noCompileTimeDefinitions,
    completionDurationStart: 'ready',
    controls: liftoffControls,
    endCard: fullScreenEndCard,
    loadingIndicator: 'replayable',
    resolveHtmlHead: resolveEmptyHtmlHead,
    runtime: 'liftoff',
  },
  mintegral: {
    assetMode: 'inline',
    applicationMode: 'single-module',
    compileTimeDefinitions: noCompileTimeDefinitions,
    completionDurationStart: 'ready',
    controls: hiddenControls,
    endCard: fullScreenEndCard,
    loadingIndicator: 'host',
    resolveHtmlHead: resolveEmptyHtmlHead,
    runtime: 'mintegral',
  },
  moloco: {
    assetMode: 'inline',
    applicationMode: 'single-module',
    compileTimeDefinitions: {
      // Moloco forbids this global. Howler only needs it for URL sources, while
      // Moloco's inline asset mode always supplies audio as a data URI.
      XMLHttpRequest: 'undefined',
    },
    completionDurationStart: 'ready',
    controls: hiddenControls,
    endCard: fullScreenEndCard,
    loadingIndicator: 'replayable',
    resolveHtmlHead: resolveEmptyHtmlHead,
    runtime: 'moloco',
  },
  unity: {
    assetMode: 'inline',
    applicationMode: 'single-module',
    compileTimeDefinitions: noCompileTimeDefinitions,
    completionDurationStart: 'ready',
    controls: hiddenControls,
    endCard: fullScreenEndCard,
    loadingIndicator: 'replayable',
    resolveHtmlHead: resolveUnityHtmlHead,
    runtime: 'unity',
  },
} satisfies Record<ReplayableNetwork, NetworkProfile>;

/** Resolves the asset, document, and runtime policy owned by one variant's network. */
export function resolvePlayableProfile(variant: PlayableVariant): PlayableProfile {
  const profile = networkProfiles[variant.network];

  return {
    assetMode: profile.assetMode,
    applicationMode: profile.applicationMode,
    compileTimeDefinitions: profile.compileTimeDefinitions,
    completionDurationStart: profile.completionDurationStart,
    // Development always selects preview. Real ad networks replace authored
    // preferences completely, rather than treating them as optional overrides.
    controls: variant.network === 'preview' ? variant.controls : profile.controls,
    endCard: profile.endCard,
    htmlHead: profile.resolveHtmlHead(variant),
    loadingIndicator: profile.loadingIndicator,
    runtime: profile.runtime,
  };
}

/** Returns no document additions for networks without production head requirements. */
function resolveEmptyHtmlHead(_variant: PlayableVariant): NetworkHtmlHead {
  return emptyHtmlHead;
}
