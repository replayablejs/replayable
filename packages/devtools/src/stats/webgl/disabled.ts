/** Disabled registration retains no context and installs no listeners or wrappers. */
export function registerWebglContext(): () => void {
  return noop;
}

function noop(): void {}
