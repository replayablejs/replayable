import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

type PackageManifest = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
};

/** Update only published Replayable dependencies, preserving their manifest sections. */
export function updateDependencies<T extends PackageManifest>(manifest: T, version: string): T {
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error('Provide an exact release version, such as 0.1.0-alpha.13.');
  }
  const updated = structuredClone(manifest);
  let count = 0;
  for (const section of ['dependencies', 'devDependencies', 'optionalDependencies'] as const) {
    const dependencies = updated[section];
    if (!dependencies) {
      continue;
    }
    for (const [name, current] of Object.entries(dependencies)) {
      if (!name.startsWith('@replayablejs/')) {
        continue;
      }
      if (typeof current !== 'string' || /^(?:catalog|workspace|file|link):/.test(current)) {
        throw new Error(`${name} must use a registry version; refusing to replace ${current}.`);
      }
      dependencies[name] = version;
      count++;
    }
  }
  if (count === 0) {
    throw new Error('No Replayable dependencies found.');
  }
  return updated;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [file, version] = process.argv.slice(2);
  if (!file || !version) {
    throw new Error('Usage: update-playable-dependencies.ts <package.json> <version>');
  }
  const source = await readFile(file, 'utf8');
  const manifest: PackageManifest = JSON.parse(source);
  const updated = updateDependencies(manifest, version);
  await writeFile(file, `${JSON.stringify(updated, null, 2)}\n`);
}
