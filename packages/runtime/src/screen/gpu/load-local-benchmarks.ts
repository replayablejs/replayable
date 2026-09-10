import type { ModelEntry, ModelEntryScreen } from '@pmndrs/detect-gpu';

import adrenoData from './benchmarks/m-adreno.json' with { type: 'json' };
import appleIpadData from './benchmarks/m-apple-ipad.json' with { type: 'json' };
import appleData from './benchmarks/m-apple.json' with { type: 'json' };
import intelData from './benchmarks/m-intel.json' with { type: 'json' };
import maliTData from './benchmarks/m-mali-t.json' with { type: 'json' };
import maliData from './benchmarks/m-mali.json' with { type: 'json' };
import nvidiaData from './benchmarks/m-nvidia.json' with { type: 'json' };
import powervrData from './benchmarks/m-powervr.json' with { type: 'json' };
import samsungData from './benchmarks/m-samsung.json' with { type: 'json' };

const BENCHMARK_FORMAT_VERSION = '6';

/**
 * Static imports keep every supported mobile dataset inside Replayable's JavaScript bundle.
 * `getGPUTier` supplies one of these exact filenames according to the detected renderer.
 */
const benchmarkDataByFilename = {
  'm-adreno.json': adrenoData,
  'm-apple-ipad.json': appleIpadData,
  'm-apple.json': appleData,
  'm-intel.json': intelData,
  'm-mali-t.json': maliTData,
  'm-mali.json': maliData,
  'm-nvidia.json': nvidiaData,
  'm-powervr.json': powervrData,
  'm-samsung.json': samsungData,
};

/** Loads one bundled benchmark dataset without fetch, URLs, or authored assets. */
export function loadLocalBenchmarks(filename: string): Promise<ModelEntry[]> {
  if (!isBenchmarkFilename(filename)) {
    return Promise.reject(new Error(`Unsupported mobile GPU benchmark file: ${filename}`));
  }

  return Promise.resolve(parseBenchmarkData(filename, benchmarkDataByFilename[filename]));
}

/** Removes the dataset marker after confirming its version and entry structure. */
export function parseBenchmarkData(filename: string, data: readonly unknown[]): ModelEntry[] {
  const [formatVersion, ...entries] = data;

  if (formatVersion !== BENCHMARK_FORMAT_VERSION) {
    throw new Error(
      `Unsupported benchmark format in ${filename}: expected ${BENCHMARK_FORMAT_VERSION}.`,
    );
  }

  const modelEntries: ModelEntry[] = [];

  for (const entry of entries) {
    if (!isModelEntry(entry)) {
      throw new Error(`Malformed mobile GPU benchmark entry in ${filename}.`);
    }

    modelEntries.push(entry);
  }

  return modelEntries;
}

/** Narrows detector-provided strings before indexing the closed dataset map. */
function isBenchmarkFilename(filename: string): filename is keyof typeof benchmarkDataByFilename {
  // Network test environments may lack Object.hasOwn, even with modern targets.
  return Object.prototype.hasOwnProperty.call(benchmarkDataByFilename, filename);
}

/** Validates the tuple format consumed by `@pmndrs/detect-gpu`. */
function isModelEntry(value: unknown): value is ModelEntry {
  return (
    Array.isArray(value) &&
    value.length === 5 &&
    typeof value[0] === 'string' &&
    typeof value[1] === 'string' &&
    typeof value[2] === 'string' &&
    (value[3] === 0 || value[3] === 1) &&
    Array.isArray(value[4]) &&
    value[4].every(isModelEntryScreen)
  );
}

/** Validates one benchmark measurement tuple, whose device label may be omitted. */
function isModelEntryScreen(value: unknown): value is ModelEntryScreen {
  return (
    Array.isArray(value) &&
    (value.length === 3 || value.length === 4) &&
    typeof value[0] === 'number' &&
    typeof value[1] === 'number' &&
    typeof value[2] === 'number' &&
    (value[3] === undefined || typeof value[3] === 'string')
  );
}
