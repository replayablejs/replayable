# Tween

`@replayablejs/tween` exports `animate`, `stagger` and `TweenPlaybackControls`.
It wraps Motion animation with Replayable lifecycle handling. Importing the module does not
start a browser frame loop; the binding is initialized when animation is requested.

Call `animate` only after `await playable.ready()`; early calls throw.

Use the returned playback controls to manage animations owned by a scene. Do not leave animation
work attached to objects that your application has destroyed. Prefer this integration when an
animation must follow playable visibility rather than maintaining a second lifecycle system.

[Animation implementation and overloads](https://github.com/replayablejs/replayable/blob/main/packages/tween/src/animate.ts)
and [playback contract](https://github.com/replayablejs/replayable/blob/main/packages/tween/src/types/playback.ts)
cover DOM, object and sequence inputs. Motion's third-party declarations are one reason the tested
consumer setup uses `skipLibCheck: true` with strict application checking.

## Animate an Element

```ts
import { playable } from '@replayablejs/runtime';
import { animate } from '@replayablejs/tween';

await playable.ready();
const title = document.createElement('h1');
title.textContent = 'Ready?';
playable.container.append(title);
const entrance = animate(title, { opacity: [0, 1], y: [16, 0] }, { duration: 0.3 });
await entrance;
```

Keep the controls when a scene can be disposed before the animation completes. Call `stop()`
before removing its target. Duration and playback position are measured in seconds.

## Playback Controls

| Member       | Behavior                                                            |
| ------------ | ------------------------------------------------------------------- |
| `time`       | Read or set the current position in seconds                         |
| `speed`      | Playback multiplier; `1` is normal speed and `-1` reverses playback |
| `duration`   | Read the total duration in seconds                                  |
| `play()`     | Resume from the current position                                    |
| `pause()`    | Pause at the current position                                       |
| `stop()`     | Stop permanently at the current visual state                        |
| `cancel()`   | Cancel and restore the initial state                                |
| `complete()` | Apply the final state immediately                                   |

The returned controls are awaitable and resolve after normal or forced completion. `stagger`
can produce delays for groups of targets; `animate` also accepts object targets and sequences.
