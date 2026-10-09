import type { ReplayableParamsInput } from '@replayablejs/config';

export default {
  hint: {
    label: 'Show hints',
    type: 'boolean',
    default: true,
    info: 'Pulses an empty plot outline after inactivity.',
  },
  hintDelay: {
    label: 'Hint delay',
    type: 'range',
    default: 4,
    info: 'Seconds of inactivity before an empty plot pulses.',
    min: 2,
    max: 8,
    step: 1,
    when: { param: 'hint', equals: true },
  },
  buildingsToEndcard: {
    label: 'Buildings to endcard',
    type: 'range',
    default: 3,
    info: 'Buildings to place before the end card appears.',
    min: 1,
    max: 3,
    step: 1,
  },
} satisfies ReplayableParamsInput;
