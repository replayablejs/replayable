import { defineConfig } from 'oxfmt';

import rootConfig from '../../oxfmt.config.ts';

export default defineConfig({
  ...rootConfig,
  ignorePatterns: ['assets/**', 'src/assets/**'],
});
