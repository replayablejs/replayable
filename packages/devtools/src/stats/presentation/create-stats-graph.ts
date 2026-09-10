import { scaleLinear } from 'd3-scale';
import { area, line } from 'd3-shape';

import type { StatsGraph } from '#types/graph.js';

import { createStatsGraphElements } from './create-stats-graph-elements.js';

/** Cards retain exactly as many refresh observations as the graph has X slots. */
export const STATS_HISTORY_LENGTH = 60;

const GRAPH_WIDTH = 96;
const GRAPH_HEIGHT = 56;
const GRAPH_INSET = 2;

/**
 * Creates one reusable line and filled area. D3 only calculates
 * paths and coordinates; it does not manage DOM, transitions, or a frame loop.
 *
 * Observe samples before rendering. Keeping observation separate lets compact
 * cards remember peaks without redrawing hidden graphs on every refresh.
 */
export function createStatsGraph(initialCeiling: number): StatsGraph {
  const elements = createStatsGraphElements(GRAPH_WIDTH, GRAPH_HEIGHT);
  let ceiling = initialCeiling;

  // A short history occupies the rightmost slots instead of stretching across
  // the card. The newest sample always ends at the same right-hand position.
  const xScale = scaleLinear()
    .domain([0, STATS_HISTORY_LENGTH - 1])
    .range([GRAPH_INSET, GRAPH_WIDTH - GRAPH_INSET]);
  // SVG Y coordinates increase downward. Reverse the pixel range so zero sits
  // at the bottom and larger values rise toward the top, inside the graph inset.
  const yScale = scaleLinear()
    .domain([0, ceiling])
    .range([GRAPH_HEIGHT - GRAPH_INSET, GRAPH_INSET]);
  const linePath = line<number>().y((value) => yScale(value));
  const areaPath = area<number>()
    .y0(yScale(0))
    .y1((value) => yScale(value));

  return {
    element: elements.root,
    get ceiling(): number {
      return ceiling;
    },
    observe,
    render,
  };

  /** Grows the scale for new peaks without redrawing a potentially hidden graph. */
  function observe(value: number): void {
    // Grow by powers of two, never shrink. A disappearing spike or a cleared
    // history must not make ordinary values look larger on the next refresh.
    while (value > ceiling) {
      ceiling *= 2;
    }
  }

  /** Updates existing paths from recorded history; fewer than two samples draw no trace. */
  function render(history: readonly number[]): void {
    yScale.domain([0, ceiling]);
    if (history.length < 2) {
      elements.fill.removeAttribute('d');
      elements.stroke.removeAttribute('d');
      return;
    }

    const firstSlot = STATS_HISTORY_LENGTH - history.length;
    linePath.x((_value, index) => xScale(firstSlot + index));
    areaPath.x((_value, index) => xScale(firstSlot + index));
    // D3 defaults to straight segments. No smoothing that could invent peaks,
    // and no transitions that would add work or lag behind the observations.
    elements.stroke.setAttribute('d', linePath(history) ?? '');
    elements.fill.setAttribute('d', areaPath(history) ?? '');
  }
}
