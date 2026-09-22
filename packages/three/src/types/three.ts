import type { PerspectiveCamera, Scene, WebGLRenderer } from 'three';

import type { ThreeIntegration } from './integrations.js';

/** Renderer choices whose dimensions and frame scheduling remain runtime-owned. */
export interface CreateThreeOptions {
  /** Optional decoder capabilities installed before runtime asset loading. */
  readonly integrations?: readonly ThreeIntegration[];
  /** Application-owned perspective camera; resize updates aspect and projection only. */
  readonly camera: PerspectiveCamera;
  /** Applies only when creating a new context; a borrowed context keeps its attributes. */
  readonly antialias?: boolean;
  /** GPU preference when creating a context. Defaults to high-performance. */
  readonly powerPreference?: 'high-performance' | 'low-power';
}

/** Renderer, asset loading, and lifecycle integration for one playable. */
export interface ReplayableThree {
  readonly renderer: WebGLRenderer;
  /** Root scene created by this integration. Lighting and contents belong to the application. */
  readonly scene: Scene;
  readonly camera: PerspectiveCamera;
  /**
   * Unregisters the loader, stops subscriptions, detaches scene children, and releases the renderer once.
   * Model instances, cached assets, and application-created GPU resources remain
   * application-owned and must be disposed by their creator.
   */
  destroy(): void;
}

/** Internal renderer lifetime, capturing the exact canvas host acquired during setup. */
export interface ThreeRendererResult {
  readonly renderer: WebGLRenderer;
  readonly destroy: () => void;
}
