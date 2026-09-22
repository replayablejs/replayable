import { defineConfig } from '@replayablejs/config';

import assets from './config/assets';
import params from './config/params';
import screen from './config/screen';
import store from './config/store';

export default defineConfig({
  name: 'basic-three-playable',
  assets,
  params,
  localization: { languages: ['en'], fallback: 'en' },
  devtools: { stats: false, endCardTrigger: true },
  networks: {
    preview: {},
    applovin: {},
    meta: {},
    google: { audio: false },
    liftoff: {},
    mintegral: {},
    moloco: {},
    unity: {},
  },
  screen,
  store,
  versions: { default: {} },
});
