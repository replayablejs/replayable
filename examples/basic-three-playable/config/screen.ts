import type { ReplayableScreenInput } from '@replayablejs/config';

export default {
  orientations: {
    portrait: {
      enabled: true,
      width: 700,
      height: 1400,
      ratio: { min: 0.44, max: 0.76 },
    },
    landscape: {
      enabled: true,
      width: 1400,
      height: 700,
      ratio: { min: 1.32, max: 2.4 },
    },
  },
  resolution: {
    pixelRatio: { min: 1, max: 2 },
    renderScale: {
      minimal: 0.55,
      reduced: 0.65,
      balanced: 0.85,
      full: 1,
    },
  },
} satisfies ReplayableScreenInput;
