import type { Rolldown } from 'vite';

import type {
  BundleEntries,
  BundleEntryOutputs,
  BundleOutput,
  EntryOutput,
  EntryRole,
} from '#types/bundle.js';
import type { ApplicationMode } from '#types/network.js';

const STYLESHEET_EXTENSION = '.css';

const standaloneEntryRoles = ['host', 'config', 'assets'] as const;
const entryRoles: readonly EntryRole[] = [...standaloneEntryRoles, 'application'];

/** Combines four role-specific Rolldown results into one HTML-facing description. */
export function createBundleOutput(
  outputs: BundleEntryOutputs,
  applicationMode: ApplicationMode,
): BundleOutput {
  const entries: BundleEntries = {
    host: requireEntryFile(outputs.host, 'host'),
    config: requireEntryFile(outputs.config, 'config'),
    assets: requireEntryFile(outputs.assets, 'assets'),
    application: requireEntryFile(outputs.application, 'application'),
  };

  validateBundleContract(outputs, entries, applicationMode);

  const emittedAssets = Object.values(outputs)
    .flat()
    .filter((chunkOrAsset) => chunkOrAsset.type === 'asset');
  const applicationChunks = outputs.application.filter(
    (chunkOrAsset) => chunkOrAsset.type === 'chunk' && !chunkOrAsset.isEntry,
  );

  return {
    entries,
    chunks: applicationChunks.map(({ fileName }) => fileName).sort(),
    stylesheets: collectAssetFiles(emittedAssets, true),
    resources: collectAssetFiles(emittedAssets, false),
  };
}

/** Enforces the entry isolation required by the runtime registration protocol. */
function validateBundleContract(
  outputs: BundleEntryOutputs,
  entries: BundleEntries,
  applicationMode: ApplicationMode,
): void {
  const entryFiles = Object.values(entries);

  if (new Set(entryFiles).size !== entryFiles.length) {
    throw new Error(`Playable entry filenames must be unique; received ${entryFiles.join(', ')}.`);
  }

  for (const role of standaloneEntryRoles) {
    assertStandaloneEntry(outputs[role], role);
  }

  if (applicationMode === 'single-module') {
    assertStandaloneEntry(outputs.application, 'application');
  }

  for (const role of entryRoles) {
    assertNoCrossEntryImports(outputs[role], role, entries);
  }
}

/** Requires a role configured without code splitting to emit exactly one chunk. */
function assertStandaloneEntry(output: EntryOutput, role: EntryRole): void {
  const chunks = output.filter((chunkOrAsset) => chunkOrAsset.type === 'chunk');

  if (chunks.length !== 1) {
    throw new Error(
      `Expected standalone ${role} entry to emit one chunk, received ${chunks.length}.`,
    );
  }
}

/** Rejects dependencies on another private entry while permitting application chunks. */
function assertNoCrossEntryImports(
  output: EntryOutput,
  role: EntryRole,
  entries: BundleEntries,
): void {
  const forbiddenEntryFiles = new Set(
    Object.entries(entries)
      .filter(([entryRole]) => entryRole !== role)
      .map(([, entryFile]) => entryFile),
  );

  for (const chunk of output) {
    if (chunk.type !== 'chunk') {
      continue;
    }

    const importedFiles = [...chunk.imports, ...chunk.dynamicImports];
    const forbiddenImport = importedFiles.find((file) => forbiddenEntryFiles.has(file));

    if (forbiddenImport !== undefined) {
      throw new Error(`Playable ${role} entry imports private entry ${forbiddenImport}.`);
    }
  }
}

/** Returns the one entry emitted by a role-specific build. */
function requireEntryFile(output: Rolldown.RolldownOutput['output'], role: string): string {
  const entryFiles = output
    .filter((chunkOrAsset) => chunkOrAsset.type === 'chunk' && chunkOrAsset.isEntry)
    .map(({ fileName }) => fileName);
  const entryFile = entryFiles[0];

  if (entryFile === undefined || entryFiles.length !== 1) {
    throw new Error(`Expected one ${role} entry, received ${entryFiles.length}.`);
  }

  return entryFile;
}

/** Collects unique stylesheet or non-stylesheet asset paths in stable order. */
function collectAssetFiles(
  assets: readonly Rolldown.OutputAsset[],
  stylesheets: boolean,
): string[] {
  return [
    ...new Set(
      assets
        .filter(({ fileName }) => fileName.endsWith(STYLESHEET_EXTENSION) === stylesheets)
        .map(({ fileName }) => fileName),
    ),
  ].sort();
}
