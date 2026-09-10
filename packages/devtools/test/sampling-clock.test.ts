import { describe, expect, it, vi } from 'vitest';

import { createStatsSamplingClock } from '../src/stats/measurement/create-stats-sampling-clock.js';

describe('stats sampling clock', () => {
  it('delivers intervals before permitting collection at the deadline', () => {
    const clock = createStatsSamplingClock();
    const intervals: number[] = [];
    const measure = (delta: number): void => {
      intervals.push(delta);
    };

    clock.reset(0);
    expect(clock.advance(0, measure)).toBe(false);
    expect(intervals).toEqual([0]);
    expect(clock.advance(20, measure)).toBe(false);
    expect(clock.advance(499, measure)).toBe(false);
    expect(clock.advance(500, measure)).toBe(true);
    expect(intervals).toEqual([0, 20, 479, 1]);

    expect(clock.advance(520, measure)).toBe(false);
    expect(clock.advance(1000, measure)).toBe(true);
    expect(intervals).toEqual([0, 20, 479, 1, 20, 480]);
  });

  it('refreshes once after a stall and schedules the next deadline from that frame', () => {
    const clock = createStatsSamplingClock();
    const measure = vi.fn<(delta: number) => void>();

    clock.reset(0);
    clock.advance(0, measure);
    expect(clock.advance(5000, measure)).toBe(true);
    expect(measure).toHaveBeenLastCalledWith(5000);
    expect(clock.advance(5000, measure)).toBe(false);
    expect(clock.advance(5499, measure)).toBe(false);
    expect(clock.advance(5500, measure)).toBe(true);
    expect(measure.mock.calls).toEqual([[0], [5000], [499], [1]]);
  });

  it('does not collect an empty window when the first frame arrives late', () => {
    const clock = createStatsSamplingClock();
    const measure = vi.fn<(delta: number) => void>();

    clock.reset(0);
    expect(clock.advance(500, measure)).toBe(false);
    expect(clock.advance(500, measure)).toBe(false);
    expect(measure).toHaveBeenCalledExactlyOnceWith(0);
    expect(clock.advance(999, measure)).toBe(false);
    expect(clock.advance(1000, measure)).toBe(true);
    expect(measure.mock.calls).toEqual([[0], [499], [1]]);
  });

  it('ignores nonpositive intervals and uses the latest timestamp as the baseline', () => {
    const clock = createStatsSamplingClock();
    const measure = vi.fn<(delta: number) => void>();

    clock.reset(0);
    clock.advance(100, measure);
    clock.advance(100, measure);
    clock.advance(90, measure);
    expect(measure).toHaveBeenCalledExactlyOnceWith(0);
    clock.advance(110, measure);
    expect(measure.mock.calls).toEqual([[0], [20]]);
  });

  it('reset discards pending measurements and excludes the visibility gap', () => {
    const clock = createStatsSamplingClock();
    const measure = vi.fn<(delta: number) => void>();

    clock.reset(0);
    clock.advance(0, measure);
    clock.advance(20, measure);
    clock.reset(10_000);
    measure.mockClear();

    expect(clock.advance(10_500, measure)).toBe(false);
    expect(measure).toHaveBeenCalledExactlyOnceWith(0);
    expect(clock.advance(10_520, measure)).toBe(false);
    expect(clock.advance(11_000, measure)).toBe(true);
    expect(measure.mock.calls).toEqual([[0], [20], [480]]);
  });
});
