import { requireAssets } from '../internal-scope.js';

/** Supplies registered assets through the runtime's private `#assets` contract. */
export const assets = requireAssets();
