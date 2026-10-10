import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

const timeoutMs = 5 * 60_000;
const retryMs = 10_000;

/** Read npm's package index, as installers do, rather than trusting publication completion. */
export async function checkPackage(
  name: string,
  version: string,
  remainingMs: number,
  request: typeof fetch = fetch,
): Promise<string | undefined> {
  try {
    const response = await request(`https://registry.npmjs.org/${encodeURIComponent(name)}`, {
      headers: { Accept: 'application/vnd.npm.install-v1+json', 'Cache-Control': 'no-cache' },
      signal: AbortSignal.timeout(Math.max(1, Math.min(10_000, remainingMs))),
    });
    if (!response.ok) {
      return `npm returned HTTP ${response.status}`;
    }
    const data: unknown = await response.json();
    if (typeof data !== 'object' || data === null || !('versions' in data)) {
      return 'npm returned invalid package metadata';
    }
    const versions = data.versions;
    if (typeof versions !== 'object' || versions === null || !Object.hasOwn(versions, version)) {
      return 'version is not available yet';
    }
    return undefined;
  } catch (error) {
    return error instanceof Error ? error.message : 'npm request failed';
  }
}

type Polling = {
  check: typeof checkPackage;
  now: () => number;
  pause: (milliseconds: number) => Promise<void>;
  log: (message: string) => void;
};

/** Wait for every release package, including transitive dependencies, with a five-minute deadline. */
export async function waitForRelease(
  packages: string[],
  version: string,
  polling: Polling = { check: checkPackage, now: Date.now, pause: setTimeout, log: console.log },
): Promise<void> {
  if (!packages.length || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error('Provide release packages and an exact Replayable version.');
  }
  const deadline = polling.now() + timeoutMs;
  let pending = [...new Set(packages)];

  while (pending.length) {
    const results = await Promise.all(
      pending.map(async (name) => ({
        name,
        reason: await polling.check(name, version, deadline - polling.now()),
      })),
    );
    const missing = results.filter((result) => result.reason !== undefined);
    if (!missing.length) {
      polling.log(`All Replayable packages at ${version} are available on npm.`);
      return;
    }
    const details = missing.map(({ name, reason }) => `${name}@${version}: ${reason}`).join('\n');
    const remaining = deadline - polling.now();
    if (remaining <= 0) {
      throw new Error(`Timed out waiting for Replayable publication after 5 minutes:\n${details}`);
    }
    polling.log(`Waiting for npm publication:\n${details}`);
    pending = missing.map(({ name }) => name);
    await polling.pause(Math.min(retryMs, remaining));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const version = process.argv[2] ?? '';
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../packages');
  const packages: string[] = [];
  for (const directory of await readdir(root, { withFileTypes: true })) {
    if (!directory.isDirectory()) {
      continue;
    }
    const manifest: { name: string; private?: boolean } = JSON.parse(
      await readFile(join(root, directory.name, 'package.json'), 'utf8'),
    );
    if (!manifest.private) {
      packages.push(manifest.name);
    }
  }
  await waitForRelease(packages, version);
}
