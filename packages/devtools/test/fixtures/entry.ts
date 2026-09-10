import { createStats } from '../../src/index.js';

// Keep the controls live so production verification cannot pass by dropping
// an entirely unused import. Consumers do not need their own DEV guard.
export const stats = createStats();
