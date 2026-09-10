# @replayablejs/export

Turn existing playable builds into network-specific delivery artifacts.

Part of [Replayable](https://github.com/replayablejs/replayable) **0.1.0-alpha.0**.
APIs may change during the alpha series.

## Install

```sh
pnpm add -D @replayablejs/export@0.1.0-alpha.0
```

## Public surface

`exportProject`, `ExportProjectOptions`, `ExportProjectResult`, `ExportVariantResult`.

[Usage and reference](https://github.com/replayablejs/replayable/blob/main/docs/reference/export.md).
The package manifest defines supported import paths; internal source files are not public APIs.

## Development

From the repository root, install with `pnpm install --frozen-lockfile` and build dependencies
with `pnpm build`. Run `pnpm --filter @replayablejs/export test` for this package's tests.

## License

Original code is [MIT licensed](https://github.com/replayablejs/replayable/blob/main/LICENSE). Bundled third-party resources retain
their accompanying license terms.
