import { defineConfig } from '@replayablejs/config';

import assets from './config/assets';
import localization from './config/localization';
import params from './config/params';
import screen from './config/screen';
import store from './config/store';

export default defineConfig({
  assets,
  controls: { persistentCta: true },
  devtools: { stats: { display: 'compact' }, endCardTrigger: true, soundControl: true },
  completion: {
    duration: 30,
    inactivity: 15,
  },
  localization,
  name: 'basic-playable',
  networks: {
    preview: {},
    applovin: {},
    meta: {},
    google: {
      audio: false,
    },
    liftoff: {},
    mintegral: {},
    moloco: {},
    unity: {},
  },
  params,
  screen,
  store,
  versions: {
    default: {},
  },
});
