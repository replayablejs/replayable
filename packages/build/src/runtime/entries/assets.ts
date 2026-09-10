import { assets } from '#generated-assets';

import { registerAssets } from '../internal-scope.js';

/** Registers generated assets before the authored application evaluates. */
registerAssets(assets);
