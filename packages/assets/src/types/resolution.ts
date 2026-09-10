import type { AssetCategory, SimpleAssetCategory } from './categories.js';
import type { AssetConfig } from './config.js';
import type { ResolvedSimpleSource } from './resolved-assets.js';
import type { SourceFile } from './source.js';

/** Shared inputs available to every category resolver. */
export interface ResolutionContext {
  readonly config: AssetConfig;
  readonly files: readonly SourceFile[];
  readonly outputRoot: string;
}

export type AssetRule<Category extends AssetCategory> = AssetConfig['assets'][Category][number];

export type SecondaryBundleConfig = NonNullable<AssetConfig['bundles']['secondary']>;

/** Simple source whose category rule supplies processor options. */
export interface ResolvedSimpleSourceWithOptions<
  Category extends SimpleSourceCategory,
> extends ResolvedSimpleSource {
  readonly options: SimpleSourceRule<Category>['options'];
}

export type SimpleSourceRule<Category extends SimpleSourceCategory> =
  AssetConfig['assets'][Category][number];

export type SimpleSourceCategory = Exclude<SimpleAssetCategory, 'locales'>;

/** Images currently collected for one logical atlas directory. */
export interface AtlasSourceGroup {
  readonly directory: string;
  readonly images: readonly SourceFile[];
  readonly rule: AtlasRule;
}

export type AtlasRule = AssetConfig['assets']['atlases'][number];

/** Complete vertex and fragment sources belonging to one logical shader. */
export interface ShaderSourceGroup {
  readonly directory: string;
  readonly frag: SourceFile;
  readonly vert: SourceFile;
}

/** Complete authored files and options belonging to one logical Spine export. */
export interface SpineSourceGroup {
  readonly atlas: SourceFile;
  readonly directory: string;
  readonly images: readonly SourceFile[];
  readonly options: SpineRule['options'];
  readonly skeleton: SpineSkeletonSource;
}

/** Selected skeleton source with its runtime loading format resolved. */
export interface SpineSkeletonSource extends SourceFile {
  readonly format: 'json' | 'skel';
}

export type SpineRule = AssetConfig['assets']['spines'][number];

/** Locale information parsed from one physical sprite filename. */
export interface ParsedSpritePath {
  readonly canonicalPath: string;
  readonly locale: string | undefined;
}

/** Every localized source variant belonging to one logical sprite path. */
export interface SpriteVariantGroup {
  readonly canonicalPath: string;
  readonly variants: readonly SpriteVariant[];
}

/** One matched source file with its logical identity and processing options resolved. */
export interface SpriteVariant extends SourceFile {
  readonly canonicalPath: string;
  readonly locale: string | undefined;
  readonly options: SpriteRule['options'];
}

export type SpriteRule = AssetConfig['assets']['sprites'][number];
