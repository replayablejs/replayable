# Canvas

`getCanvasHost()` from `@replayablejs/canvas` gives rendering integrations a shared canvas host.
It is not a scene engine or a standalone render loop.

| Host method                 | Behavior                                                                  |
| --------------------------- | ------------------------------------------------------------------------- |
| `getCanvas()`               | Return the canvas mounted in the runtime container                        |
| `getSharedContext()`        | Return the registered WebGL context or `null`                             |
| `setSharedContext(context)` | Register the first renderer's context; reject replacement                 |
| `destroy()`                 | Remove the canvas once; subsequent host acquisition may create a new host |

The exported `SharedRenderingContext` type accepts WebGL or WebGL2 contexts. Coordinate ownership
when sharing a host; an integration should release only resources it owns. The Pixi integration
handles canvas acquisition and cleanup for its renderer.

[Host contract](https://github.com/replayablejs/replayable/blob/main/packages/canvas/src/types/canvas-host.ts).

## When to Use This Package

Use the host when implementing a rendering integration that must share Replayable's canvas.
Applications using [Pixi](./pixi.md) can let `createPixi()` manage it. DOM-only playables can mount
content directly in `playable.container` without acquiring a canvas.

## Context Ownership

Acquire the host, use its canvas to create the renderer, and register the renderer's WebGL context
with `setSharedContext`. A second integration can read that context with `getSharedContext()`;
it must coordinate rendering and resource ownership with the first integration.

`getSharedContext()` returns `null` until registration. Replacing a registered context is rejected.
After destroying a host, acquire a fresh host before starting another renderer instead of reusing
the destroyed instance.
