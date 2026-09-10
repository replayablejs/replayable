# @replayablejs/assets

Build optimized resources and generated TypeScript asset modules.

Part of [Replayable](https://github.com/replayablejs/replayable) **0.1.0-alpha.0**.
APIs may change during the alpha series.

## Install

```sh
pnpm add -D @replayablejs/assets@0.1.0-alpha.0
```

## Public surface

`defineConfig`, `assetConfigSchema`, `buildAssets`; category and bundle constants; asset configuration, build-result and runtime asset types.

[Usage and reference](https://github.com/replayablejs/replayable/blob/main/docs/reference/assets.md).
The package manifest defines supported import paths; internal source files are not public APIs.

## Development

From the repository root, install with `pnpm install --frozen-lockfile` and build dependencies
with `pnpm build`. Run `pnpm --filter @replayablejs/assets test` for this package's tests.

## License

Original code is [MIT licensed](https://github.com/replayablejs/replayable/blob/main/LICENSE). Bundled third-party resources retain
their accompanying license terms.
