# Development tools

`@replayablejs/devtools` provides renderer-independent development controls. Create them after
runtime readiness, and configure their visibility through `replayable.config.ts`.

```ts
import { createStats, createSoundControl, createEndCardTrigger } from '@replayablejs/devtools';
import { playable } from '@replayablejs/runtime';

await playable.ready();
createStats();
createSoundControl();
createEndCardTrigger();
```

`createStats()` provides development diagnostics. `createSoundControl()` exposes a development
sound toggle. `createEndCardTrigger()` provides a shortcut/control that uses normal completion.
The returned types are `Stats`, `SoundControl` and `EndCardTrigger`.

Replayable's build pipeline selects disabled implementations for production. These tools are not
production player controls. Their build-selection aliases require the Replayable pipeline.
[Configuration schema](https://github.com/replayablejs/replayable/blob/main/packages/config/src/config/schemas/devtools.ts).

## Cleanup

Retain the returned controls when your application can replace a scene:

```ts
import { createStats, createSoundControl, createEndCardTrigger } from '@replayablejs/devtools';
import { playable } from '@replayablejs/runtime';

await playable.ready();
const stats = createStats();
const sound = createSoundControl();
const endCard = createEndCardTrigger();

function dispose() {
  stats.destroy();
  sound.destroy();
  endCard.destroy();
}
```

Stats also provides `show()` and `hide()`; hiding stops its measurements. Destruction releases
tool subscriptions. If a tool does not appear in development, check that it is enabled in the
project's `devtools` configuration and created after readiness.
