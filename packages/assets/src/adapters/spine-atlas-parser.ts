import { TextureAtlas } from '@esotericsoftware/spine-core';

/**
 * Parses the texture pages declared by an authored Spine atlas.
 *
 * Replayable uses Spine's official runtime parser so page boundaries and names
 * follow the same rules as the eventual runtime loader. Returned names preserve
 * declaration order because the processor emits its texture array in that exact
 * order: the first atlas page becomes `images[0]`, the second becomes
 * `images[1]`, and so on.
 *
 * `TextureAtlas` owns runtime objects even though Replayable only needs their
 * page names. The `finally` block releases those objects after names have been
 * copied, including when reading the pages unexpectedly throws.
 *
 * @param source - Complete text of the authored `.atlas` file.
 * @param sourcePath - Source-relative path used only in parse diagnostics.
 * @returns Texture page names in their authored declaration order.
 * @throws A source-specific error when the official Spine parser rejects the atlas.
 *
 * @example
 *
 * ```ts
 * const pageNames = parseSpineAtlasPageNames(atlasSource, 'spines/hero/hero.atlas');
 *
 * // hero.atlas declares body.png first and effects.png second.
 * console.log(pageNames); // ['body.png', 'effects.png']
 * ```
 */
export function parseSpineAtlasPageNames(source: string, sourcePath: string): string[] {
  const atlas = createTextureAtlas(source, sourcePath);

  try {
    return atlas.pages.map((page) => page.name);
  } finally {
    atlas.dispose();
  }
}

/** Creates the official runtime atlas and adds the source path to parse failures. */
function createTextureAtlas(source: string, sourcePath: string): TextureAtlas {
  try {
    return new TextureAtlas(source);
  } catch (cause) {
    throw new Error(`Invalid Spine atlas: ${sourcePath}`, { cause });
  }
}
