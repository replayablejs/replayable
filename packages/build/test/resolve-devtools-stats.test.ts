import { basename } from 'node:path';

import type { PlayableVariant } from '@replayablejs/config';
import { expect, it } from 'vitest';

import {
  resolveDevtoolsStats,
  resolveWebglStats,
  resolveEndCardTrigger,
} from '../src/runtime/resolve-devtools.js';

it.each([
  ['serve', true, 'enabled.js'],
  ['serve', false, 'disabled.js'],
  ['build', true, 'disabled.js'],
  ['build', false, 'disabled.js'],
] as const)('selects the endcard trigger for %s / %s', (command, enabled, entry) => {
  expect(basename(resolveEndCardTrigger(command, enabled))).toBe(entry);
});

const enabled: Exclude<PlayableVariant['devtools']['stats'], false> = {
  display: 'expanded',
  fps: true,
  frameInterval: true,
  jsHeap: true,
  drawCalls: true,
  textureBinds: true,
  programUses: true,
};

it.each([
  { command: 'build' as const, stats: enabled, entry: 'disabled.js' },
  { command: 'build' as const, stats: false as const, entry: 'disabled.js' },
  { command: 'serve' as const, stats: enabled, entry: 'enabled.js' },
  { command: 'serve' as const, stats: false as const, entry: 'disabled.js' },
  {
    command: 'serve' as const,
    stats: {
      ...enabled,
      fps: false,
      frameInterval: false,
      jsHeap: false,
      drawCalls: false,
      textureBinds: false,
      programUses: false,
    },
    entry: 'disabled.js',
  },
  {
    command: 'serve' as const,
    stats: { ...enabled, fps: false, frameInterval: false },
    entry: 'enabled.js',
  },
])('selects $entry for $command with $stats', ({ command, stats, entry }) => {
  expect(basename(resolveDevtoolsStats(command, stats))).toBe(entry);
});

it.each([
  { command: 'build' as const, stats: enabled, entry: 'disabled.js' },
  { command: 'serve' as const, stats: false as const, entry: 'disabled.js' },
  {
    command: 'serve' as const,
    stats: { ...enabled, drawCalls: false, textureBinds: false, programUses: false },
    entry: 'disabled.js',
  },
  { command: 'serve' as const, stats: enabled, entry: 'enabled.js' },
])('selects WebGL $entry for $command with $stats', ({ command, stats, entry }) => {
  expect(basename(resolveWebglStats(command, stats))).toBe(entry);
});
