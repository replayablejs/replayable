import { createAdapter } from '#selected-adapter';

import { registerHost } from '../internal-scope.js';

/** Registers the profile-selected host before the authored application evaluates. */
registerHost(createAdapter());
