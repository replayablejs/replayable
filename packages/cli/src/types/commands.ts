/** Parsed options for `replayable assets`. */
export interface AssetsOptions {
  readonly config: string;
}

/** Parsed options for `replayable build`. */
export interface BuildOptions {
  readonly config: string;
}

/** Parsed options for `replayable config`. */
export interface ConfigOptions {
  readonly config: string;
  readonly json?: boolean;
}

/** Parsed options for `replayable dev`. */
export interface DevOptions {
  readonly config: string;
  readonly host?: string;
  readonly language?: string;
  readonly open?: boolean;
  readonly port?: number;
  readonly version?: string;
}

/** Parsed options for `replayable export`. */
export interface ExportOptions {
  readonly config: string;
  readonly output?: string;
}
