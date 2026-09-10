import { Container, Graphics, Text } from 'pixi.js';

import type { DebugLayoutInspection, LayoutDebugRenderer } from '#types/layout-debug.js';
import type { LayoutBounds } from '#types/layout.js';

const AREA_EMPTY_COLOR = '#f2b84b';
const AREA_OCCUPIED_COLOR = '#54d17a';
const CONTENT_BOUNDS_COLOR = '#ef5cdb';
const LAYOUT_BOUNDS_COLOR = '#45d9ef';
const LINE_WIDTH = 2;

/**
 * Creates the visual half of layout diagnostics.
 *
 * This renderer knows nothing about layout mutations or attached content. It
 * simply redraws the latest read-only inspection supplied by the decorator.
 * The overlay is a single non-interactive, non-measurable child of the layout
 * container, so diagnostics share its coordinate space without affecting
 * pointer handling or bounds used by a parent layout.
 */
export function createLayoutDebugRenderer(container: Container): LayoutDebugRenderer {
  const overlay = new Container();
  const outlines = new Graphics();
  const labels: Text[] = [];

  overlay.eventMode = 'none';
  overlay.label = 'Replayable layout debugger';
  // Diagnostics must never change the bounds used when this layout is itself
  // attached as content to another layout.
  overlay.measurable = false;
  overlay.addChild(outlines);

  return { destroy, render };

  /**
   * Replaces the complete overlay with one current inspection.
   *
   * Layout mutations are infrequent, so rebuilding labels is simpler and safer
   * than reconciling display objects. Passing `undefined` removes the overlay
   * entirely, leaving disabled diagnostics with no hidden scene-graph child.
   */
  function render(inspection: DebugLayoutInspection | undefined): void {
    clearOverlay();

    if (inspection === undefined) {
      if (overlay.parent === container) {
        container.removeChild(overlay);
      }

      return;
    }

    const { areas, bounds, options } = inspection;

    if (options.layoutBounds) {
      drawBounds(bounds, LAYOUT_BOUNDS_COLOR);
    }

    if (options.labels.layout) {
      drawLabel(bounds, LAYOUT_BOUNDS_COLOR);
    }

    for (const area of areas) {
      if (options.areaBounds) {
        drawBounds(area.bounds, area.occupied ? AREA_OCCUPIED_COLOR : AREA_EMPTY_COLOR);
      }

      if (options.contentBounds) {
        for (const contentBounds of area.contentBounds) {
          drawBounds(contentBounds, CONTENT_BOUNDS_COLOR);
        }
      }

      if (options.labels.areas) {
        drawLabel(area.bounds, area.occupied ? AREA_OCCUPIED_COLOR : AREA_EMPTY_COLOR);
      }

      if (options.labels.content) {
        for (const contentBounds of area.contentBounds) {
          drawLabel(contentBounds, CONTENT_BOUNDS_COLOR, 'bottom-right');
        }
      }
    }

    // Attaching content adds it after the overlay. Move diagnostics back to the
    // top after every mutation without enabling sortable children on the app.
    container.addChild(overlay);
  }

  /**
   * Releases text, geometry, and container resources owned by this renderer.
   * The decorator guarantees this is called once before core layout destruction.
   */
  function destroy(): void {
    clearOverlay();
    overlay.removeFromParent();
    overlay.destroy({ children: true });
  }

  /** Clears retained vector commands and destroys labels from the previous redraw. */
  function clearOverlay(): void {
    outlines.clear();

    for (const label of labels) {
      label.destroy();
    }

    labels.length = 0;
  }

  /**
   * Appends one pixel-aligned rectangle to the shared Graphics command list.
   * `pixelLine` keeps diagnostic edges crisp across renderer resolutions.
   */
  function drawBounds(bounds: LayoutBounds, color: string): void {
    outlines.rect(bounds.x, bounds.y, bounds.width, bounds.height).stroke({
      color,
      pixelLine: true,
      width: LINE_WIDTH,
    });
  }

  /**
   * Creates a compact label inside a diagnostic rectangle.
   * The label reuses its rectangle's diagnostic color, while a dark stroke
   * preserves readability over arbitrary playable artwork.
   */
  function drawLabel(
    bounds: LayoutBounds,
    color: string,
    placement: 'top-left' | 'bottom-right' = 'top-left',
  ): void {
    const { height, width, x, y } = bounds;
    const label = new Text({
      text: `${formatDimension(width)} × ${formatDimension(height)}`,
      style: {
        fill: color,
        fontFamily: 'monospace',
        fontSize: 8,
        stroke: { color: '#000000', width: 2 },
      },
    });

    label.eventMode = 'none';

    if (placement === 'bottom-right') {
      label.anchor.set(1, 1);
      label.position.set(x + width - 4, y + height - 3);
    } else {
      label.position.set(x + 4, y + 3);
    }

    labels.push(label);
    overlay.addChild(label);
  }
}

/** Keeps integer dimensions compact while making fractional pixels explicit. */
function formatDimension(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
