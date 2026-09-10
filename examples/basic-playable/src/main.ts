import { createStats, createEndCardTrigger, createSoundControl } from '@replayablejs/devtools';
import { playable } from '@replayablejs/runtime';

import { loadImage } from './loaders/load-image';
import { createMainScene } from './scene/create-main-scene';

// 1. Register the DOM image consumer before readiness loads the primary bundle.
// HTML images can decode inline data URLs without fetching them through connect-src.
playable.loader.register('sprites', loadImage);
await playable.ready();

// 2. Compose the scene from gameplay, interface, and endcard layers.
// Mount before starting animations so they can measure the rendered DOM.
const scene = createMainScene();
playable.container.replaceChildren(scene.container);
scene.show();

// 3. Enable configured development tools. The build pipeline replaces disabled
// tools with no-ops; the example needs no development-only condition.
createStats();
createEndCardTrigger();
createSoundControl();

// 4. Load secondary assets without delaying interaction. Runtime audio retains
// requested music until its sound loads and drops unavailable one-shot effects.
void playable.loader.load('secondary');
