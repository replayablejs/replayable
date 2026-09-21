import { defineConfig } from 'oxfmt';

import rootConfig from '../../oxfmt.config.ts';

export default defineConfig({
  ...rootConfig,
  // Preserve the original third-party fixture files and license notices.
  ignorePatterns: ['test/fixtures/models/**'],
});
