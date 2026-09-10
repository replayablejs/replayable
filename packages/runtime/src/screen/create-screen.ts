import type { GpuTierDetector, RenderPolicy } from '#types/gpu.js';
import type {
  RuntimeOrientation,
  RuntimeOrientationConfig,
  RuntimeScreenConfig,
  RuntimeViewport,
  Screen,
  ScreenDesign,
  ScreenFrame,
} from '#types/screen.js';

import { createGpuTierDetector } from './gpu/create-gpu-tier-detector.js';
import { detectRenderPolicy } from './gpu/resolve-render-policy.js';
import { measureSafeArea } from './measure-safe-area.js';

/** Creates the screen state that runtime updates when host dimensions change. */
export function createScreen(config: RuntimeScreenConfig, root: HTMLElement): ReplayableScreen {
  return new ReplayableScreen(config, createGpuTierDetector(), root);
}

/** Owns the latest calculated layout for one playable screen configuration. */
class ReplayableScreen implements Screen {
  declare public design: ScreenDesign;
  declare public frame: ScreenFrame;
  declare public safeArea: ScreenFrame;
  declare public orientation: RuntimeOrientation;
  declare public resolution: number;
  declare public scale: number;
  declare public viewport: RuntimeViewport;

  private renderPolicy: RenderPolicy | undefined;

  public constructor(
    private readonly config: RuntimeScreenConfig,
    private readonly gpuTierDetector: GpuTierDetector,
    private readonly root: HTMLElement,
  ) {}

  /** Resolves and caches renderer quality before the host publishes its initial viewport. */
  public async initialize(): Promise<void> {
    this.renderPolicy = await detectRenderPolicy(this.gpuTierDetector);
  }

  public readonly update = (viewport: RuntimeViewport): void => {
    if (this.renderPolicy === undefined) {
      throw new Error('Replayable screen must be initialized before it can be updated.');
    }

    const orientation = selectOrientation(this.config.orientations, viewport);
    const orientationConfig = this.config.orientations[orientation];
    const frame = createFrame(viewport, orientationConfig);

    this.design = {
      width: orientationConfig.width,
      height: orientationConfig.height,
    };
    this.frame = frame;
    this.orientation = orientation;
    this.safeArea = measureSafeArea(this.root, frame, orientation);
    const pixelRatio = clamp(
      window.devicePixelRatio,
      this.config.resolution.pixelRatio.min,
      this.config.resolution.pixelRatio.max,
    );

    this.resolution = pixelRatio * this.config.resolution.renderScale[this.renderPolicy];
    this.scale = Math.min(
      frame.width / orientationConfig.width,
      frame.height / orientationConfig.height,
    );
    this.viewport = viewport;
  };
}

/** Uses viewport orientation when supported, otherwise the enabled alternative. */
function selectOrientation(
  orientations: RuntimeScreenConfig['orientations'],
  viewport: RuntimeViewport,
): RuntimeOrientation {
  const viewportOrientation: RuntimeOrientation =
    viewport.height >= viewport.width ? 'portrait' : 'landscape';

  if (orientations[viewportOrientation].enabled) {
    return viewportOrientation;
  }

  if (orientations.portrait.enabled) {
    return 'portrait';
  }

  return 'landscape';
}

/** Creates the largest centered frame allowed by one orientation's ratio range. */
function createFrame(
  viewport: RuntimeViewport,
  orientation: RuntimeOrientationConfig,
): ScreenFrame {
  const viewportRatio = viewport.width / viewport.height;
  const frameRatio = clamp(viewportRatio, orientation.ratio.min, orientation.ratio.max);

  if (viewportRatio > frameRatio) {
    const width = viewport.height * frameRatio;

    return {
      x: (viewport.width - width) / 2,
      y: 0,
      width,
      height: viewport.height,
    };
  }

  const height = viewport.width / frameRatio;

  return {
    x: 0,
    y: (viewport.height - height) / 2,
    width: viewport.width,
    height,
  };
}

/** Restricts one numeric value to an inclusive range. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
