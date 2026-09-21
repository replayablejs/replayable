declare module 'gltf-validator' {
  export function validateBytes(
    bytes: Uint8Array,
    options: { maxIssues: number },
  ): Promise<{
    issues: { numErrors: number; messages: readonly unknown[] };
  }>;
}
