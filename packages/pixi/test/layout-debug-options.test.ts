import { describe, expect, it } from 'vitest';

import { resolveLayoutDebugOptions } from '../src/layout/debug/resolve-layout-debug-options.js';

const allDiagnostics = {
  areaBounds: true,
  contentBounds: true,
  labels: { areas: true, content: true, layout: true },
  layoutBounds: true,
};

describe('layout debug options', () => {
  it.each([undefined, false])('disables diagnostics for %s', (debug) => {
    expect(resolveLayoutDebugOptions(debug)).toBeUndefined();
  });

  it('enables every diagnostic for the boolean shorthand', () => {
    expect(resolveLayoutDebugOptions(true)).toEqual(allDiagnostics);
  });

  it('lets selective options disable individual diagnostics', () => {
    expect(resolveLayoutDebugOptions({ labels: false, contentBounds: false })).toEqual({
      ...allDiagnostics,
      contentBounds: false,
      labels: { areas: false, content: false, layout: false },
    });
  });

  it('lets each label category be configured independently', () => {
    expect(resolveLayoutDebugOptions({ labels: { areas: false, content: true } })).toEqual({
      ...allDiagnostics,
      labels: { areas: false, content: true, layout: true },
    });
  });
});
