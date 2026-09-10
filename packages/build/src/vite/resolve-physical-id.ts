import { normalizePath } from 'vite';

/** Removes Vite query metadata and normalizes a module ID for comparison. */
export function resolvePhysicalId(id: string): string {
  return normalizePath(id).split('?')[0] ?? id;
}
