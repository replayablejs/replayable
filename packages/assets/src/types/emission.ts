/** One import that will be written into the generated assets module. */
export interface GeneratedImport {
  /** Unique identifier referenced by generated asset entries. */
  readonly name: string;
  /** Module specifier relative to the generated assets module. */
  readonly path: string;
}

/** Shared state used while assembling one generated assets module. */
export interface AssetsModuleContext {
  /** Directory containing the generated module, used for relative imports. */
  readonly fromDirectory: string;
  /** Imports registered while category entries are serialized. */
  readonly imports: GeneratedImport[];
}

/** A nested registry object containing only serializable string values. */
export interface RegistryObject {
  readonly [key: string]: RegistryObject | string;
}

/** One fully rendered file waiting to be written into the registry directory. */
export interface RenderedRegistryModule {
  /** File basename relative to the configured registry directory. */
  readonly filename: string;
  /** Complete TypeScript source, including the generated header and final newline. */
  readonly source: string;
}
