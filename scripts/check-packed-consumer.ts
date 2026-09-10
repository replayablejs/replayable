import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Install unchanged release tarballs outside the workspace and compile imports of
 * every public entry point. Run after building, through `pnpm packages:check`.
 * This checks packaging and declaration consumption; browser behavior and actual
 * registry publication remain separate release checks.
 */
interface Manifest {
  name: string;
  version: string;
  private?: boolean;
  exports?: Record<string, unknown>;
  peerDependencies?: Record<string, string>;
}

const root = fileURLToPath(new URL('../', import.meta.url));
const pnpmPath = process.env.npm_execpath;
if (!pnpmPath) {
  throw new Error('Run through pnpm packages:check.');
}
const consumer = mkdtempSync(join(tmpdir(), 'replayable-packed-consumer-'));

function manifest(directory: string): Manifest {
  // These manifests belong to the checked-out repository or its installed dependencies.
  // eslint-disable-next-line typescript/no-unsafe-type-assertion
  return JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8')) as Manifest;
}

function pnpm(directory: string, ...args: string[]): void {
  execFileSync(process.execPath, [pnpmPath!, ...args], { cwd: directory, stdio: 'inherit' });
}

function json(name: string, value: unknown): void {
  writeFileSync(join(consumer, name), JSON.stringify(value, null, 2));
}

try {
  const dependencies: Record<string, string> = {};
  const overrides: Record<string, string> = {};
  const imports: string[] = [];

  for (const folder of readdirSync(join(root, 'packages')).sort()) {
    const directory = join(root, 'packages', folder);
    const pkg = manifest(directory);
    if (pkg.private) {
      continue;
    }

    pnpm(directory, 'pack', '--pack-destination', consumer);
    const filename = `${pkg.name.replace('@', '').replace('/', '-')}-${pkg.version}.tgz`;
    dependencies[pkg.name] = `file:./${filename}`;
    // Unpublished internal versions must resolve to these same original tarballs.
    // Overrides exist only in the disposable consumer, never in packed manifests.
    overrides[pkg.name] = `file:./${filename}`;

    for (const peer of Object.keys(pkg.peerDependencies ?? {})) {
      if (!peer.startsWith('@replayablejs/')) {
        dependencies[peer] = manifest(join(directory, 'node_modules', peer)).version;
      }
    }
    for (const entry of Object.keys(pkg.exports ?? {})) {
      const specifier = entry === '.' ? pkg.name : pkg.name + entry.slice(1);
      const alias = `Entry${imports.length}`;
      imports.push(
        `import * as ${alias} from '${specifier}';\nexport type ${alias}Type = typeof ${alias};`,
      );
    }
  }

  for (const tool of ['typescript', '@types/node']) {
    dependencies[tool] = manifest(join(root, 'node_modules', tool)).version;
  }
  json('package.json', { private: true, type: 'module', dependencies, pnpm: { overrides } });
  // Reuse the repository's reviewed native-install allowlist, including Windows
  // and Linux packages. Disable implicit peer installation just like the repo.
  const workspace = readFileSync(join(root, 'pnpm-workspace.yaml'), 'utf8');
  const allowlist = workspace.slice(workspace.indexOf('onlyBuiltDependencies:'));
  if (!allowlist.startsWith('onlyBuiltDependencies:')) {
    throw new Error('Missing install allowlist.');
  }
  writeFileSync(join(consumer, 'pnpm-workspace.yaml'), `autoInstallPeers: false\n${allowlist}`);
  writeFileSync(join(consumer, 'entries.ts'), imports.join('\n'));
  json('tsconfig.json', {
    compilerOptions: {
      strict: true,
      skipLibCheck: true,
      noEmit: true,
      target: 'ES2024',
      lib: ['ES2024', 'DOM', 'DOM.Iterable'],
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      types: ['node'],
    },
    files: ['entries.ts'],
  });

  pnpm(consumer, 'install', '--no-frozen-lockfile');
  pnpm(consumer, 'exec', 'tsc', '--project', 'tsconfig.json');
  pnpm(
    consumer,
    'exec',
    'tsc',
    '--project',
    'tsconfig.json',
    '--module',
    'ESNext',
    '--moduleResolution',
    'Bundler',
  );
  pnpm(consumer, 'exec', 'replayable', '--help');
  console.log(
    `Packed consumer passed: ${Object.keys(overrides).length} packages, ${imports.length} public entries.`,
  );
  rmSync(consumer, { recursive: true, force: true });
} catch (error) {
  console.error(`Failed consumer retained for inspection: ${resolve(consumer)}`);
  throw error;
}
