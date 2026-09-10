import { describe, expect, it } from 'vitest';

import { discoverSourceFiles } from '#pipeline/discover-source-files.js';

import { createTestProject } from '../support/test-project.js';

describe('source file discovery', () => {
  it('returns an empty inventory for an empty source directory', async () => {
    const project = await createTestProject();

    await expect(discoverSourceFiles(project.root)).resolves.toEqual([]);
  });

  it('returns sorted regular files, including dotfiles but not symbolic links', async () => {
    const project = await createTestProject();
    const linkedProject = await createTestProject('replayable-assets-linked-');

    await Promise.all([
      project.write('nested/a.txt', 'a'),
      project.write('z.txt', 'z'),
      project.write('.metadata', 'metadata'),
      linkedProject.write('linked.txt', 'linked'),
    ]);
    await project.link(linkedProject.root, 'linked');

    const files = await discoverSourceFiles(project.root);

    expect(files).toEqual([
      {
        absolutePath: project.path('.metadata'),
        relativePath: '.metadata',
      },
      {
        absolutePath: project.path('nested/a.txt'),
        relativePath: 'nested/a.txt',
      },
      {
        absolutePath: project.path('z.txt'),
        relativePath: 'z.txt',
      },
    ]);
  });
});
