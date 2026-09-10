/**
 * Optional renderer-independent development tools for Replayable playables.
 *
 * Tools allocate subscriptions and DOM only when explicitly created after
 * await playable.ready(). The build pipeline selects disabled entries for production.
 *
 * @packageDocumentation
 */

import { createEndCardTrigger as selectedCreateEndCardTrigger } from '#endcard-trigger';
import { createSoundControl as selectedCreateSoundControl } from '#sound-control';
import { createStats as selectedCreateStats } from '#stats';
import type { EndCardTrigger } from '#types/end-card-trigger.js';
import type { SoundControl } from '#types/sound-control.js';
import type { Stats } from '#types/stats.js';

// Explicit public signatures keep build-only selection aliases out of emitted declarations.
// The selected function references remain unchanged, preserving production tree-shaking.
/** Creates development stats after playable readiness. */
export const createStats: () => Stats = selectedCreateStats;
/** Creates the optional development endcard trigger. */
export const createEndCardTrigger: () => EndCardTrigger = selectedCreateEndCardTrigger;
/** Creates the optional development sound control. */
export const createSoundControl: () => SoundControl = selectedCreateSoundControl;
export type { SoundControl, EndCardTrigger, Stats };
