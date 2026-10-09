import type { ReplayableParamsInput } from '@replayablejs/config';

export default {
  persistentCtaLabel: {
    label: 'Persistent CTA label',
    type: 'select',
    default: 'playFree',
    info: 'Localized phrase used by the persistent CTA.',
    options: [
      { name: 'Play Free', value: 'playFree' },
      { name: 'Play Now', value: 'playNow' },
      { name: 'Install', value: 'install' },
    ],
  },
  startMuted: {
    label: 'Start muted',
    type: 'boolean',
    default: false,
    info: 'Starts runtime audio muted.',
  },
  tutorial: {
    label: 'Show tutorial',
    type: 'boolean',
    default: true,
    info: 'Shows gesture guidance beneath the letter wheel.',
  },
  tutorialLabel: {
    label: 'Tutorial label',
    type: 'select',
    default: 'swipeToFindWords',
    info: 'Localized phrase used by the letter-wheel tutorial.',
    options: [
      { name: 'Swipe To Find Words', value: 'swipeToFindWords' },
      { name: 'Connect Letters', value: 'connectLetters' },
      { name: 'Trace To Make Words', value: 'traceToMakeWords' },
    ],
    when: { param: 'tutorial', equals: true },
  },
  hint: {
    label: 'Show hints',
    type: 'boolean',
    default: true,
    info: 'Shows sequential letter hints after inactivity.',
  },
  hintDelay: {
    label: 'Hint delay',
    type: 'range',
    default: 4,
    info: 'Seconds of inactivity before the letter-wheel hint appears.',
    min: 2,
    max: 8,
    step: 1,
    when: { param: 'hint', equals: true },
  },
} satisfies ReplayableParamsInput;
