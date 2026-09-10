/** TypeScript declarations for Howler's published core-only distribution. */
declare module 'howler/dist/howler.core.min.js' {
  export type Howl = import('howler').Howl;
  export type HowlCallback = (soundId: number) => void;
  export type HowlErrorCallback = (soundId: number, error: unknown) => void;

  export const Howl: typeof import('howler').Howl;
  export const Howler: import('howler').HowlerGlobal;
}
