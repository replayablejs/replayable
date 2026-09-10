import type { LayoutAreaConfig, LayoutConfig } from '@replayablejs/pixi';
import { playable } from '@replayablejs/runtime';

/** Gameplay reserves this same header height so the portrait logo stays clear of cards. */
export const PORTRAIT_LOGO_HEIGHT = 0.08;

/** One layout for safe-area branding and the persistent CTA. */
export function createInterfaceLayoutConfig(popupTop: number): LayoutConfig {
  const { safeArea: bounds, orientation } = playable.screen;
  const areas = orientation === 'portrait' ? createPortraitAreas(popupTop) : createLandscapeAreas();

  return {
    debug: false,
    bounds,
    areas,
  };
}

/** Center portrait branding above gameplay, then above the fitted endcard popup. */
function createPortraitAreas(popupTop: number): LayoutConfig['areas'] {
  const persistentCta = createPortraitPersistentCtaArea();
  const bounds = playable.screen.safeArea;
  const logoWidth = 0.5;
  const endCardLogoScale = 1.18;
  const endCardLogoHeight = PORTRAIT_LOGO_HEIGHT * endCardLogoScale;

  return {
    ...(persistentCta === undefined ? {} : { persistentCta }),
    logo: {
      bounds: { x: (1 - logoWidth) / 2, y: 0, width: logoWidth, height: PORTRAIT_LOGO_HEIGHT },
      scale: 'contain',
    },
    // Center above the resting popup. Enlarging both dimensions preserves the
    // 18% increase while leaving placement and scaling in layout's hands.
    logoEndCard: {
      bounds: {
        x: (1 - logoWidth * endCardLogoScale) / 2,
        y: ((popupTop - bounds.y) / bounds.height - endCardLogoHeight) / 2,
        width: logoWidth * endCardLogoScale,
        height: endCardLogoHeight,
      },
      align: 'center',
      scale: 'contain',
    },
  };
}

/** Move landscape branding from the top-left corner into the endcard's left third. */
function createLandscapeAreas(): LayoutConfig['areas'] {
  const persistentCta = createLandscapePersistentCtaArea();
  return {
    ...(persistentCta === undefined ? {} : { persistentCta }),
    logo: {
      bounds: { x: 0, y: 0, width: 0.195, height: 0.1125 },
      align: 'top-left',
      scale: 'contain',
    },
    // Branding uses the left third; the popup occupies the other two thirds.
    logoEndCard: {
      bounds: { x: 1 / 24, y: 0.4, width: 0.25, height: 0.2 },
      align: 'center',
      scale: 'contain',
    },
  };
}

/** UI owns CTA geometry; gameplay reads its portrait boundary only to reserve space. */
export function createPortraitPersistentCtaArea(): LayoutAreaConfig | undefined {
  const bounds = playable.screen.safeArea;
  if (!playable.config.controls.persistentCta) {
    return undefined;
  }

  const height = Math.min((bounds.width * 0.6 * 92) / (296 * bounds.height), 0.09);
  return {
    bounds: { x: 0.2, y: 1 - height, width: 0.6, height },
    align: 'bottom-center',
    scale: 'contain',
  };
}

/** Landscape CTA occupies the top-right corner without reserving a gameplay footer. */
function createLandscapePersistentCtaArea(): LayoutAreaConfig | undefined {
  if (!playable.config.controls.persistentCta) {
    return undefined;
  }
  return {
    bounds: { x: 0.805, y: 0, width: 0.195, height: 0.1125 },
    align: 'top-right',
    scale: 'contain',
  };
}
