import { describe, expect, it } from 'vitest';

import { parsePixiAtlasLayout } from '#adapters/pixi-atlas-parser.js';
import { collectPackedAtlasSheets } from '#adapters/texture-packer.js';

describe('atlas adapters', () => {
  it('normalizes complete multi-sheet packer output in stable order', () => {
    const sheets = collectPackedAtlasSheets(
      [
        packedFile('ui-1.png'),
        packedFile('ui-0.json'),
        packedFile('ui-0.png'),
        packedFile('ui-1.json'),
      ],
      'ui',
    );

    expect(sheets.map((sheet) => sheet.name)).toEqual(['ui-0', 'ui-1']);
    expect(sheets[0]?.json.name).toBe('ui-0.json');
    expect(sheets[0]?.png.name).toBe('ui-0.png');
  });

  it('extracts frame names from both supported Pixi layouts', () => {
    const objectLayout = parsePixiAtlasLayout(
      Buffer.from(
        JSON.stringify({
          frames: { button: { rotated: false }, icon: { rotated: true } },
          meta: { image: 'ui.png' },
        }),
      ),
    );
    const arrayLayout = parsePixiAtlasLayout(
      Buffer.from(JSON.stringify({ frames: [{ filename: 'button' }, { filename: 'icon' }] })),
    );

    expect(objectLayout.frameNames).toEqual(['button', 'icon']);
    expect(JSON.parse(objectLayout.serializedJson)).toEqual({
      frames: { button: { rotated: false }, icon: { rotated: true } },
      meta: { image: 'ui.png' },
    });
    expect(arrayLayout.frameNames).toEqual(['button', 'icon']);
  });
});

function packedFile(name: string): { readonly buffer: Buffer; readonly name: string } {
  return { buffer: Buffer.alloc(0), name };
}
