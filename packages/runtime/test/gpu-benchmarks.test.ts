import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  loadLocalBenchmarks,
  parseBenchmarkData,
} from '../src/screen/gpu/load-local-benchmarks.js';

const MOBILE_BENCHMARK_FILES = [
  'm-adreno.json',
  'm-apple-ipad.json',
  'm-apple.json',
  'm-intel.json',
  'm-mali-t.json',
  'm-mali.json',
  'm-nvidia.json',
  'm-powervr.json',
  'm-samsung.json',
];

describe('local GPU benchmarks', () => {
  const originalHasOwn = Object.hasOwn;

  // Run dataset lookup without the API missing from Mintegral's test engine.
  beforeEach(() => {
    Object.defineProperty(Object, 'hasOwn', { value: undefined });
  });

  afterEach(() => {
    Object.defineProperty(Object, 'hasOwn', { value: originalHasOwn });
  });

  it.each(MOBILE_BENCHMARK_FILES)('loads %s without its format marker', async (filename) => {
    const entries = await loadLocalBenchmarks(filename);

    expect(entries.length).toBeGreaterThan(0);
    expect(entries[0]).toHaveLength(5);
  });

  it.each(['d-intel.json', 'constructor', 'toString', '__proto__'])(
    'rejects unsupported or inherited filename %s',
    async (filename) => {
      await expect(loadLocalBenchmarks(filename)).rejects.toThrow(
        `Unsupported mobile GPU benchmark file: ${filename}`,
      );
    },
  );

  it('rejects an unexpected benchmark format marker', () => {
    expect(() => parseBenchmarkData('m-example.json', ['5'])).toThrow(
      'Unsupported benchmark format in m-example.json: expected 6.',
    );
  });

  it('rejects malformed benchmark entries', () => {
    expect(() => parseBenchmarkData('m-example.json', ['6', ['invalid']])).toThrow(
      'Malformed mobile GPU benchmark entry in m-example.json.',
    );
  });
});
