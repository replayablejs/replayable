import type { RegistryObject } from '#types/emission.js';

/** Creates a deterministic `{ value: value }` lookup table. */
export function createIdentityRegistry(values: Iterable<string>): RegistryObject {
  const uniqueValues = [...new Set(values)].sort((left, right) => left.localeCompare(right));

  return Object.fromEntries(uniqueValues.map((value) => [value, value]));
}
