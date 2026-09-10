import type { Container, WebGLRenderer } from 'pixi.js';

/** Internal renderer lifetime, including the exact canvas host acquired at creation. */
export interface PixiRendererResult {
  readonly renderer: WebGLRenderer;
  /** Releases renderer resources and only the canvas host owned by this renderer. */
  readonly destroy: () => void;
}

/** Optional capability installed and owned by one Replayable Pixi instance. */
export interface PixiIntegration {
  /** Installs the capability and returns its matching cleanup operation. */
  setup(): () => void;
}

/** Playable-safe renderer choices that remain under application control. */
export interface CreatePixiOptions {
  /** Enables multisample antialiasing for the default framebuffer. */
  readonly antialias?: boolean;
  /** Optional renderer capabilities installed before runtime asset loading begins. */
  readonly integrations?: readonly PixiIntegration[];
  /** Selects the browser's preferred GPU power profile. */
  readonly powerPreference?: 'high-performance' | 'low-power';
  /** Preserves the previous frame in a back buffer for effects that sample it. */
  readonly useBackBuffer?: boolean;
}

/** Initialized Pixi renderer and the root stage owned by Replayable. */
export interface ReplayablePixi {
  readonly renderer: WebGLRenderer;
  readonly stage: Container;

  /** Releases Pixi lifecycle work and renderer-owned resources once. */
  destroy(): void;
}
