import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const check = process.argv.includes('--check');
const runtime = JSON.parse(readFileSync(new URL('packages/runtime/package.json', root), 'utf8'));
const version: string = runtime.version;
let stale = false;

/** Check or update only generated references; never touch historical release notes. */
function synchronize(path: string, update: (source: string) => string): void {
  const file = new URL(path, root);
  const source = readFileSync(file, 'utf8');
  const expected = update(source);
  if (source === expected) {
    return;
  }
  if (check) {
    console.error(`${path} is out of sync. Run pnpm versions:sync.`);
    stale = true;
  } else {
    writeFileSync(file, expected);
    console.log(`Updated ${path} to ${version}.`);
  }
}

synchronize('README.md', (source) => {
  const section = /<!-- replayable-version:start -->[\s\S]*?<!-- replayable-version:end -->/;
  if (!section.test(source)) {
    throw new Error('README release-version markers are missing.');
  }
  return source.replace(section, (text) => text.replace(/\b\d+\.\d+\.\d+(?:-[\w.-]+)?/g, version));
});

synchronize('skills/build-playable-ad/assets/starter/package.json', (source) => {
  const manifest = JSON.parse(source);
  for (const section of ['dependencies', 'devDependencies']) {
    for (const name of Object.keys(manifest[section] ?? {})) {
      if (name.startsWith('@replayablejs/')) {
        manifest[section][name] = version;
      }
    }
  }
  return `${JSON.stringify(manifest, null, 2)}\n`;
});

if (stale) {
  process.exitCode = 1;
}
