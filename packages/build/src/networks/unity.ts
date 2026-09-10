import type { NetworkHtmlHead } from '#types/network.js';

const unityHtmlHead: NetworkHtmlHead = {
  metaTags: [],
  scripts: [{ src: 'mraid.js' }],
};

/** Adds Unity's required MRAID SDK bootstrap before authored runtime code. */
export function resolveUnityHtmlHead(): NetworkHtmlHead {
  return unityHtmlHead;
}
