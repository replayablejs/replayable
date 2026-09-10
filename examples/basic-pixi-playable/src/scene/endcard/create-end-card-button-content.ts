import { createNineSliceSprite, createText, fitText } from '@replayablejs/pixi';
import { playable } from '@replayablejs/runtime';
import { Container } from 'pixi.js';

import { atlases, fonts } from '../../assets/registries';

/** Creates localized CTA artwork only; the owning button adds input and animation. */
export function createEndCardButtonContent(): Container {
  const { endCardLabel } = playable.config.params;
  if (typeof endCardLabel !== 'string') {
    throw new Error('Endcard requires a localized primary CTA label.');
  }

  const content = new Container({ label: 'button-artwork' });
  const background = createNineSliceSprite({
    texture: atlases.ui.cta_play_button,
    width: 280,
    height: 80,
    leftWidth: 15,
    rightWidth: 15,
    topHeight: 15,
    bottomHeight: 19,
  });
  const label = createText({
    text: playable.localization.translate(endCardLabel),
    position: { x: 0, y: -3 },
    style: {
      fontFamily: fonts['Patrick Hand'],
      fontSize: 55,
      fill: '#ffffff',
      align: 'center',
      stroke: { color: '#159b1c', width: 4 },
      dropShadow: { color: '#159b1c', alpha: 1, angle: Math.PI / 2, distance: 2, blur: 5 },
    },
  });

  // Fit longer translations inside the artwork's text area without enlarging shorter ones.
  fitText(label, { width: 244, height: 56 });
  content.addChild(background, label);
  return content;
}
