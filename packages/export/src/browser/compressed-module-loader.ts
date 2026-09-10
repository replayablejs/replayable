/// <reference lib="dom" />

import {
  COMPRESSED_ENTRY_ATTRIBUTE,
  ENTRY_ENCODING_ATTRIBUTE,
} from '#shared/compression-protocol.js';
import type { PakoInflater } from '#types/javascript.js';

import { executeModule } from './execute-module.js';

declare const pako: PakoInflater;

const entryRoles = ['assets', 'application'] as const;

for (const role of entryRoles) {
  const payload = document.querySelector(`script[${COMPRESSED_ENTRY_ATTRIBUTE}="${role}"]`);

  if (!(payload instanceof HTMLScriptElement)) {
    throw new Error(`Missing compressed Replayable ${role} entry.`);
  }

  const payloadSource = payload.textContent;

  if (payloadSource === null || payloadSource.trim().length === 0) {
    throw new Error(`Compressed Replayable ${role} entry is empty.`);
  }

  try {
    const source =
      payload.getAttribute(ENTRY_ENCODING_ATTRIBUTE) === 'deflate'
        ? inflateSource(payloadSource)
        : payloadSource;

    await executeModule(source, role);
  } finally {
    // Payloads contain the largest temporary strings in the exported document.
    // Remove them after success and failure so execution errors do not retain
    // compressed or identity source in the DOM for the rest of the ad session.
    payload.remove();
  }
}

/** Restores one Base64-encoded Deflate payload to its original JavaScript. */
function inflateSource(payload: string): string {
  const bytes = Uint8Array.from(atob(payload.trim()), (character) => character.charCodeAt(0));

  return pako.inflate(bytes, { to: 'string' });
}
