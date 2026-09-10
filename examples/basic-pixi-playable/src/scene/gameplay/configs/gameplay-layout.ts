import type { LayoutAreaConfig, LayoutBounds, LayoutConfig } from '@replayablejs/pixi';
import { playable } from '@replayablejs/runtime';

import type { SceneLayoutFeatures } from '../../../types/gameplay';
import {
  createPortraitPersistentCtaArea,
  PORTRAIT_LOGO_HEIGHT,
} from '../../interface/configs/interface-layout';

/** Caps portrait board width relative to safe-area height, avoiding oversized tablet cards. */
const MAX_PORTRAIT_BOARD_WIDTH_RATIO = 0.66;

/** Fits cards and enabled guidance into the space below the persistent header. */
export function createGameplayLayoutConfig(features: SceneLayoutFeatures): LayoutConfig {
  const { safeArea: bounds, orientation } = playable.screen;
  const areas =
    orientation === 'portrait' ? createPortraitAreas(features) : createLandscapeAreas(features);

  return { debug: false, bounds, areas };
}

/**
 * Place landscape cards first, adjust for compact screens, then position the
 * tutorial below their allocated area. The corner controls remain owned by UI.
 */
function createLandscapeAreas(features: SceneLayoutFeatures): LayoutConfig['areas'] {
  const bounds = playable.screen.safeArea;
  // 1. Board area
  // EDIT THESE BOUNDS to position the cards, in fractions of the safe area.
  // This centered box uses 59% width and 80% height; without tutorial it uses
  // full height. Changing its bottom edge also moves the tutorial's available space.
  const boardBounds: LayoutBounds = {
    x: 0.1875,
    y: 0,
    width: 0.625,
    height: features.tutorial ? 0.8 : 1,
  };

  // 2. Compact-screen adjustment
  // Blend from wide-phone framing (ratio >= 1.8) to compact framing (<= 1.25).
  // Subtraction reverses the ratio; division maps that range to 0..1; clamping
  // prevents extrapolation. At ratio 1.525 the adjustment is exactly halfway.
  // These are composition thresholds, not device detection or DPR calculations.
  const landscapeRatio = bounds.width / bounds.height;
  const compactness = Math.max(0, Math.min(1, (1.8 - landscapeRatio) / (1.8 - 1.25)));

  // Increase width by up to 12% relative to the authored width (59% -> 66.08%),
  // preserving its horizontal center. Inset the top by up to 14% of safe height
  // to clear corner controls, keeping the authored bottom fixed. This adjusts
  // the allocated box; 'contain' still preserves the cards' actual proportions.
  const boardWidth = boardBounds.width * (1 + 0.12 * compactness);
  const topInset = Math.min(boardBounds.height, 0.14 * compactness);
  const resolvedBoardBounds: LayoutBounds = {
    x: boardBounds.x + (boardBounds.width - boardWidth) / 2,
    y: boardBounds.y + topInset,
    width: boardWidth,
    height: boardBounds.height - topInset,
  };
  const areas: Record<string, LayoutAreaConfig> = {
    board: { bounds: resolvedBoardBounds, align: 'center', scale: 'contain' },
  };

  // 3. Tutorial area
  // Leave a 3% gap below the board, then center a fixed 50%-wide, 17%-high box
  // in the remaining space. Reducing board height changes position, not scroll
  // size. If less space remains, shrink the sizing box rather than overlap.
  if (features.tutorial) {
    const remainingTop = resolvedBoardBounds.y + resolvedBoardBounds.height + 0.03;
    const remainingHeight = Math.max(0, 1 - remainingTop);
    const tutorialHeight = Math.min(0.17, remainingHeight);
    const tutorialBounds: LayoutBounds = {
      x: 0.25,
      y: remainingTop + (remainingHeight - tutorialHeight) / 2,
      width: 0.5,
      height: tutorialHeight,
    };
    areas.tutorial = { bounds: tutorialBounds, align: 'center', scale: 'contain' };
  }

  return areas;
}

/**
 * Allocate portrait gameplay below the logo and above the UI footer.
 * Place the board explicitly within that available space, then center the scroll
 * below it. Tutorial dimensions never determine the board's position or size.
 */
function createPortraitAreas(features: SceneLayoutFeatures): LayoutConfig['areas'] {
  const bounds = playable.screen.safeArea;
  // 1. Available space
  // A 12px gap becomes a height fraction, capped at 2% for short screens.
  // Share UI's header and CTA boundaries instead of measuring rendered objects.
  // Without a CTA, content extends to the safe bottom (1).
  const gap = Math.min(4 / bounds.height, 0.02);
  const persistentCta = createPortraitPersistentCtaArea();
  const contentTop = PORTRAIT_LOGO_HEIGHT + gap;
  const contentBottom = persistentCta === undefined ? 1 : persistentCta.bounds.y - gap;
  const contentHeight = contentBottom - contentTop;

  // 2. Board area
  // EDIT THESE BOUNDS to position the cards. They are fractions of the available
  // gameplay space, not the whole screen: y: 0 starts below the logo; height: 0.65
  // uses its first 65%. For example, y: 0.05 moves the box down by 5% of that space.
  // Leave room below the board when tutorial is enabled. Without it, use all height.
  const boardBounds: LayoutBounds = {
    x: 0,
    y: 0.05,
    width: 1,
    height: features.tutorial ? 0.65 : 1,
  };

  // Apply the tablet width cap separately from authored placement, keeping the
  // narrower box centered inside the requested width. Then convert from content
  // coordinates to the safe-area coordinates expected by the outer layout.
  const boardWidth = Math.min(
    boardBounds.width,
    (bounds.height * MAX_PORTRAIT_BOARD_WIDTH_RATIO) / bounds.width,
  );
  const resolvedBoardBounds: LayoutBounds = {
    x: boardBounds.x + (boardBounds.width - boardWidth) / 2,
    y: contentTop + boardBounds.y * contentHeight,
    width: boardWidth,
    height: boardBounds.height * contentHeight,
  };
  const areas: Record<string, LayoutAreaConfig> = {
    board: { bounds: resolvedBoardBounds, align: 'center', scale: 'contain' },
  };

  // 3. Tutorial area
  // Place its fixed sizing box between the allocated board bottom (plus a gap)
  // and the content bottom. Reducing board height moves the scroll upward without
  // enlarging it. No rendered-card measurements or second layout pass are needed.
  if (features.tutorial) {
    const remainingTop = resolvedBoardBounds.y + resolvedBoardBounds.height + gap;
    const remainingHeight = Math.max(0, contentBottom - remainingTop);
    // Preserve the scroll's 459 x 126 proportions at 90% width, capped at 12%
    // of safe-area height. A smaller remaining space can shrink it, never enlarge it.
    const tutorialHeight = Math.min(
      (bounds.width * 0.9 * 126) / (459 * bounds.height),
      0.12,
      remainingHeight,
    );
    // Center between board and CTA when present. Without CTA, use 30% of the
    // free travel below the board, lifting the scroll without changing its size.
    // 0 aligns to the top; 0.5 centers; 1 aligns to the bottom.
    const tutorialPosition = persistentCta === undefined ? 0.05 : 0.5;
    const tutorialBounds: LayoutBounds = {
      x: 0.05,
      y: remainingTop + (remainingHeight - tutorialHeight) * tutorialPosition,
      width: 0.9,
      height: tutorialHeight,
    };
    areas.tutorial = { bounds: tutorialBounds, align: 'center', scale: 'contain' };
  }

  return areas;
}
