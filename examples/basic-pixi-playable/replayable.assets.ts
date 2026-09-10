import { defineConfig } from '@replayablejs/assets';

import assets from './config/assets';

export default defineConfig({
  ...assets,
  localization: {
    fallback: 'en',
    language: 'en',
  },
});
