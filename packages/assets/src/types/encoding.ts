import type { ImageOptions } from './asset-options.js';

export interface GeneratedOutput {
  readonly path: string;
}

export interface PreparedImage {
  /** True only when every pixel is fully opaque after scaling. */
  readonly isOpaque: boolean;
  /** Scaled source encoded losslessly so every candidate receives identical pixels. */
  readonly buffer: Buffer;
}

export interface ImageEncodingRequest {
  readonly input: string | Buffer;
  readonly options: ImageOptions;
  readonly outputBasePath: string;
  /** Human-readable source path included in processing errors. */
  readonly sourcePath: string;
}

/** Encoded image bytes paired with the MIME type that must be stored in the document. */
export interface ModelTextureCandidate {
  readonly image: Uint8Array;
  readonly mimeType: string;
}
