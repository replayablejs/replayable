import { readFile } from 'node:fs/promises';
import { dirname, extname, isAbsolute, relative, resolve } from 'node:path';

/**
 * Rejects explicit OBJ material references absent from the declared MTL libraries.
 *
 * obj2gltf silently creates a default material for an unknown `usemtl` name without
 * emitting a diagnostic. Validate names before conversion so that typo cannot
 * change authored appearance unnoticed. Geometry-only files remain valid, and
 * material definitions may appear in any of several declared libraries.
 *
 * This reads only material declarations, not geometry or texture maps. Directive
 * matching and name extraction follow obj2gltf's line-based parsing; material
 * names remain case-sensitive and may contain spaces. Dependency paths follow
 * the importer's secure directory policy rather than probing fallback locations.
 *
 * @param path - OBJ entry path; MTL references are resolved relative to its directory.
 * @throws If a used material is undefined, a library cannot be read, or its path
 * escapes the OBJ directory. The model processor adds the source asset context.
 */
export async function validateObjMaterials(path: string): Promise<void> {
  const lines = (await readFile(path, 'utf8')).split(/\r\n|\n|\r/).map((line) => line.trim());
  const used = new Set(
    lines.filter((line) => /^usemtl/i.test(line)).map((line) => line.substring(7).trim()),
  );
  // Empty material names and files with no usemtl directive use the importer's
  // unnamed/default-material behavior, not an unresolved named reference.
  used.delete('');
  if (used.size === 0) {
    return;
  }

  const libraries = new Set(
    lines
      .filter((line) => /^mtllib/i.test(line))
      .flatMap((line) => materialLibraryPaths(line.substring(7).trim())),
  );
  const defined = new Set<string>();
  for (const library of libraries) {
    const libraryPath = resolveMaterialLibrary(path, library);
    const source = await readFile(libraryPath, 'utf8');
    for (const line of source.split(/\r\n|\n|\r/)) {
      const declaration = line.trim();
      if (/^newmtl/i.test(declaration)) {
        defined.add(declaration.substring(7).trim());
      }
    }
  }

  const missing = [...used].filter((name) => !defined.has(name));
  if (missing.length > 0) {
    throw new Error(
      `Undefined OBJ material(s): ${missing.map((name) => JSON.stringify(name)).join(', ')}. Define each usemtl name with newmtl in a referenced MTL file.`,
    );
  }
}

/**
 * Reads library filenames using obj2gltf's supported filename convention.
 *
 * A .mtl suffix terminates each filename, allowing both space-containing paths
 * and multiple libraries on one line. A surrounding pair of double quotes is
 * removed as in the importer. Matching the converter avoids accepting material
 * definitions from files that it would not actually load.
 */
function materialLibraryPaths(value: string): string[] {
  const parts = value.replace(/^"(.+)"$/, '$1').split(' ');
  const paths: string[] = [];
  let start = 0;
  for (const [index, part] of parts.entries()) {
    if (extname(part) === '.mtl') {
      paths.push(parts.slice(start, index + 1).join(' '));
      start = index + 1;
    }
  }
  return paths;
}

/** Resolves slash styles without allowing the preflight read outside the OBJ directory. */
function resolveMaterialLibrary(objPath: string, library: string): string {
  const directory = dirname(objPath);
  const path = resolve(directory, library.replaceAll('\\', '/'));
  const localPath = relative(directory, path);
  if (
    localPath === '..' ||
    localPath.startsWith('../') ||
    localPath.startsWith('..\\') ||
    isAbsolute(localPath)
  ) {
    throw new Error(`OBJ material library is outside the model directory: ${library}`);
  }
  return path;
}
