import { describe, expect, it } from 'vitest';

import { selectSmallestOutput } from '#processors/output-selection.js';

import { createTestProject } from '../support/test-project.js';

describe('generated output selection', () => {
  it('keeps the first smallest candidate and deletes every rejected file', async () => {
    const project = await createTestProject();
    const webp = { path: project.path('hero.webp') };
    const avif = { path: project.path('hero.avif') };
    const png = { path: project.path('hero.png') };

    await Promise.all([
      project.write('hero.webp', 'larger'),
      project.write('hero.avif', 'tie'),
      project.write('hero.png', 'tie'),
    ]);

    await expect(selectSmallestOutput([webp, avif, png])).resolves.toBe(avif);
    await expect(project.readText('hero.avif')).resolves.toBe('tie');
    await expect(project.readBytes('hero.webp')).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(project.readBytes('hero.png')).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('rejects an empty candidate list', async () => {
    await expect(selectSmallestOutput([])).rejects.toThrow(
      'Cannot select an output from an empty candidate list.',
    );
  });
});
