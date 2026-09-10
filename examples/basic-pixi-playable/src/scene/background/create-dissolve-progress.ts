import type { DissolveProgress } from '../../types/background';

/** Tracks one dissolve's midpoint without knowing about Pixi, filters, or rendering. */
export function createDissolveProgress(): DissolveProgress {
  let settled = false;
  let resolveMidpoint: (() => void) | undefined;
  let rejectMidpoint: ((reason: DOMException) => void) | undefined;
  const midpoint = new Promise<void>((resolve, reject) => {
    resolveMidpoint = resolve;
    rejectMidpoint = reject;
  });

  return { midpoint, update, cancel };

  /** Resolve once when progress reaches or skips past halfway. */
  function update(value: number): void {
    if (settled || value < 0.5) {
      return;
    }
    settled = true;
    resolveMidpoint?.();
  }

  /** Stop a waiting scene; cancellation after the midpoint cannot undo its resolution. */
  function cancel(): void {
    if (settled) {
      return;
    }
    settled = true;
    rejectMidpoint?.(new DOMException('Background was destroyed.', 'AbortError'));
  }
}
