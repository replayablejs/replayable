import { createStats, createEndCardTrigger, createSoundControl } from '@replayablejs/devtools';
import { createPixi } from '@replayablejs/pixi';
import { createSpineIntegration } from '@replayablejs/pixi/spine';
import { playable } from '@replayablejs/runtime';

import { createMainScene } from './scene/create-main-scene';

/**
 * Example entry point: connect integrations, wait for required assets, then mount
 * the game. Gameplay rules and presentation belong to scene/features, not here.
 *
 * Replayable's pipeline supplies the resolved configuration, assets, and network
 * host behind `playable`. The same application code therefore runs in local
 * preview and network variants without selecting an ad SDK itself.
 */

// 1. Install renderer integrations BEFORE readiness loads the primary bundle.
// createPixi creates the renderer, mounts the shared canvas in the runtime shell,
// and connects rendering/resizing to Replayable. It also registers the loaders
// for sprites and atlases. The optional Spine integration adds skeleton loading
// and playback support; a playable without Spine can omit this import and option.
//
// createPixi does not call playable.ready() for us. Keeping that boundary explicit
// lets an application install all required integrations before loading begins.
const pixi = await createPixi({
  integrations: [createSpineIntegration()],
});

// 2. Initialize the host and screen, then load the primary asset bundle.
// Here that includes the visuals, font, translations, and card skeleton. Once
// this resolves, factories can read loaded assets and resolved screen state.
// Runtime removes its loading indicator and enables its frame scheduling here.
// No requestAnimationFrame loop, Pixi Application, or separate ticker is needed.
await playable.ready();

// 3. Construct and mount the scene once. It owns the board, tutorial, hint, audio,
// controls, and endcard, including their runtime subscriptions and animations.
// The stage is created by createPixi; adding this root makes the scene render.
const scene = createMainScene();
pixi.stage.addChild(scene.container);

// 4. Show the stats enabled in replayable.config.ts under devtools.stats.
// In production, or when stats are disabled, this call does nothing and the
// stats UI is not bundled.
createStats();
// Development-only Escape shortcut and Skip button; uses the scene's normal completion path.
createEndCardTrigger();
// Same renderer-independent sound toggle as the DOM example; absent from production.
createSoundControl();

// 5. Start secondary loading WITHOUT awaiting it: the game is already usable.
// config/assets.ts places sounds in this bundle. The scene may request looping
// music before loading finishes: runtime retains that playback intent and waits
// for the sound and audio permission. Premature one-shot effects are dropped,
// not replayed later. The scene never needs its own pending/no-op audio layer.
//
// `void` intentionally discards the promise; it neither waits nor catches errors.
// Secondary is an ordinary asset bundle, not a sound-specific loading API.
void playable.loader.load('secondary');
