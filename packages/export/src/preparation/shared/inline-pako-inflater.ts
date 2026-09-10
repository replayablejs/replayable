import type { HtmlBuildResource } from '#types/html-document.js';

import { loadPakoInflater } from './load-pako-inflater.js';

/**
 * Embeds Pako's official inflate-only distribution before the first compressed entry.
 *
 * The original minified source is preserved, including its license banner. The
 * caller owns the one-time decision so multiple module candidates share one inflater.
 */
export async function inlinePakoInflater(beforeEntry: HtmlBuildResource): Promise<void> {
  const source = await loadPakoInflater();
  const script = beforeEntry.element.clone();

  script.removeAttr('src');
  script.removeAttr('type');
  script.text(source);

  beforeEntry.element.before(script);
}
