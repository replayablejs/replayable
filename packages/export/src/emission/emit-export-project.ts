import type { PreparedExportArtifact } from '#types/artifact.js';
import type { ExportProjectContext } from '#types/context.js';
import type { ExportProjectResult, ExportVariantResult } from '#types/export.js';

import { writeExportArtifacts } from './write-export-artifacts.js';

/** Writes prepared artifacts safely, then reports their committed destinations. */
export async function emitExportProject(
  project: ExportProjectContext,
  artifacts: readonly PreparedExportArtifact[],
): Promise<ExportProjectResult> {
  await writeExportArtifacts(project.outputDirectory, artifacts);

  return {
    outputDirectory: project.outputDirectory,
    variants: artifacts.map(describeExportArtifact),
  };
}

/** Reports the committed artifact's final path and byte size. */
function describeExportArtifact(artifact: PreparedExportArtifact): ExportVariantResult {
  const { content, outputFile, variantId } = artifact;

  return {
    file: outputFile,
    size: measureArtifact(content),
    variantId,
  };
}

/** Measures text and binary artifacts in the bytes reported by the filesystem. */
function measureArtifact(content: string | Uint8Array): number {
  return typeof content === 'string' ? Buffer.byteLength(content) : content.byteLength;
}
