import type { ReplayableConfigInput } from '@replayablejs/config';

import { emitExportProject } from '#emission/emit-export-project.js';
import { prepareExportProject } from '#preparation/prepare-export-project.js';
import { resolveExportProject } from '#resolution/resolve-export-project.js';
import type { ExportProjectOptions, ExportProjectResult } from '#types/export.js';

/**
 * Produces every upload-ready artifact from an existing Replayable project build.
 *
 * Resolution verifies the builds and assigns destinations. Preparation creates
 * every artifact in memory. Emission replaces the previous export directory only
 * after all preparation succeeds, preserving the last successful export on error.
 */
export async function exportProject(
  config: ReplayableConfigInput,
  options: ExportProjectOptions,
): Promise<ExportProjectResult> {
  const project = await resolveExportProject(config, options);
  const artifacts = await prepareExportProject(project);

  return emitExportProject(project, artifacts);
}
