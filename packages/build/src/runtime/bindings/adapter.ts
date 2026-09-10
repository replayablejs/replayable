import { requireHost } from '../internal-scope.js';

/** Supplies the registered host through the runtime's private `#adapter` contract. */
export function createAdapter(): object {
  return requireHost();
}
