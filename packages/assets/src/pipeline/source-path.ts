import { extname } from 'node:path/posix';

/** Removes only the final extension from a source-relative POSIX path. */
export function removeExtension(path: string): string {
  const extension = extname(path);
  return extension === '' ? path : path.slice(0, -extension.length);
}
