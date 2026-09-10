import { defineConfig } from '@replayablejs/config';

import assets from './config/assets';
import localization from './config/localization';
import params from './config/params';
import screen from './config/screen';
import store from './config/store';

export default defineConfig({
  assets,
  completion: { inactivity: 10, duration: 15 },
  // Used locally and in preview exports; ad networks apply their own control policy.
  controls: { persistentCta: true },
  devtools: { stats: { display: 'compact' }, endCardTrigger: true, soundControl: true },
  localization,
  name: 'basic-pixi-playable',
  networks: {
    preview: {},
    applovin: {},
    meta: {},
    google: {},
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
