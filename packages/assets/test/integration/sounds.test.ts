import { describe, expect, it } from 'vitest';

import { buildAssets } from '../../src/index.js';
import { config } from '../support/config.js';
import { createTestProject } from '../support/test-project.js';

describe('sounds', () => {
  it('keeps the smallest automatic candidate with default encoding options', async () => {
    const project = await createTestProject();
    await Promise.all([
      project.write('assets/source/sounds/click.wav', silentWav()),
      project.write('assets/source/sounds/README.md', 'Ignored beside broad sound rules.'),
    ]);

    const result = await buildAssets(
      config({
        assets: {
          sounds: [{}],
        },
      }),
      project.root,
    );
    const files = await project.entries('assets/generated/sounds');
    const generated = await project.readText('src/assets/assets.gen.ts');

    expect(result.emittedAssets).toBe(1);
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/^click\.(?:m4a|mp3)$/);
    expect(generated).toMatch(/sounds: \{\n      "click": sound_\d+,\n    \},/);
  });
});

function silentWav(): Buffer {
  const dataLength = 800;
  const buffer = Buffer.alloc(44 + dataLength);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write('WAVEfmt ', 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(8000, 24);
  buffer.writeUInt32LE(8000, 28);
  buffer.writeUInt16LE(1, 32);
  buffer.writeUInt16LE(8, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);
  buffer.fill(128, 44);
  return buffer;
}
