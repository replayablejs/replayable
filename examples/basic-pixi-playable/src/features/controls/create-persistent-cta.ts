import { createNineSliceSprite, createText, fitText } from '@replayablejs/pixi';
import { playable } from '@replayablejs/runtime';
import { Container } from 'pixi.js';

import { atlases, fonts } from '../../assets/registries';
import type { Control } from '../../types/control';
import { createControlButton } from './create-control-button';

/** Creates the reference's orange store button only when network policy permits it. */
export function createPersistentCta(): Control | undefined {
  if (!playable.config.controls.persistentCta) {
    return undefined;
  }
  const { persistentCtaLabel } = playable.config.params;
  if (typeof persistentCtaLabel !== 'string') {
    throw new Error('Persistent CTA requires a localized label key.');
  }

  const content = new Container();
  const background = createNineSliceSprite({
    texture: atlases.ui.persistent_cta_button,
    width: 296,
    height: 92,
    leftWidth: 15,
    rightWidth: 15,
    topHeight: 15,
    bottomHeight: 19,
  });
  const label = createText({
    text: playable.localization.translate(persistentCtaLabel),
    position: { x: 0, y: -3 },
    style: {
      fontFamily: fonts['Patrick Hand'],
      fontSize: 44,
      fill: '#ffffff',
      align: 'center',
      dropShadow: { color: '#d68800', alpha: 1, angle: Math.PI / 2, distance: 2, blur: 5 },
    },
  });
  fitText(label, { width: 260, height: 60 });
  content.addChild(background, label);
  const button = createControlButton(content, openStore);
  button.container.label = 'persistent-cta';

  return button;

  /** Input isolation in the shared button prevents a second scene-level store action. */
  function openStore(): void {
    playable.openStore();
  }
}
