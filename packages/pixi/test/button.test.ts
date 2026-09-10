import {
  Container,
  EventBoundary,
  FederatedPointerEvent,
  Rectangle,
  Sprite,
  Texture,
} from 'pixi.js';
import { describe, expect, it, vi } from 'vitest';

import { createButton } from '../src/factories/create-button.js';

describe('createButton', () => {
  it('captures transformed artwork bounds once without changing its transform', () => {
    const content = new Container({ position: { x: 10, y: 20 }, scale: 2 });
    content.boundsArea = new Rectangle(0, 0, 30, 40);
    const button = createButton({ content, onActivate: vi.fn<() => void>() });

    expect(button.container.hitArea).toMatchObject({ x: 10, y: 20, width: 60, height: 80 });
    expect(content.parent).toBe(button.container);
    expect(content.eventMode).toBe('none');
    expect(content.scale.x).toBe(2);
    content.scale.set(0.5);
    expect(button.container.getLocalBounds()).toMatchObject({ width: 60, height: 80 });
    button.destroy();
  });

  it('stops propagation before synchronous activation and supports disabling and re-enabling', () => {
    const event = new FederatedPointerEvent(new EventBoundary());
    const activate = vi.fn<() => void>(() => expect(event.propagationStopped).toBe(true));
    const button = createButton({ content: new Container(), onActivate: activate, enabled: false });

    expect(button.container.eventMode).toBe('none');
    button.container.emit('pointertap', event);
    expect(activate).not.toHaveBeenCalled();
    button.setEnabled(true);
    expect(button.container.cursor).toBe('pointer');
    button.container.emit('pointertap', event);
    expect(activate).toHaveBeenCalledOnce();
    button.setEnabled(false);
    expect(button.container.visible).toBe(true);
    button.container.emit('pointertap', event);
    expect(activate).toHaveBeenCalledOnce();
    button.destroy();
  });

  it('releases listeners and owned content without destroying textures', () => {
    const content = new Sprite(Texture.EMPTY);
    const button = createButton({ content, onActivate: vi.fn<() => void>() });
    button.destroy();

    expect(content.destroyed).toBe(true);
    expect(button.container.listenerCount('pointertap')).toBe(0);
    expect(Texture.EMPTY.destroyed).toBe(false);
    expect(() => button.destroy()).not.toThrow();
    expect(() => button.setEnabled(true)).not.toThrow();
  });
});
