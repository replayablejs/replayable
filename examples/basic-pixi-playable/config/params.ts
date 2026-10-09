import type { ReplayableParamsInput } from '@replayablejs/config';

/** Presentation choices; runtime configuration owns completion, audio, and control policy. */
export default {
  tutorial: {
    label: 'Show tutorial',
    type: 'boolean',
    default: true,
    info: 'Shows the animated scroll tutorial until gameplay input or its timeout.',
  },
  tutorialDuration: {
    label: 'Tutorial duration',
    type: 'range',
    default: 5,
    info: 'Seconds before the tutorial closes automatically.',
    min: 2,
    max: 15,
    step: 1,
    when: { param: 'tutorial', equals: true },
  },
  tutorialLabel: {
    label: 'Tutorial label',
    type: 'select',
    default: 'Tutorial Text',
    info: 'Localized phrase displayed on the tutorial scroll.',
    options: [
      { name: 'Tutorial Text', value: 'Tutorial Text' },
      { name: 'Other Tutorial Text', value: 'Other Tutorial Text' },
    ],
    when: { param: 'tutorial', equals: true },
  },
  hint: {
    label: 'Show hints',
    type: 'boolean',
    default: true,
    info: 'Shows an animated hand over an unopened card after inactivity.',
  },
  hintDelay: {
    label: 'Hint delay',
    type: 'range',
    default: 2,
    info: 'Seconds of inactivity before the hand hint appears.',
    min: 2,
    max: 5,
    step: 1,
    when: { param: 'hint', equals: true },
  },
  persistentCtaLabel: {
    label: 'Persistent CTA label',
    type: 'select',
    default: 'cta_btn_persistent_text',
    info: 'Localized phrase for the persistent CTA when runtime policy permits it.',
    options: [
      { name: 'Cta btn persistent text', value: 'cta_btn_persistent_text' },
      { name: 'Play Now', value: 'Play Now' },
      { name: 'Download Now', value: 'Download Now' },
    ],
  },
  endCardLabel: {
    label: 'Endcard label',
    type: 'select',
    default: 'Continue',
    info: 'Localized phrase displayed on the endcard primary CTA.',
    options: [
      { name: 'Play Now', value: 'Play Now' },
      { name: 'Continue', value: 'Continue' },
      { name: 'Download Now', value: 'Download Now' },
      { name: 'PLAY NOW', value: 'PLAY NOW' },
    ],
  },
} satisfies ReplayableParamsInput;
