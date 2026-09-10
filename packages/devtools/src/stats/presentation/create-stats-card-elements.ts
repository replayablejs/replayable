import type { StatsCardElements } from '#types/card-elements.js';
import type { StatsMetricDefinition } from '#types/metric.js';

/** Builds an unmounted card with its graph behind the label, value, and range. */
export function createStatsCardElements(
  metric: StatsMetricDefinition,
  graph: SVGSVGElement,
): StatsCardElements {
  const root = document.createElement('div');
  root.className = 'replayable-stats__card';
  root.dataset.label = metric.label;
  root.setAttribute('aria-label', metric.label);
  if (metric.description !== '') {
    root.title = metric.description;
  }

  const heading = document.createElement('span');
  heading.className = 'replayable-stats__label';
  heading.textContent = metric.label;

  const value = document.createElement('span');
  value.className = 'replayable-stats__value';
  value.textContent = '—';

  const range = document.createElement('span');
  range.className = 'replayable-stats__range';
  range.hidden = true;

  root.append(graph, heading, value, range);

  return { root, value, range };
}
