import { vi } from 'vitest';

export const unregisterContext = vi.fn<() => void>();
export const registerWebglContext = vi.fn<
  (context: WebGLRenderingContext | WebGL2RenderingContext) => () => void
>(() => unregisterContext);
