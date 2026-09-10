import { spawnSync } from 'node:child_process';
import { copyFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// CI has already built and exported these examples. Publish only standalone
// preview HTML, never network delivery archives or package tarballs.
const root = fileURLToPath(new URL('../', import.meta.url));
const demos = join(root, 'docs/public/demos');
await rm(demos, { recursive: true, force: true });
await mkdir(demos, { recursive: true });
for (const example of ['basic-playable', 'basic-pixi-playable']) {
  await copyFile(
    join(root, 'examples', example, 'exports/preview_default_en.html'),
    join(demos, `${example}.html`),
  );
}

// The project Pages URL is https://replayablejs.github.io/replayable/.
// Keep ordinary docs development at /; only the Pages build uses this prefix.
const result = spawnSync('pnpm', ['--filter', '@replayablejs/docs', 'build'], {
  cwd: root,
  env: { ...process.env, DOCS_BASE: '/replayable/' },
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
if (result.error) {
  throw result.error;
}
process.exitCode = result.status ?? 1;
