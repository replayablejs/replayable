import assert from 'node:assert/strict';
import test from 'node:test';

import { checkPackage, waitForRelease } from './wait-for-replayable-release.ts';

const version = '0.1.0-alpha.14';

await test('checks the exact version, not dist-tags or another published version', async () => {
  const available = await checkPackage('@replayablejs/config', version, 1000, async (url) => {
    assert.equal(url, 'https://registry.npmjs.org/%40replayablejs%2Fconfig');
    return Response.json({ versions: { [version]: {} } });
  });
  assert.equal(available, undefined);
  const missing = await checkPackage('@replayablejs/config', version, 1000, async () =>
    Response.json({ versions: { '0.1.0-alpha.13': {} }, 'dist-tags': { latest: version } }),
  );
  assert.equal(missing, 'version is not available yet');
});

await test('reports registry HTTP, malformed metadata, and network failures for retry', async () => {
  assert.equal(
    await checkPackage('package', version, 1000, async () => new Response('', { status: 503 })),
    'npm returned HTTP 503',
  );
  assert.equal(
    await checkPackage('package', version, 1000, async () => Response.json(null)),
    'npm returned invalid package metadata',
  );
  assert.equal(
    await checkPackage('package', version, 1000, async () => {
      throw new Error('connection reset');
    }),
    'connection reset',
  );
});

await test('waits for late packages and does not poll already available packages again', async () => {
  let now = 0;
  const calls: string[] = [];
  const pauses: number[] = [];
  await waitForRelease(['runtime', 'config', 'runtime'], version, {
    now: () => now,
    log: () => {},
    pause: async (milliseconds) => {
      pauses.push(milliseconds);
      now += milliseconds;
    },
    check: async (name) => {
      calls.push(name);
      return name === 'config' && now < 20_000 ? 'not published yet' : undefined;
    },
  });
  assert.deepEqual(calls, ['runtime', 'config', 'config', 'config']);
  assert.deepEqual(pauses, [10_000, 10_000]);
});

await test('fails after five minutes and identifies only the packages still unavailable', async () => {
  let now = 0;
  await assert.rejects(
    waitForRelease(['runtime', 'config'], version, {
      now: () => now,
      log: () => {},
      pause: async (milliseconds) => {
        now += milliseconds;
      },
      check: async (name) => (name === 'config' ? 'npm returned HTTP 503' : undefined),
    }),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /Timed out.*5 minutes/);
      assert.match(error.message, /config@0\.1\.0-alpha\.14: npm returned HTTP 503/);
      assert.doesNotMatch(error.message, /runtime/);
      return true;
    },
  );
  assert.equal(now, 300_000);
});

await test('rejects missing packages or a non-exact release version', async () => {
  await assert.rejects(waitForRelease([], version), /exact Replayable version/);
  await assert.rejects(waitForRelease(['config'], 'latest'), /exact Replayable version/);
});
