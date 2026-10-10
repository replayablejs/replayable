import type { z } from 'zod';

import type { ReplayableConfig, ReplayableConfigInput } from '#types/config.js';

import { defineConfig } from './define-config.js';
import { projectDataSchema, type projectVersionSchema } from './schemas/project-data-schema.js';

export type ReplayableProjectData = z.input<typeof projectDataSchema>;

type ProjectVersion = z.output<typeof projectVersionSchema>;
type ProjectVersions = Record<string, ProjectVersion>;

/**
 * Apply replayable.project.json values to developer configuration.
 * Version/network expansion and temporary preview overrides happen afterward.
 */
export function applyProjectData(
  input: ReplayableConfigInput,
  data: ReplayableProjectData,
): ReplayableConfig {
  const config = defineConfig(input);
  const saved = projectDataSchema.parse(data);

  // Validate saved parameter values against the developer-authored definitions.
  return defineConfig({
    ...config,
    versions: mergeVersions(config.versions, saved.versions),
    controls: { ...config.controls, ...saved.controls },
    devtools: { ...config.devtools, ...saved.devtools },
  });
}

/** Update matching versions and add new ones, retaining versions absent from saved data. */
function mergeVersions(original: ProjectVersions, saved: ProjectVersions = {}): ProjectVersions {
  const versions = new Map(Object.entries(original));

  for (const [name, changes] of Object.entries(saved)) {
    versions.set(name, mergeVersion(versions.get(name), changes));
  }

  return Object.fromEntries(versions);
}

/** Preserve omitted fields; merge parameter values and completion timers by name. */
function mergeVersion(original: ProjectVersion = {}, saved: ProjectVersion): ProjectVersion {
  const version = {
    ...original,
    ...saved,
    params: { ...original.params, ...saved.params },
    completion: { ...original.completion, ...saved.completion },
  };

  // Replace supplied exclusion arrays or bundle selections as a whole.
  if (saved.assets !== undefined) {
    version.assets = { ...original.assets, ...saved.assets };
  }

  return version;
}
