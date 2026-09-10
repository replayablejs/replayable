import { AnimatedSprite, Container, TextStyle, Texture } from 'pixi.js';
import { describe, expect, it, vi } from 'vitest';

import { createAnimatedSprite } from '../src/factories/create-animated-sprite.js';
import { createNineSliceSprite } from '../src/factories/create-nine-slice-sprite.js';
import { createSplitText } from '../src/factories/create-split-text.js';
import { createSprite } from '../src/factories/create-sprite.js';
import { createText } from '../src/factories/create-text.js';

describe('Pixi factories', () => {
  it('creates unattached split text without forcing manual character splitting', () => {
    const text = createSplitText({ text: 'Garden', style: {}, autoSplit: false });

    expect(text.text).toBe('Garden');
    expect(text.chars).toHaveLength(0);
    expect(text.position).toMatchObject({ x: 0, y: 0 });
    expect(text.scale).toMatchObject({ x: 1, y: 1 });
    expect(text.pivot).toMatchObject({ x: 0, y: 0 });
    expect(text.parent).toBeNull();
    text.destroy({ children: true });
  });

  it('preserves native split options and applies shared transforms without mutating options', () => {
    const options = {
      text: 'Garden',
      autoSplit: false,
      charAnchor: 0.5,
      eventMode: 'none' as const,
      position: { x: 10, y: 20 },
      pivot: { x: 3, y: 4 },
      scale: { x: 2, y: 2 },
      alpha: 0.5,
      visible: false,
      style: { fontSize: 24 },
    };
    const original = structuredClone(options);
    const text = createSplitText(options);

    expect(text.charAnchor).toBe(0.5);
    expect(text.eventMode).toBe('none');
    expect(text.style.fontSize).toBe(24);
    expect(text.position).toMatchObject(options.position);
    expect(text.pivot).toMatchObject(options.pivot);
    expect(text.scale).toMatchObject(options.scale);
    expect(text.alpha).toBe(0.5);
    expect(text.visible).toBe(false);
    expect(options).toEqual(original);
    text.destroy({ children: true });
  });

  it('creates an unattached sprite with Replayable defaults', () => {
    const sprite = createSprite();

    expect(sprite.texture).toBe(Texture.EMPTY);
    expect(sprite.position).toMatchObject({ x: 0, y: 0 });
    expect(sprite.scale).toMatchObject({ x: 1, y: 1 });
    expect(sprite.anchor).toMatchObject({ x: 0.5, y: 0.5 });
    expect(sprite.alpha).toBe(1);
    expect(sprite.visible).toBe(true);
    expect(sprite.parent).toBeNull();
  });

  it('applies sprite overrides without mutating their source options', () => {
    const options = {
      alpha: 0.4,
      anchor: { x: 0, y: 1 },
      eventMode: 'static' as const,
      position: { x: 12, y: 24 },
      scale: { x: 2, y: 3 },
      texture: Texture.EMPTY,
      tint: 0,
      visible: false,
      zIndex: 7,
    };
    const originalOptions = structuredClone({ ...options, texture: undefined });
    const sprite = createSprite(options);

    expect(sprite.position).toMatchObject(options.position);
    expect(sprite.scale).toMatchObject(options.scale);
    expect(sprite.anchor).toMatchObject(options.anchor);
    expect(sprite.alpha).toBe(0.4);
    expect(sprite.visible).toBe(false);
    expect(sprite.zIndex).toBe(7);
    expect(sprite.tint).toBe(0);
    expect(sprite.eventMode).toBe('static');
    expect({ ...options, texture: undefined }).toEqual(originalOptions);
  });

  it('resolves a sprite texture alias through Pixi', () => {
    const resolveTexture = vi.spyOn(Texture, 'from').mockReturnValue(Texture.EMPTY);

    expect(createSprite({ texture: 'flower' }).texture).toBe(Texture.EMPTY);
    expect(resolveTexture).toHaveBeenCalledWith('flower', false);

    resolveTexture.mockRestore();
  });

  it('creates an unattached nine-slice sprite with named borders', () => {
    const sprite = createNineSliceSprite({
      bottomHeight: 4,
      height: 80,
      leftWidth: 1,
      rightWidth: 3,
      texture: Texture.EMPTY,
      topHeight: 2,
      width: 120,
    });

    expect(sprite).toMatchObject({
      bottomHeight: 4,
      height: 80,
      leftWidth: 1,
      rightWidth: 3,
      topHeight: 2,
      width: 120,
    });
    expect(sprite.anchor).toMatchObject({ x: 0.5, y: 0.5 });
    expect(sprite.parent).toBeNull();
  });

  it('rejects animated sprites without frames', () => {
    expect(() => createAnimatedSprite({ frames: [] })).toThrow(
      'Cannot create an animated sprite without texture frames.',
    );
  });

  it('resolves animation frames and starts playback only when requested', () => {
    const resolveTexture = vi.spyOn(Texture, 'from').mockReturnValue(Texture.EMPTY);
    const play = vi.spyOn(AnimatedSprite.prototype, 'play').mockImplementation(() => {});
    const idle = createAnimatedSprite({ frames: [Texture.EMPTY] });
    const playing = createAnimatedSprite({ autoPlay: true, frames: ['flower-1'], loop: true });

    expect(idle.totalFrames).toBe(1);
    expect(playing.loop).toBe(true);
    expect(resolveTexture).toHaveBeenCalledWith('flower-1');
    expect(play).toHaveBeenCalledOnce();
    expect(idle.parent).toBeNull();
    expect(playing.parent).toBeNull();

    play.mockRestore();
    resolveTexture.mockRestore();
  });

  it('creates unattached canvas text from Pixi-native text values and styles', () => {
    const style = new TextStyle({ fill: 0xffffff, fontSize: 24 });
    const text = createText({ position: { x: 10, y: 20 }, style, text: 'Garden' });

    expect(text.text).toBe('Garden');
    expect(text.style).toBe(style);
    expect(text.position).toMatchObject({ x: 10, y: 20 });
    expect(text.anchor).toMatchObject({ x: 0.5, y: 0.5 });
    expect(text.parent).toBeNull();

    const parent = new Container();
    parent.addChild(text);
    expect(text.parent).toBe(parent);
  });
});
