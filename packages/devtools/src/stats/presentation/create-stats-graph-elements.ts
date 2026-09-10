import type { StatsGraphElements } from '#types/graph-elements.js';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

/** Creates an unmounted decorative SVG with its filled area behind the line. */
export function createStatsGraphElements(width: number, height: number): StatsGraphElements {
  const root = document.createElementNS(SVG_NAMESPACE, 'svg');
  root.setAttribute('viewBox', `0 0 ${width} ${height}`);
  root.setAttribute('aria-hidden', 'true');
  root.classList.add('replayable-stats__graph');

  const fill = document.createElementNS(SVG_NAMESPACE, 'path');
  fill.classList.add('replayable-stats__graph-area');

  const stroke = document.createElementNS(SVG_NAMESPACE, 'path');
  stroke.classList.add('replayable-stats__graph-line');
  stroke.setAttribute('fill', 'none');

  root.append(fill, stroke);

  return { root, fill, stroke };
}
