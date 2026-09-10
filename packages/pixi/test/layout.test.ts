import { Bounds, Container } from 'pixi.js';
import { describe, expect, it, vi } from 'vitest';

import { createLayout } from '../src/layout/create-layout.js';
import { resolveLayout } from '../src/layout/resolve-layout.js';
import type { LayoutAlignment, LayoutConfig, LayoutScaleMode } from '../src/types/layout.js';

const layoutBounds = { x: 100, y: 200, width: 800, height: 600 };
const normalizedBounds = { x: 0.25, y: 0.5, width: 0.5, height: 0.25 };

function createConfig(overrides: Partial<LayoutConfig['areas'][string]> = {}): LayoutConfig {
  return {
    bounds: layoutBounds,
    areas: {
      content: {
        bounds: normalizedBounds,
        ...overrides,
      },
    },
  };
}

function createContent(x = 0, y = 0, width = 100, height = 50): Container {
  const content = new Container();

  vi.spyOn(content, 'getLocalBounds').mockReturnValue(new Bounds(x, y, x + width, y + height));
  return content;
}

describe('layout resolution', () => {
  it('resolves normalized bounds and defaults into an immutable snapshot', () => {
    const area = resolveLayout(createConfig()).get('content');

    expect(area).toEqual({
      name: 'content',
      bounds: { x: 300, y: 500, width: 400, height: 150 },
      align: 'center',
      scale: 'fit',
      offset: { x: 0, y: 0 },
    });
    expect(Object.isFrozen(area)).toBe(true);
    expect(Object.isFrozen(area?.bounds)).toBe(true);
    expect(Object.isFrozen(area?.offset)).toBe(true);
  });

  it('preserves explicit placement values without moving the resolved area', () => {
    const area = resolveLayout(
      createConfig({
        align: 'bottom-right',
        offset: { x: 12, y: -8 },
        scale: 'cover',
      }),
    ).get('content');

    expect(area).toMatchObject({
      bounds: { x: 300, y: 500, width: 400, height: 150 },
      align: 'bottom-right',
      scale: 'cover',
      offset: { x: 12, y: -8 },
    });
  });

  it.each([
    [{ x: 0, y: 0, width: 0, height: 10 }, 'greater than zero'],
    [{ x: 0, y: 0, width: 10, height: -1 }, 'greater than zero'],
    [{ x: Number.NaN, y: 0, width: 10, height: 10 }, 'finite number'],
  ])('rejects invalid top-level bounds', (bounds, message) => {
    expect(() => resolveLayout({ bounds, areas: {} })).toThrow(message);
  });

  it('rejects invalid area geometry, offsets, and empty names', () => {
    expect(() =>
      resolveLayout(createConfig({ bounds: { x: 0, y: 0, width: -1, height: 1 } })),
    ).toThrow('must not be negative');
    expect(() => resolveLayout(createConfig({ offset: { x: Infinity, y: 0 } }))).toThrow(
      'must be a finite number',
    );
    expect(() =>
      resolveLayout({
        bounds: layoutBounds,
        areas: { ' ': { bounds: normalizedBounds } },
      }),
    ).toThrow('names must not be empty');
  });
});

describe('layout placement', () => {
  const alignments: ReadonlyArray<readonly [LayoutAlignment, readonly [x: number, y: number]]> = [
    ['top-left', [300, 500]],
    ['top-center', [450, 500]],
    ['top-right', [600, 500]],
    ['center-left', [300, 550]],
    ['center', [450, 550]],
    ['center-right', [600, 550]],
    ['bottom-left', [300, 600]],
    ['bottom-center', [450, 600]],
    ['bottom-right', [600, 600]],
  ];

  it.each(alignments)('applies %s alignment', (align, [x, y]) => {
    const layout = createLayout(createConfig({ align, scale: 'none' }));
    const content = createContent();

    layout.attach('content', content);

    expect(content.position).toMatchObject({ x, y });
  });

  it.each([
    ['none', 2, 3],
    ['fit', 1, 1],
    ['contain', 3, 3],
    ['cover', 4, 4],
    ['stretch', 4, 3],
  ] satisfies ReadonlyArray<readonly [LayoutScaleMode, number, number]>)(
    'applies %s scaling',
    (scale, x, y) => {
      const layout = createLayout(createConfig({ scale }));
      const content = createContent();

      content.scale.set(2, 3);
      layout.attach('content', content);

      expect(content.scale).toMatchObject({ x, y });
    },
  );

  it('accounts for bounds origins, pivots, offsets, and preserved negative scale', () => {
    const layout = createLayout(
      createConfig({ align: 'top-left', offset: { x: 7, y: -3 }, scale: 'none' }),
    );
    const content = createContent(10, 20, 100, 50);

    content.pivot.set(5, 8);
    content.scale.set(-2, 3);
    layout.attach('content', content);

    expect(content.scale).toMatchObject({ x: -2, y: 3 });
    expect(content.position).toMatchObject({ x: 517, y: 461 });
  });

  it('rejects zero-sized content for scaling modes but permits it for none', () => {
    const scaledLayout = createLayout(createConfig({ scale: 'contain' }));
    const unscaledLayout = createLayout(createConfig({ scale: 'none' }));

    expect(() => scaledLayout.attach('content', createContent(0, 0, 0, 10))).toThrow(
      'zero-sized content',
    );
    expect(() => unscaledLayout.attach('content', createContent(0, 0, 0, 0))).not.toThrow();
  });
});

describe('layout ownership', () => {
  it('attaches content directly without hidden wrappers', () => {
    const layout = createLayout(createConfig());
    const content = createContent();

    layout.attach('content', content);

    expect(layout.container.children).toEqual([content]);
    expect(content.parent).toBe(layout.container);
    expect(() => layout.attach('content', content)).toThrow('Use move() instead');
  });

  it('validates an area before reparenting content', () => {
    const originalParent = new Container();
    const content = createContent();
    const layout = createLayout(createConfig());

    originalParent.addChild(content);

    expect(() => layout.attach('missing', content)).toThrow('does not exist');
    expect(content.parent).toBe(originalParent);
  });

  it('moves and detaches attached content', () => {
    const layout = createLayout({
      bounds: layoutBounds,
      areas: {
        left: { bounds: { x: 0, y: 0, width: 0.5, height: 1 }, scale: 'none' },
        right: { bounds: { x: 0.5, y: 0, width: 0.5, height: 1 }, scale: 'none' },
      },
    });
    const content = createContent();

    layout.attach('left', content);
    const leftX = content.x;
    layout.move(content, 'right');

    expect(content.x).toBeGreaterThan(leftX);
    expect(content.parent).toBe(layout.container);

    layout.detach(content);
    expect(content.parent).toBeNull();
    expect(() => layout.detach(content)).toThrow('not attached');
  });

  it('forgets destroyed content and rejects cyclic attachment', () => {
    const layout = createLayout(createConfig());
    const content = createContent();
    const ancestor = new Container();

    ancestor.addChild(layout.container);
    expect(() => layout.attach('content', ancestor)).toThrow('ancestors');

    layout.attach('content', content);
    content.destroy();
    expect(() => layout.detach(content)).toThrow('not attached');
  });

  it('updates all content atomically and rejects removal of an occupied area', () => {
    const layout = createLayout(createConfig({ scale: 'none' }));
    const first = createContent();
    const second = createContent(0, 0, 0, 10);

    layout.attach('content', first);
    layout.attach('content', second);
    const originalX = first.x;

    expect(() =>
      layout.update(createConfig({ bounds: normalizedBounds, scale: 'contain' })),
    ).toThrow('zero-sized content');
    expect(first.x).toBe(originalX);
    expect(layout.getArea('content')?.bounds).toEqual({
      x: 300,
      y: 500,
      width: 400,
      height: 150,
    });

    expect(() => layout.update({ bounds: layoutBounds, areas: {} })).toThrow(
      'Cannot remove occupied layout area',
    );
  });

  it('rejects externally reparented content while still allowing it to detach', () => {
    const layout = createLayout(createConfig());
    const content = createContent();
    const otherParent = new Container();

    layout.attach('content', content);
    otherParent.addChild(content);

    expect(() => layout.move(content, 'content')).toThrow('reparented outside');
    expect(() => layout.update(createConfig())).toThrow('reparented outside');
    expect(() => layout.detach(content)).not.toThrow();
    expect(content.parent).toBe(otherParent);
  });

  it('destroys idempotently without destroying consumer content', () => {
    const layout = createLayout(createConfig());
    const content = createContent();

    layout.attach('content', content);
    layout.destroy();
    layout.destroy();

    expect(layout.container.destroyed).toBe(true);
    expect(content.destroyed).toBe(false);
    expect(content.parent).toBeNull();
    expect(() => layout.getArea('content')).toThrow('destroyed Replayable layout');
  });
});
