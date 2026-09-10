/** Maximum delivery size in bytes; Liftoff applies this to entry HTML. */
export const MAX_EXPORT_SIZE_BYTES = 5_000_000;

/** Maximum number of files in a Google delivery archive. */
export const GOOGLE_MAX_ARCHIVE_FILE_COUNT = 512;

/** Moloco requires a strictly smaller delivery; other networks include the limit. */
export function isWithinExportSizeLimit(bytes: number, network: string): boolean {
  return network === 'moloco' ? bytes < MAX_EXPORT_SIZE_BYTES : bytes <= MAX_EXPORT_SIZE_BYTES;
}
