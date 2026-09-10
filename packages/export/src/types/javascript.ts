/** Parsing goal for export normalization. */
export type JavaScriptSourceType = 'module' | 'script';

/** Ordered entries restored by the browser loader. */
export type CompressedEntryRole = 'assets' | 'application';

/** Only the inflate operation used by the browser entry. */
export interface PakoInflater {
  inflate(data: Uint8Array, options: { readonly to: 'string' }): string;
}
