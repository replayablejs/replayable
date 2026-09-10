import { createStats } from '@replayablejs/devtools';

// Exercise the package export, including tsdown's output and inlined stylesheet.
// Keep controls live so an unused import cannot make exclusion pass accidentally.
export const stats = createStats();
