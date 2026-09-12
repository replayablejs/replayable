# Runtime

`@replayablejs/runtime` exposes the `playable` facade. Its configuration and host adapters are
provided by Replayable's build pipeline. Install renderer integrations before readiness so they
can register loaders before primary assets are loaded.

```ts
import { playable } from '@replayablejs/runtime';

await playable.ready();
const message = document.createElement('p');
message.textContent = 'Ready to play';
playable.container.append(message);
```

## Lifecycle and state

`ready()` initializes the host and loads primary assets once. After it resolves, use `config`,
`state`, `container` and `screen`. `on(event, listener)` returns a removal function. Events are
`audiochange`, `complete`, `interaction`, `resize` and `visibilitychange`.

`complete(reason)` commits the terminal outcome once. `openStore()` routes a user-triggered store
action through the selected host. Implement your own ad interactions and endcard; the runtime supplies
completion state and policy. Do not substitute an arbitrary navigation for the host store API.

## Assets, audio and time

`loader.load('secondary')` explicitly loads deferred assets. Repeated bundle requests share the
same promise, including failure. `loader.cache` contains loaded values. Register integration-owned
category handlers before readiness. Built-in font, locale and shader handlers have fixed contracts.

`localization` resolves loaded phrases. `audio` manages capability, user interaction and visibility;
looping playback can wait for an asset, while premature one-shot effects are not queued for replay.
Use `timers`, `update`, `fixedUpdate` and `postRender` for runtime-synchronized work. Fixed updates
run at 60 simulation steps per second. `postRender` observes JavaScript submission, not GPU completion.
Remove subscriptions and destroy application-owned resources when your scene is torn down.

## Subpaths

- `@replayablejs/runtime/assets`: category/bundle constants and generated asset types.
- `@replayablejs/runtime/shell`: `REPLAYABLE_ROOT_ID`, `REPLAYABLE_CONTAINER_ID`,
  `REPLAYABLE_LOADING_INDICATOR_ID`.

[Runtime contracts](https://github.com/replayablejs/replayable/tree/main/packages/runtime/src/types).

## Completion and Store Actions

Subscribe before the ad begins so the application can display its endcard for both manual and
timer-driven completion. Call `openStore()` from a user interaction such as the endcard button.

```ts
import { playable } from '@replayablejs/runtime';

await playable.ready();
const install = document.createElement('button');
install.textContent = 'Install';
install.addEventListener('click', () => playable.openStore());

const removeComplete = playable.on('complete', () => {
  playable.container.append(install);
});

// Call when your ad's success condition is reached.
function win() {
  playable.complete('success');
}

// Call when disposing this scene.
function dispose() {
  removeComplete();
  install.remove();
}
```

Supported reasons are `success`, `failure`, `skip`, `duration-timeout` and `inactivity-timeout`.
Completion is terminal: subsequent calls do not create a second outcome.

## Audio

Use managed playback for music or another sound that should wait until its asset is loaded and
audio is allowed. Keep the returned handle so you can cancel pending playback or stop a playing sound.
Replace the example ID with an ID from your generated sound assets.

```ts
import { playable } from '@replayablejs/runtime';

await playable.ready();
const music = playable.audio.play('music', {
  loop: true,
  volume: 0.5,
  fadeIn: 0.25,
});

function stopMusic() {
  music.stop({ fadeOut: 0.25 });
}
```

Volume ranges from `0` to `1`; fade durations are seconds. `playOneShot(id, { volume })` plays
an immediate effect and drops it if blocked or unloaded, preventing a delayed burst of old effects.
`setMuted(boolean)` controls application mute state; host visibility and permission still apply.

Managed handles also expose `setVolume(volume)`, `position`, and `duration`:

```ts
music.setVolume(0); // Silent playback keeps advancing.
music.setVolume(0.8); // Same voice and position, now audible.
const progress = music.duration > 0 ? music.position / music.duration : 0;
```

`setVolume` accepts a finite number from `0` through `1` (otherwise it throws
`RangeError`). Pending playback remembers the new volume. Active playback cancels
any fade-in and changes only its own voice; application mute and host restrictions
still apply. Once stopping or finished, volume changes are validated but ignored.

`position` reads the backend clock in seconds, wraps for loops, and returns zero
before start and after finish. It remains readable during fade-out. `duration` is
the full loaded sound length in seconds, zero while unknown, and remains available
after finish. Cancellation before loading does not retain a metadata subscription.
Audio-disabled builds return zero for both properties and validate volume changes
without playing anything.

For layered loops, load the tracks first, start them silently in the same turn, and
switch their volumes. This follows sequential backend starts; it does not guarantee
sample-accurate synchronization.

## Frame Updates

Use `update.add()` for work on rendered frames. Its `deltaSeconds` is measured in seconds.
`fixedUpdate.add()` advances simulation at 60 steps per second. Both return unsubscribe functions.

```ts
import { playable } from '@replayablejs/runtime';

await playable.ready();
const label = document.createElement('p');
playable.container.append(label);
let elapsed = 0;
const removeUpdate = playable.update.add(({ deltaSeconds }) => {
  elapsed += deltaSeconds;
  label.textContent = `${elapsed.toFixed(1)} seconds`;
});

function dispose() {
  removeUpdate();
  label.remove();
}
```

`postRender.add()` receives a `timestamp` in milliseconds after Motion's update and render phases.
Use it to observe frame submission; it does not signal that the GPU has finished rendering.

## Troubleshooting

- **Renderer assets are unavailable:** install the renderer integration before `ready()`, then
  await readiness before creating objects that need primary assets.
- **A secondary asset is missing:** await `loader.load('secondary')` before using it.
- **A sound is silent:** check project audio capability, mute state, host permission and loading.
- **An old scene still updates:** call the removal functions returned by event and update subscriptions.
