import { expect, it } from 'vitest';

import { createStatsRange } from '../src/stats/measurement/create-stats-range.js';

it('starts empty, ignores invalid measurements, and includes valid zero', () => {
  const range = createStatsRange();
  for (const value of [NaN, Infinity, -Infinity, -1]) {
    range.observe(value);
  }
  expect(range.current).toBeUndefined();
  range.observe(10);
  const previous = range.current;
  range.observe(0);
  range.observe(20);
  range.observe(5);
  expect(range.current).toEqual({ min: 0, max: 20 });
  expect(previous).toEqual({ min: 10, max: 10 });
  expect(createStatsRange().current).toBeUndefined();
});
