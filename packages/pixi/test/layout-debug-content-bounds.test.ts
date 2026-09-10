import { Bounds, Container } from 'pixi.js';
import { describe, expect, it, vi } from 'vitest';

import { resolveContentBounds } from '../src/layout/debug/resolve-content-bounds.js';

describe('layout debug content bounds', () => {
  it('measures applied placement with bounds origins, pivots, and negative scale', () => {
    const content = new Container();

    vi.spyOn(content, 'getLocalBounds').mockReturnValue(new Bounds(10, 20, 110, 70));
    content.position.set(517, 461);
    content.pivot.set(5, 8);
    content.scale.set(-2, 3);

    expect(resolveContentBounds(content)).toEqual({
      x: 307,
      y: 497,
      width: 200,
      height: 150,
    });
  });
});
