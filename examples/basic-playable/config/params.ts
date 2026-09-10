import type { ReplayableParamsInput } from '@replayablejs/config';

export default {
  persistentCtaLabel: {
    type: 'string',
    default: 'playFree',
    description: 'Localized phrase used by the persistent CTA.',
    options: ['playFree', 'playNow', 'install'],
  },
  startMuted: {
    type: 'boolean',
    default: false,
    description: 'Starts runtime audio muted.',
  },
  tutorial: {
    type: 'boolean',
    default: true,
    description: 'Shows gesture guidance beneath the letter wheel.',
  },
  tutorialLabel: {
    type: 'string',
    default: 'swipeToFindWords',
    description: 'Localized phrase used by the letter-wheel tutorial.',
    options: ['swipeToFindWords', 'connectLetters', 'traceToMakeWords'],
    when: { param: 'tutorial', equals: true },
  },
  hint: {
    type: 'boolean',
    default: true,
    description: 'Shows sequential letter hints after inactivity.',
  },
  hintDelay: {
    type: 'number',
    default: 4,
    description: 'Seconds of inactivity before the letter-wheel hint appears.',
    range: { min: 2, max: 8, step: 1 },
    when: { param: 'hint', equals: true },
  },
} satisfies ReplayableParamsInput;
