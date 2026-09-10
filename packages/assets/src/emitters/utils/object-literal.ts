import type { RegistryObject } from '#types/emission.js';

/** JSON quoting escapes text; a computed key also avoids JavaScript's prototype setter. */
export function renderPropertyKey(key: string): string {
  const quoted = JSON.stringify(key);
  return key === '__proto__' ? `[${quoted}]` : quoted;
}

/**
 * Renders the registry's string/object-only shape as a typed JavaScript literal.
 * JSON is not interchangeable with an object literal: `"__proto__": value`
 * changes prototype semantics when parsed as JavaScript, including nested keys.
 * Strings still use JSON.stringify; only object framing and keys are emitted here.
 */
export function renderRegistryObject(registry: RegistryObject, depth = 0): string {
  const entries = Object.entries(registry);
  if (entries.length === 0) {
    return '{}';
  }
  const indent = '  '.repeat(depth + 1);
  const lines = entries.map(([key, value]) => {
    const source =
      typeof value === 'string' ? JSON.stringify(value) : renderRegistryObject(value, depth + 1);
    return `${indent}${renderPropertyKey(key)}: ${source}`;
  });
  return `{\n${lines.join(',\n')}\n${'  '.repeat(depth)}}`;
}
