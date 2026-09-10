import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

import type { TestProject } from './test-project.js';

/** Writes the smallest practical authored project containing every asset category. */
export async function writeCompleteBuildFixture(project: TestProject): Promise<void> {
  const subsetFontEntry = fileURLToPath(import.meta.resolve('subset-font'));
  const fontFixture = resolve(dirname(subsetFontEntry), '../fontverter/testdata/Roboto-400.ttf');
  const png = await sharp({
    create: { background: '#336699', channels: 4, height: 2, width: 2 },
  })
    .png()
    .toBuffer();

  await Promise.all([
    project.write('assets/source/atlases/interface/button.png', png),
    project.write('assets/source/fonts/body.ttf', await readFile(fontFixture)),
    project.write(
      'assets/source/locales/translations.jsonc',
      '{ // Fixed-language dictionary\n "play": { "en": "Play" },\n}\n',
    ),
    project.write('assets/source/shaders/grayscale/vert.glsl', 'in vec2 position;'),
    project.write('assets/source/shaders/grayscale/frag.glsl', 'out vec4 color;'),
    project.write('assets/source/sounds/theme.wav', silentWav()),
    project.write(
      'assets/source/spines/hero/hero.json',
      '{"skeleton":{"spine":"4.2.00"},"bones":[{"name":"root"}]}',
    ),
    project.write('assets/source/spines/hero/hero.atlas', 'page.png\nsize: 1,1\n'),
    project.write('assets/source/spines/hero/page.png', png),
    project.write('assets/source/sprites/logo.png', png),
    project.write('assets/source/textures/noise.png', png),
  ]);
}

/** Creates a valid silent PCM WAV without storing an opaque binary test fixture. */
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
