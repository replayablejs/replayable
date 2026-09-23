import type { ReplayableNetwork } from './config.js';

/** Raw project and variant values supplied to an export filename callback. */
export interface ExportFilenameContext {
  readonly name: string;
  readonly version: string;
  readonly network: ReplayableNetwork;
  readonly language: string;
}

/** Returns a filename without a directory or extension. Casing and spacing are preserved. */
export type ExportFilename = (context: ExportFilenameContext) => string;
