import { readdir, readFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../src');

describe('architecture', () => {
  it('preserves internal dependency boundaries', async () => {
    const files = await sourceFiles(sourceRoot);
    const violations: string[] = [];

    for (const file of files) {
      const path = relative(sourceRoot, file).split('\\').join('/');
      const source = await readFile(file, 'utf8');
      const forbidden = forbiddenLayers(path);

      if (!path.startsWith('types/') && /^(?:export )?(?:interface|type) \w+/m.test(source)) {
        violations.push(`${path} declares a named type outside types`);
      }

      for (const layer of forbidden) {
        if (source.includes(`/${layer}/`) || source.includes(`#${layer}/`)) {
          violations.push(`${path} imports ${layer}`);
        }
      }

      if (path.startsWith('types/') && hasRuntimeConfigImport(source)) {
        violations.push(`${path} imports config at runtime`);
      }
    }

    expect(violations).toEqual([]);
  });
});

function forbiddenLayers(path: string): readonly string[] {
  if (path === 'index.ts') {
    return ['emitters', 'pipeline', 'processors', 'resolvers'];
  }
  if (path.startsWith('adapters/')) {
    return ['emitters', 'pipeline', 'processors', 'resolvers'];
  }
  if (path.startsWith('config/')) {
    return ['emitters', 'pipeline', 'processors', 'resolvers'];
  }
  if (path.startsWith('pipeline/')) {
    return ['emitters', 'processors', 'resolvers'];
  }
  if (path.startsWith('resolvers/')) {
    return ['emitters', 'processors'];
  }
  if (path.startsWith('processors/')) {
    return ['emitters', 'resolvers'];
  }
  if (path.startsWith('emitters/')) {
    return ['processors', 'resolvers'];
  }
  if (path.startsWith('types/')) {
    // Shared types may derive their shapes through type-only imports of Zod
    // schemas. Runtime config imports remain forbidden and are checked above.
    return ['emitters', 'pipeline', 'processors', 'resolvers'];
  }
  return [];
}

/** Detects config imports that survive TypeScript compilation. */
function hasRuntimeConfigImport(source: string): boolean {
  const imports = source.matchAll(/import\s+(type\s+)?[\s\S]*?\sfrom\s+['"]([^'"]+)['"]/g);

  for (const [, typeOnly, specifier] of imports) {
    const importsConfig = specifier?.includes('/config/') || specifier?.startsWith('#config/');

    if (typeOnly === undefined && importsConfig) {
      return true;
    }
  }

  return false;
}

async function sourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) {
        return sourceFiles(path);
      }
      return entry.isFile() && entry.name.endsWith('.ts') ? [path] : [];
    }),
  );
  return files.flat();
}
