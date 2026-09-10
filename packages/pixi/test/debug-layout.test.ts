import { Container, Graphics } from 'pixi.js';
import { describe, expect, it, vi } from 'vitest';

import { createCoreLayout } from '../src/layout/create-layout.js';
import { createDebugLayout } from '../src/layout/debug/create-debug-layout.js';
import type { DebugLayoutInspection, LayoutDebugRenderer } from '../src/types/layout-debug.js';
import type { LayoutConfig } from '../src/types/layout.js';

function createConfig(width = 100): LayoutConfig {
  return {
    bounds: { x: 0, y: 0, width, height: 100 },
    debug: true,
    areas: {
      left: {
        align: 'top-left',
        bounds: { x: 0, y: 0, width: 0.5, height: 1 },
        scale: 'none',
      },
      right: {
        align: 'top-left',
        bounds: { x: 0.5, y: 0, width: 0.5, height: 1 },
        scale: 'none',
      },
    },
  };
}

describe('debug layout decorator', () => {
  it('transparently delegates the complete layout lifecycle', () => {
    const coreLayout = createCoreLayout(createConfig());
    const layout = createDebugLayout(coreLayout, createConfig(), createRenderer());
    const content = new Container();

    expect(layout).not.toBe(coreLayout);
    expect(layout.container).toBe(coreLayout.container);

    layout.attach('left', content);
    expect(content.parent).toBe(layout.container);

    layout.move(content, 'right');
    expect(content.x).toBe(50);
    expect(layout.getArea('right')?.bounds.x).toBe(50);

    layout.update(createConfig(200));
    expect(content.x).toBe(100);

    layout.detach(content);
    expect(content.parent).toBeNull();

    layout.destroy();
    expect(layout.container.destroyed).toBe(true);
  });

  it('preserves delegated failures without applying another operation', () => {
    const renderer = createRenderer();
    const layout = createDebugLayout(createCoreLayout(createConfig()), createConfig(), renderer);
    const content = new Container();

    expect(renderer.render).toHaveBeenCalledTimes(1);
    expect(() => layout.attach('missing', content)).toThrow('does not exist');
    expect(content.parent).toBeNull();
    expect(() => layout.move(content, 'right')).toThrow('not attached');
    expect(renderer.render).toHaveBeenCalledTimes(1);
  });

  it('tracks exact calculated content bounds across successful mutations', () => {
    const inspections: DebugLayoutInspection[] = [];
    const initialConfig = createConfig();
    const layout = createDebugLayout(
      createCoreLayout(initialConfig),
      initialConfig,
      createRenderer((inspection) => {
        if (inspection !== undefined) {
          inspections.push(inspection);
        }
      }),
    );
    const content = new Graphics().rect(0, 0, 20, 10).fill(0xffffff);

    expect(inspections.at(-1)?.areas).toEqual([
      expect.objectContaining({ name: 'left', occupied: false, contentBounds: [] }),
      expect.objectContaining({ name: 'right', occupied: false, contentBounds: [] }),
    ]);

    layout.attach('left', content);
    expect(inspections.at(-1)?.areas[0]).toEqual(
      expect.objectContaining({
        name: 'left',
        occupied: true,
        contentBounds: [{ x: 0, y: 0, width: 20, height: 10 }],
      }),
    );

    layout.move(content, 'right');
    expect(inspections.at(-1)?.areas).toEqual([
      expect.objectContaining({ name: 'left', occupied: false, contentBounds: [] }),
      expect.objectContaining({
        name: 'right',
        occupied: true,
        contentBounds: [{ x: 50, y: 0, width: 20, height: 10 }],
      }),
    ]);

    const nextConfig = {
      ...createConfig(200),
      debug: { contentBounds: true, labels: false },
    } as const;
    layout.update(nextConfig);
    expect(inspections.at(-1)).toEqual(
      expect.objectContaining({
        bounds: nextConfig.bounds,
        options: {
          areaBounds: true,
          contentBounds: true,
          labels: { areas: false, content: false, layout: false },
          layoutBounds: true,
        },
      }),
    );
    expect(inspections.at(-1)?.areas[1]?.contentBounds).toEqual([
      { x: 100, y: 0, width: 20, height: 10 },
    ]);

    layout.detach(content);
    expect(inspections.at(-1)?.areas[1]).toEqual(
      expect.objectContaining({ occupied: false, contentBounds: [] }),
    );
  });

  it('forgets content destroyed outside the layout', () => {
    const inspections: DebugLayoutInspection[] = [];
    const config = createConfig();
    const layout = createDebugLayout(
      createCoreLayout(config),
      config,
      createRenderer((inspection) => {
        if (inspection !== undefined) {
          inspections.push(inspection);
        }
      }),
    );
    const content = new Container();

    layout.attach('left', content);
    content.destroy();

    expect(inspections.at(-1)?.areas[0]).toEqual(
      expect.objectContaining({ occupied: false, contentBounds: [] }),
    );
  });

  it('uses undefined to clear disabled diagnostics', () => {
    const renderer = createRenderer();
    const disabledConfig = { ...createConfig(), debug: false } as const;
    const layout = createDebugLayout(createCoreLayout(disabledConfig), disabledConfig, renderer);

    expect(renderer.render).toHaveBeenLastCalledWith(undefined);

    layout.update(createConfig());
    expect(renderer.render).toHaveBeenLastCalledWith(
      expect.objectContaining({
        options: {
          areaBounds: true,
          contentBounds: true,
          labels: { areas: true, content: true, layout: true },
          layoutBounds: true,
        },
      }),
    );

    const enabledConfig = createConfig();
    layout.update({ bounds: enabledConfig.bounds, areas: enabledConfig.areas });
    expect(renderer.render).toHaveBeenLastCalledWith(undefined);
  });

  it('does not measure debug bounds when content diagnostics are disabled', () => {
    const config = {
      ...createConfig(),
      debug: { contentBounds: false, labels: { content: false } },
    } as const;
    const renderer = createRenderer();
    const layout = createDebugLayout(createCoreLayout(config), config, renderer);
    const content = new Graphics().rect(0, 0, 20, 10).fill(0xffffff);
    const getLocalBounds = vi.spyOn(content, 'getLocalBounds');

    layout.attach('left', content);

    expect(getLocalBounds).toHaveBeenCalledTimes(1);
    expect(renderer.render).toHaveBeenLastCalledWith(
      expect.objectContaining({
        areas: expect.arrayContaining([
          expect.objectContaining({ name: 'left', occupied: true, contentBounds: [] }),
        ]),
      }),
    );
  });

  it('destroys its renderer exactly once', () => {
    const renderer = createRenderer();
    const layout = createDebugLayout(createCoreLayout(createConfig()), createConfig(), renderer);

    layout.destroy();
    layout.destroy();

    expect(renderer.destroy).toHaveBeenCalledTimes(1);
  });
});

function createRenderer(
  render: LayoutDebugRenderer['render'] = vi.fn<LayoutDebugRenderer['render']>(),
): LayoutDebugRenderer {
  return { destroy: vi.fn<LayoutDebugRenderer['destroy']>(), render };
}
