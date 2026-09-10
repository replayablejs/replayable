import { resolve } from 'node:path';

import { removeExtension } from '#pipeline/source-path.js';
import type { SimpleSourceCategory, ResolvedSimpleSourceWithOptions } from '#types/resolution.js';
import type { ResolutionContext } from '#types/resolution.js';

import {
  isSupportedSourceFile,
  resolveAssetRule,
  resolveBundle,
  stripCategoryDirectory,
} from './source-resolution.js';

/**
 * Resolves physical files selected by one simple asset category.
 *
 * Every category receives the same discovered source inventory. Unsupported
 * formats are ignored first, so a rule without `match` can select every
 * supported source. A remaining file becomes a font, sound, sprite, or texture
 * only when one of that category's rules matches its path relative to that
 * category directory. When several rules match, the final rule supplies the
 * processing options.
 *
 * The returned output path has no extension because the category processor
 * decides the final format. For example, resolving `sounds/ui/click.wav` for
 * the `sounds` category beneath `/project/assets/generated` produces:
 *
 * ```ts
 * {
 *   relativePath: 'sounds/ui/click.wav',
 *   outputBasePath: '/project/assets/generated/sounds/ui/click',
 *   bundle: 'primary',
 *   options: { bitrate: 96, channels: 'mono', sampleRate: 32000 },
 * }
 * ```
 *
 * Removing the owned `sounds` directory prevents the generated path from
 * becoming `/project/assets/generated/sounds/sounds/ui/click`. Files outside
 * that directory cannot resolve as sounds.
 */
export function resolveSimpleSources<Category extends SimpleSourceCategory>(
  context: ResolutionContext,
  category: Category,
): ResolvedSimpleSourceWithOptions<Category>[] {
  const sources: ResolvedSimpleSourceWithOptions<Category>[] = [];

  for (const file of context.files) {
    if (!isSupportedSourceFile(category, file.relativePath)) {
      continue;
    }

    const rule = resolveAssetRule(context, category, file.relativePath);

    if (rule === undefined) {
      continue;
    }

    const categoryPath = stripCategoryDirectory(file.relativePath, category);

    sources.push({
      ...file,
      bundle: resolveBundle(context.config, file.relativePath),
      options: rule.options,
      outputBasePath: resolve(context.outputRoot, category, removeExtension(categoryPath)),
    });
  }

  return sources;
}
