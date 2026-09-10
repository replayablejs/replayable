/** One file prepared for inclusion in a network export artifact. */
export interface ExportFile {
  /** Portable path relative to the export root. */
  readonly path: string;
  /** Complete file contents. */
  readonly data: Uint8Array;
}
