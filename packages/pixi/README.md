# @replayablejs/pixi

Connect Pixi rendering, asset loaders and layout to the playable lifecycle.

Part of [Replayable](https://github.com/replayablejs/replayable) **0.1.0-alpha.0**.
APIs may change during the alpha series.

## Install

```sh
pnpm add @replayablejs/pixi@0.1.0-alpha.0
```

## Public surface

`createPixi`, `createButton`, sprite/text factories, `createLayout`, `fitText` and their types. Optional `/spine` entry: `createSpineIntegration`, `createSpine`, `CreateSpineOptions`.

[Usage and reference](https://github.com/replayablejs/replayable/blob/main/docs/reference/pixi.md).
The package manifest defines supported import paths; internal source files are not public APIs.

## Development

From the repository root, install with `pnpm install --frozen-lockfile` and build dependencies
with `pnpm build`. Run `pnpm --filter @replayablejs/pixi test` for this package's tests.

## Peer dependencies

- `@esotericsoftware/spine-pixi-v8`: `~4.3.13` (optional)
- `@replayablejs/runtime`: `workspace:*`
- `pixi.js`: `^8.20.1`

Workspace ranges are converted to package versions when packed.

## License

Original code is [MIT licensed](https://github.com/replayablejs/replayable/blob/main/LICENSE). Bundled third-party resources retain
their accompanying license terms.
