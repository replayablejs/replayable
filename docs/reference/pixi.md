# Pixi

`@replayablejs/pixi` connects Pixi to Replayable's assets, screen and update lifecycle.
Install the compatible `pixi.js` peer listed in its package manifest. Do not create an additional
Pixi Application or independent ticker for the integration's stage.

```ts
import { createPixi } from '@replayablejs/pixi';
import { playable } from '@replayablejs/runtime';

const pixi = await createPixi();
await playable.ready();
// Add your scene to pixi.stage after assets are ready.
```

`createPixi` accepts `antialias`, `powerPreference`, `useBackBuffer` and optional `integrations`.
It returns `renderer`, `stage` and `destroy()`. Install integrations before `playable.ready()`.

Factories include `createSprite`, `createAnimatedSprite`, `createNineSliceSprite`, `createText`,
`createSplitText` and `createButton`. Use `createLayout` for design/layout areas and `fitText` for
text fitting. Their exported option types describe the supported inputs; pass loaded assets and
retain the returned objects under scene ownership.

## Optional Spine

```ts
import { createPixi } from '@replayablejs/pixi';
import { createSpineIntegration } from '@replayablejs/pixi/spine';
import { playable } from '@replayablejs/runtime';

const pixi = await createPixi({ integrations: [createSpineIntegration()] });
await playable.ready();
```

The `/spine` entry also exports `createSpine` and `CreateSpineOptions`. Install the compatible
`@esotericsoftware/spine-pixi-v8` optional peer only when using Spine. Spine software and exported
artwork have their own licensing requirements. The root Pixi entry can be used without that peer.

See the [two-card example](https://github.com/replayablejs/replayable/tree/main/examples/basic-pixi-playable)
for asset loading, scene composition, layout, controls and endcard handling.

## Create and Fit Text

```ts
import { createPixi, createText, fitText } from '@replayablejs/pixi';
import { playable } from '@replayablejs/runtime';

const pixi = await createPixi();
await playable.ready();
const title = createText({
  text: 'Tap to play',
  style: { fontFamily: 'sans-serif', fontSize: 48, fill: '#ffffff' },
});
fitText(title, { width: 300, height: 80 });
pixi.stage.addChild(title);
```

`fitText(text, { width, height? })` fits inside positive dimensions in the parent's local units.
It scales uniformly and never enlarges beyond the authored size. Calling it again replaces the
previous scale; it does not change text, wrapping, position or pivot. Fit again after changing
text or the available area.

## Scene Ownership

Keep created display objects under your scene container. Remove scene subscriptions and stop
animations before destroying their targets. Call the integration's `destroy()` when disposing
its renderer and stage. Shared asset textures should remain owned by the asset lifecycle.
