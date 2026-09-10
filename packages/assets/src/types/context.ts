/** Absolute, validated filesystem paths used throughout one assets build. */
export interface BuildContext {
  /** Absolute path of the generated TypeScript assets module. */
  readonly assetsFile: string;
  /** Absolute root for processed asset files. */
  readonly outputRoot: string;
  /** Optional absolute directory for generated registry modules. */
  readonly registriesDirectory?: string | undefined;
  /** Absolute root containing raw source assets. */
  readonly sourceRoot: string;
}
