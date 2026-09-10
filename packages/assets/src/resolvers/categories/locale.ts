import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { removeExtension } from '#pipeline/source-path.js';
import type { LocalizationConfig } from '#types/config.js';
import type { ResolutionContext } from '#types/resolution.js';
import type { ResolvedLocaleAsset, ResolvedSimpleSource } from '#types/resolved-assets.js';

import { resolveLocaleDictionary } from '../locale-dictionary.js';
import {
  isSupportedSourceFile,
  resolveAssetRule,
  resolveBundle,
  stripCategoryDirectory,
} from '../source-resolution.js';

/** Resolves the one locale source selected by the project's locale rules. */
export async function resolveLocales(context: ResolutionContext): Promise<ResolvedLocaleAsset[]> {
  const sources = resolveLocaleSources(context);
  const source = sources[0];

  if (source === undefined) {
    return [];
  }

  if (sources.length > 1) {
    throw new Error(
      `Locale rules must match at most one translation file; received ${sources.length}.`,
    );
  }

  return [await resolveLocaleSource(source, context.config.localization)];
}

/** Selects locale files without mixing singular locale behavior into simple-source resolution. */
function resolveLocaleSources(context: ResolutionContext): ResolvedSimpleSource[] {
  const sources: ResolvedSimpleSource[] = [];

  for (const file of context.files) {
    if (!isSupportedSourceFile('locales', file.relativePath)) {
      continue;
    }

    const rule = resolveAssetRule(context, 'locales', file.relativePath);

    if (rule === undefined) {
      continue;
    }

    const localePath = stripCategoryDirectory(file.relativePath, 'locales');

    sources.push({
      ...file,
      bundle: resolveBundle(context.config, file.relativePath),
      outputBasePath: resolve(context.outputRoot, 'locales', removeExtension(localePath)),
    });
  }

  return sources;
}

/** Reads and resolves the selected locale into one fixed-language runtime asset. */
async function resolveLocaleSource(
  source: ResolvedSimpleSource,
  localization: LocalizationConfig,
): Promise<ResolvedLocaleAsset> {
  const contents = await readFile(source.absolutePath, 'utf8');
  const resolvedLocale = resolveLocaleDictionary(contents, source.relativePath, localization);

  return {
    ...source,
    category: 'locales',
    resolvedLocale,
  };
}
