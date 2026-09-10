/** Minimal declaration for the untyped subset-font API used by Replayable. */
declare module 'subset-font' {
  /** Keeps the glyphs required by `text` and returns an encoded WOFF2 font. */
  export default function subsetFont(
    font: Uint8Array,
    text: string,
    options: { readonly targetFormat: 'woff2' },
  ): Promise<Uint8Array>;
}

declare module 'free-tex-packer-core' {
  /**
   * Options used by Replayable at the package's actual CommonJS runtime boundary.
   *
   * The upstream declarations model these string values as enums, but the
   * corresponding enum objects are not exported at runtime. This overload
   * describes the literal values accepted by the JavaScript implementation
   * without forcing consumers to assert strings to unavailable enum types.
   */
  export type ReplayableTexturePackerOptions = Omit<
    TexturePackerOptions,
    'exporter' | 'filter' | 'packer' | 'scaleMethod' | 'trimMode'
  > & {
    readonly exporter?: 'Pixi';
    readonly filter?: 'none';
    readonly packer?: 'OptimalPacker';
    readonly scaleMethod?: 'BILINEAR';
    readonly trimMode?: 'trim';
  };

  export function packAsync(
    files: Array<{ readonly contents: Buffer; readonly path: string }>,
    config?: ReplayableTexturePackerOptions,
  ): Promise<Array<{ readonly buffer: Buffer; readonly name: string }>>;
}
