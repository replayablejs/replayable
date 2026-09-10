import type { ReplayableParamsInput } from '@replayablejs/config';

/** Presentation choices; runtime configuration owns completion, audio, and control policy. */
export default {
  tutorial: {
    type: 'boolean',
    default: true,
    description: 'Shows the animated scroll tutorial until gameplay input or its timeout.',
  },
  tutorialDuration: {
    type: 'number',
    default: 5,
    description: 'Seconds before the tutorial closes automatically.',
    range: { min: 2, max: 15, step: 1 },
    when: { param: 'tutorial', equals: true },
  },
  tutorialLabel: {
    type: 'string',
    default: 'Tutorial Text',
    description: 'Localized phrase displayed on the tutorial scroll.',
    options: ['Tutorial Text', 'Other Tutorial Text'],
    when: { param: 'tutorial', equals: true },
  },
  hint: {
    type: 'boolean',
    default: true,
    description: 'Shows an animated hand over an unopened card after inactivity.',
  },
  hintDelay: {
    type: 'number',
    default: 2,
    description: 'Seconds of inactivity before the hand hint appears.',
    range: { min: 2, max: 5, step: 1 },
    when: { param: 'hint', equals: true },
  },
  persistentCtaLabel: {
    type: 'string',
    default: 'cta_btn_persistent_text',
    description: 'Localized phrase for the persistent CTA when runtime policy permits it.',
    options: ['cta_btn_persistent_text', 'Play Now', 'Download Now'],
  },
  endCardLabel: {
    type: 'string',
    default: 'Continue',
    description: 'Localized phrase displayed on the endcard primary CTA.',
    options: ['Play Now', 'Continue', 'Download Now', 'PLAY NOW'],
  },
} satisfies ReplayableParamsInput;
