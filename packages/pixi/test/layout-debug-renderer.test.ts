import { Container, Graphics, Text } from 'pixi.js';
import { describe, expect, it } from 'vitest';

import { createLayoutDebugRenderer } from '../src/layout/debug/create-layout-debug-renderer.js';
import type { DebugLayoutInspection } from '../src/types/layout-debug.js';

const inspection: DebugLayoutInspection = {
  bounds: { x: 0, y: 0, width: 100, height: 80 },
  options: {
    areaBounds: true,
    contentBounds: true,
    labels: { areas: true, content: true, layout: true },
    layoutBounds: true,
  },
  areas: [
    {
      align: 'center',
      bounds: { x: 10, y: 10, width: 80, height: 60 },
      contentBounds: [{ x: 30, y: 25, width: 40, height: 30 }],
      name: 'game',
      occupied: true,
      offset: { x: 0, y: 0 },
      scale: 'contain',
    },
  ],
};

describe('layout debug renderer', () => {
  it('renders an inspection into one non-interactive overlay', () => {
    const container = new Container();
    const { render } = createLayoutDebugRenderer(container);

    render(inspection);

    const overlay = container.children[0];
    expect(overlay).toBeInstanceOf(Container);
    expect(overlay).toMatchObject({ eventMode: 'none', measurable: false, visible: true });
    expect(overlay?.children).toHaveLength(4);
    expect(overlay?.children[0]).toBeInstanceOf(Graphics);
    const layoutLabel = overlay?.children[1];
    const areaLabel = overlay?.children[2];
    const contentLabel = overlay?.children[3];

    expect(layoutLabel).toBeInstanceOf(Text);
    expect(areaLabel).toBeInstanceOf(Text);
    expect(contentLabel).toBeInstanceOf(Text);

    if (
      !(layoutLabel instanceof Text) ||
      !(areaLabel instanceof Text) ||
      !(contentLabel instanceof Text)
    ) {
      throw new Error('Expected layout diagnostics to render Pixi text labels.');
    }

    expect(layoutLabel.text).toBe('100 × 80');
    expect(areaLabel.text).toBe('80 × 60');
    expect(contentLabel.text).toBe('40 × 30');
    expect(layoutLabel.style.fontSize).toBe(8);
    expect(areaLabel.style.fontSize).toBe(8);
    expect(contentLabel.style.fontSize).toBe(8);
    expect(contentLabel.anchor).toMatchObject({ x: 1, y: 1 });
    expect(contentLabel.position).toMatchObject({ x: 66, y: 52 });
  });

  it('clears and removes the overlay when diagnostics are disabled', () => {
    const container = new Container();
    const { render } = createLayoutDebugRenderer(container);

    render(inspection);
    render(undefined);

    expect(container.children).toHaveLength(0);
  });

  it('moves the overlay above content after every inspection', () => {
    const container = new Container();
    const { render } = createLayoutDebugRenderer(container);
    const content = new Container();

    container.addChild(content);
    render(inspection);

    expect(container.children.at(-1)?.label).toBe('Replayable layout debugger');
  });

  it('renders content labels independently from outlines and other labels', () => {
    const container = new Container();
    const { render } = createLayoutDebugRenderer(container);

    render({
      ...inspection,
      options: {
        areaBounds: false,
        contentBounds: false,
        labels: { areas: false, content: true, layout: false },
        layoutBounds: false,
      },
    });

    const overlay = container.children[0];
    expect(overlay?.children).toHaveLength(2);
    expect(overlay?.children[0]).toBeInstanceOf(Graphics);

    const contentLabel = overlay?.children[1];
    expect(contentLabel).toBeInstanceOf(Text);

    if (!(contentLabel instanceof Text)) {
      throw new Error('Expected content diagnostics to render a Pixi text label.');
    }

    expect(contentLabel.text).toBe('40 × 30');
  });

  it('does not contribute diagnostics to container bounds', () => {
    const container = new Container();
    const content = new Graphics().rect(10, 20, 30, 40).fill(0xffffff);
    const renderer = createLayoutDebugRenderer(container);

    container.addChild(content);
    const boundsBeforeDebugging = container.getLocalBounds();
    renderer.render(inspection);
    const boundsAfterDebugging = container.getLocalBounds();

    expect(boundsAfterDebugging).toMatchObject({
      minX: boundsBeforeDebugging.minX,
      minY: boundsBeforeDebugging.minY,
      maxX: boundsBeforeDebugging.maxX,
      maxY: boundsBeforeDebugging.maxY,
    });
  });

  it('destroys every owned Pixi object', () => {
    const container = new Container();
    const renderer = createLayoutDebugRenderer(container);

    renderer.render(inspection);
    const overlay = container.children[0];
    const children = [...(overlay?.children ?? [])];
    renderer.destroy();

    expect(container.children).toHaveLength(0);
    expect(overlay?.destroyed).toBe(true);
    expect(children.every((child) => child.destroyed)).toBe(true);
  });
});
