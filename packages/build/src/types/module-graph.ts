export interface ApplicationModuleChunk {
  readonly modules: Readonly<Record<string, unknown>>;
  readonly type: 'chunk';
}

export interface ApplicationModuleAsset {
  readonly type: 'asset';
}

export type ApplicationModuleGraph = readonly (ApplicationModuleAsset | ApplicationModuleChunk)[];

export interface PackageInstance {
  /** Canonical package root used as the physical-instance identity. */
  readonly directory: string;
  /** Name read from the package's own manifest, never inferred from its path. */
  readonly name: string;
}
