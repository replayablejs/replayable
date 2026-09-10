import { describe, expect, it } from 'vitest';

import { createBuildContext } from '#pipeline/context.js';
import { createBuildStaging } from '#pipeline/create-build-staging.js';

import { config } from '../support/config.js';
import { createTestProject } from '../support/test-project.js';

describe('asset publication', () => {
  it('restores every prior output when installing a later module fails', async () => {
    const project = await createTestProject();
    await project.directory('assets/source');
    const context = createBuildContext(config(), project.root);
    await project.write('assets/generated/old.txt', 'old assets');
    await project.write(context.assetsFile, 'old module');
    const staging = await createBuildStaging(context, project.root);

    try {
      await project.write(`${staging.context.outputRoot}/new.txt`, 'new assets');
      // Deliberately omit the prepared module: installing it fails after the
      // processed directory was replaced and the previous module was backed up.
      await expect(staging.commit()).rejects.toMatchObject({ code: 'ENOENT' });
      expect(await project.readText('assets/generated/old.txt')).toBe('old assets');
      expect(await project.readText(context.assetsFile)).toBe('old module');
      await expect(project.readText('assets/generated/new.txt')).rejects.toMatchObject({
        code: 'ENOENT',
      });
    } finally {
      await staging.dispose();
    }
    expect(
      (await project.entries('.')).some((name) => name.startsWith('.replayable-assets-')),
    ).toBe(false);
  });
});
