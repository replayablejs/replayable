import type { CheerioAPI } from 'cheerio';

import type { HtmlBuildEntries } from '#types/html-document.js';

const ENTRY_ATTRIBUTE = 'data-replayable-entry';
const entryRoles: readonly (keyof HtmlBuildEntries)[] = ['host', 'config', 'assets', 'application'];

/**
 * Requires the four generated runtime entries to appear once in execution order.
 *
 * Module scripts execute in document order after fetching, so accepting missing,
 * duplicated, or reordered markers would make an otherwise valid archive fail only
 * at runtime with a misleading registration error.
 */
export function validateBuildEntryOrder(document: CheerioAPI, variantId: string): void {
  const actualRoles = document(`script[${ENTRY_ATTRIBUTE}]`)
    .toArray()
    .map((element) => document(element).attr(ENTRY_ATTRIBUTE));

  if (
    actualRoles.length === entryRoles.length &&
    actualRoles.every((role, index) => role === entryRoles[index])
  ) {
    return;
  }

  throw new Error(
    `Build ${variantId} must execute Replayable entries as ${entryRoles.join(' → ')}; received ${actualRoles.join(' → ') || 'none'}.`,
  );
}
