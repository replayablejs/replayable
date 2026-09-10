# @replayablejs/tween

Animate DOM elements and object properties using lifecycle-aware Motion playback.

Part of [Replayable](https://github.com/replayablejs/replayable) **0.1.0-alpha.0**.
APIs may change during the alpha series.

## Install

```sh
pnpm add @replayablejs/tween@0.1.0-alpha.0
```

## Public surface

`animate`, `stagger`, `TweenPlaybackControls`.

[Usage and reference](https://github.com/replayablejs/replayable/blob/main/docs/reference/tween.md).
The package manifest defines supported import paths; internal source files are not public APIs.

## Development

From the repository root, install with `pnpm install --frozen-lockfile` and build dependencies
with `pnpm build`. Run `pnpm --filter @replayablejs/tween test` for this package's tests.

## Peer dependencies

- `@replayablejs/runtime`: `workspace:*`

Workspace ranges are converted to package versions when packed.

## License

Original code is [MIT licensed](https://github.com/replayablejs/replayable/blob/main/LICENSE). Bundled third-party resources retain
their accompanying license terms.
