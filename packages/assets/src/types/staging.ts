import type { BuildContext } from './context.js';

/** Temporary build destinations and the operations that own their lifetime. */
export interface AssetBuildStaging {
  readonly context: BuildContext;
  readonly commit: () => Promise<void>;
  readonly dispose: () => Promise<void>;
}

/** One non-nested output tree or module replaced during publication. */
export interface AssetOutputReplacement {
  readonly destination: string;
  readonly prepared: string;
  readonly backup: string;
  backedUp: boolean;
  installed: boolean;
}
