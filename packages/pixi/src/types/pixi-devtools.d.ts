/* eslint-disable no-underscore-dangle -- Pixi DevTools requires these exact global names. */

import type { Container, WebGLRenderer } from 'pixi.js';

declare global {
  /** Development-only stage discovered by the Pixi DevTools browser extension. */
  var __PIXI_STAGE__: Container | undefined;
  /** Development-only renderer paired with Replayable's stage. */
  var __PIXI_RENDERER__: WebGLRenderer | undefined;
}
