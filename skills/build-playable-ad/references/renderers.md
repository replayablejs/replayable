# Pixi and Spine

Add `@replayablejs/pixi` at the same version as the project's Replayable packages. Inspect its
`peerDependencies` and install a compatible `pixi.js`; do not assume the newest major is supported.
The optional Spine peer is needed only for Spine content.

```ts
import { createPixi } from '@replayablejs/pixi';
import { playable } from '@replayablejs/runtime';

const pixi = await createPixi();
await playable.ready();
// Add scene objects to pixi.stage after required resources have loaded.
```

Do not create a second Pixi Application or independent ticker for this stage. Use the integration's
renderer, stage and lifecycle. Use installed option types for sprite/text/button factories instead
of guessing how to pass generated assets.

For Spine, install the compatible `@esotericsoftware/spine-pixi-v8` peer and register its loader
before readiness:

```ts
import { createPixi } from '@replayablejs/pixi';
import { createSpineIntegration } from '@replayablejs/pixi/spine';
import { playable } from '@replayablejs/runtime';

const pixi = await createPixi({ integrations: [createSpineIntegration()] });
await playable.ready();
```

Use Spine source exports with compatible runtime versions and appropriate rights. The default
DOM starter does not require Spine. For another renderer, inspect supported public hooks rather
than inventing a dedicated Replayable integration package.

Remove scene subscriptions and stop animations before destroying targets. Shared textures remain
owned by the asset lifecycle; dispose of the integration with its `destroy()` when tearing it down.

See the [Pixi reference](https://replayablejs.github.io/replayable/reference/pixi.html) and
[Card Match source](https://github.com/replayablejs/replayable/tree/main/examples/basic-pixi-playable).
