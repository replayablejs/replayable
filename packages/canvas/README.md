# @replayablejs/canvas

Provide a shared canvas host for rendering integrations.

Part of [Replayable](https://github.com/replayablejs/replayable) **0.1.0-alpha.0**.
APIs may change during the alpha series.

## Install

```sh
pnpm add @replayablejs/canvas@0.1.0-alpha.0
```

## Public surface

`getCanvasHost`, `CanvasHost`, `SharedRenderingContext`.

[Usage and reference](https://github.com/replayablejs/replayable/blob/main/docs/reference/canvas.md).
The package manifest defines supported import paths; internal source files are not public APIs.

## Development

From the repository root, install with `pnpm install --frozen-lockfile` and build dependencies
with `pnpm build`. Run `pnpm --filter @replayablejs/canvas test` for this package's tests.

## Peer dependencies

- `@replayablejs/runtime`: `workspace:*`

Workspace ranges are converted to package versions when packed.

## License

Original code is [MIT licensed](https://github.com/replayablejs/replayable/blob/main/LICENSE). Bundled third-party resources retain
their accompanying license terms.
