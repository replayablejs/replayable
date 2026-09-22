import type { ReplayableParamsInput } from '@replayablejs/config';

export default {
  hint: {
    type: 'boolean',
    default: true,
    description: 'Pulses an empty plot outline after inactivity.',
  },
  hintDelay: {
    type: 'number',
    default: 4,
    description: 'Seconds of inactivity before an empty plot pulses.',
    range: { min: 2, max: 8, step: 1 },
    when: { param: 'hint', equals: true },
  },
  buildingsToEndcard: {
    type: 'number',
    default: 3,
    description: 'Buildings to place before the end card appears.',
    range: { min: 1, max: 3, step: 1 },
  },
} satisfies ReplayableParamsInput;
