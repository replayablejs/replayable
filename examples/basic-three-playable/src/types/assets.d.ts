// Asset imports are resolved to URLs by the Replayable build pipeline.
declare module '*.webp' {
  const source: string;
  export default source;
}
declare module '*.avif' {
  const source: string;
  export default source;
}
declare module '*.glb' {
  const source: string;
  export default source;
}
declare module '*.mp3' {
  const source: string;
  export default source;
}
declare module '*.m4a' {
  const source: string;
  export default source;
}

// Stylesheets are bundled by the playable build pipeline.
declare module '*.css';

declare module '*.woff2' {
  const source: string;
  export default source;
}
