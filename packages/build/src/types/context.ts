import type { PlayableViteContext } from '#types/vite.js';

/** Absolute paths and resolved configuration shared by every build stage. */
export interface BuildContext extends PlayableViteContext {
  /** Absolute directory that will contain the runnable playable. */
  readonly outputDirectory: string;
  /** Absolute path of the final HTML document. */
  readonly htmlFile: string;
}

/** Resolved Vite and server configuration for one local preview session. */
export interface DevelopmentContext extends PlayableViteContext {
  /** Hostname or IP address exposed by the development server. */
  readonly host: string;
  /** Whether Vite opens the playable in the default browser. */
  readonly open: boolean;
  /** Port requested for the development server. */
  readonly port: number;
}
