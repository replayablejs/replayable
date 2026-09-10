/** One file in the flat in-memory list returned by the texture packer. */
export interface PackedAtlasFile {
  /** Complete generated file contents. */
  readonly buffer: Buffer;
  /** Packer-provided basename including its extension. */
  readonly name: string;
}

/** One validated packed sheet containing its Pixi layout and PNG texture. */
export interface PackedAtlasSheet {
  /** Generated Pixi frame layout. */
  readonly json: PackedAtlasFile;
  /** Shared basename of the paired layout and texture files. */
  readonly name: string;
  /** Lossless intermediate texture passed to Replayable's image encoder. */
  readonly png: PackedAtlasFile;
}

/** Mutable pair assembled while the packer's flat output is being grouped. */
export interface PartialPackedAtlasSheet {
  json?: PackedAtlasFile;
  png?: PackedAtlasFile;
}

/** In-memory source shape accepted by `free-tex-packer-core`. */
export interface AtlasPackerInput {
  readonly contents: Buffer;
  /** Authored filename used by the packer as the generated frame name. */
  readonly path: string;
}
