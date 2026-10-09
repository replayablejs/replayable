import assert from 'node:assert/strict';
import test from 'node:test';

import { updateDependencies } from './update-playable-dependencies.ts';

await test('updates all existing Replayable packages while preserving sections and unrelated dependencies', () => {
  const original = {
    dependencies: { '@replayablejs/runtime': '0.1.0-alpha.12', 'pixi.js': '8.21.0' },
    devDependencies: { '@replayablejs/cli': '^0.1.0-alpha.12' },
    optionalDependencies: { '@replayablejs/tween': '0.1.0-alpha.12' },
    scripts: { build: 'replayable build' },
  };
  const updated = updateDependencies(original, '0.1.0-alpha.13');
  assert.equal(updated.dependencies['@replayablejs/runtime'], '0.1.0-alpha.13');
  assert.equal(updated.devDependencies['@replayablejs/cli'], '0.1.0-alpha.13');
  assert.equal(updated.optionalDependencies['@replayablejs/tween'], '0.1.0-alpha.13');
  assert.equal(updated.dependencies['pixi.js'], '8.21.0');
  assert.deepEqual(updated.scripts, original.scripts);
  assert.equal(original.dependencies['@replayablejs/runtime'], '0.1.0-alpha.12');
  assert.deepEqual(updateDependencies(updated, '0.1.0-alpha.13'), updated);
});

await test('rejects non-release inputs and unsupported dependency sources before writing', () => {
  for (const version of ['latest', 'next', '^1.0.0', '1.0.0\nmalicious']) {
    assert.throws(() => updateDependencies({}, version), /exact release/);
  }
  for (const source of ['catalog:', 'workspace:*', 'file:local.tgz', 'link:..']) {
    assert.throws(
      () => updateDependencies({ dependencies: { '@replayablejs/cli': source } }, '1.0.0'),
      /registry version/,
    );
  }
  assert.throws(
    () => updateDependencies({ dependencies: { other: '1.0.0' } }, '1.0.0'),
    /No Replayable/,
  );
});
