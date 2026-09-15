import { readFileSync } from 'node:fs';

/** The fixed release group's version, shared by docs and install instructions. */
export const replayableVersion: string = JSON.parse(
  readFileSync(new URL('../../packages/runtime/package.json', import.meta.url), 'utf8'),
).version;
