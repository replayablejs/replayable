/** Reports whether a filesystem operation failed because its target path is absent. */
export function isMissingPathError(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}
