import { createNineSliceSprite, createSprite, createText, fitText } from '@replayablejs/pixi';
import { playable } from '@replayablejs/runtime';
import { Container, Rectangle } from 'pixi.js';

import { atlases, fonts, locales } from '../../assets/registries';

/** Centers the title, rating, and caption inside the endcard popup. */
export function createRatingPanel(): Container {
  const container = new Container({ label: 'rating-panel', eventMode: 'none' });
  const background = createNineSliceSprite({
    texture: atlases.ui.cta_box,
    anchor: { x: 0, y: 0 },
    width: 640,
    height: 360,
    leftWidth: 150,
    rightWidth: 44,
    topHeight: 56,
    bottomHeight: 37,
  });
  const title = createText({
    text: playable.localization.translate(locales['Pixi Playable Template']),
    position: { x: 320, y: 105 },
    style: {
      fontFamily: fonts['Patrick Hand'],
      fontSize: 42,
      fill: '#4599fb',
      align: 'center',
      wordWrap: true,
      wordWrapWidth: 310,
    },
  });
  const caption = createText({
    text: playable.localization.translate(locales['4.5 out of 5 stars']),
    position: { x: 320, y: 233 },
    style: {
      fontFamily: fonts['Patrick Hand'],
      fontSize: 28,
      fill: '#000000',
      align: 'center',
    },
  });
  fitText(title, { width: 310, height: 80 });
  fitText(caption, { width: 310 });
  const stars = createStars();
  stars.position.set(320 - stars.width / 2, 164);

  container.boundsArea = new Rectangle(0, 0, 640, 360);
  container.addChild(background, title, stars, caption);
  return container;
}

/** Four full stars and one half star occupy equal slots, matching the 4.5 caption. */
function createStars(): Container {
  const container = new Container({ label: 'rating-stars' });
  for (let index = 0; index < 5; index += 1) {
    const star = createSprite({
      texture: index === 4 ? atlases.ui.star_half : atlases.ui.star_full,
      anchor: { x: 0, y: 0 },
    });
    star.x = index * star.width;
    container.addChild(star);
  }
  return container;
}
