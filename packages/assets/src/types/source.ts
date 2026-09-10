/** One regular file discovered beneath the configured source directory. */
export interface SourceFile {
  /** Absolute path used for filesystem reads. */
  readonly absolutePath: string;
  /** POSIX path relative to sourceRoot, used for matching and stable IDs. */
  readonly relativePath: string;
}
