# @replayablejs/config

Validate project settings and expand versions, networks and languages into playable variants.

Part of [Replayable](https://github.com/replayablejs/replayable) **0.1.0-alpha.0**.
APIs may change during the alpha series.

## Install

```sh
pnpm add -D @replayablejs/config@0.1.0-alpha.0
```

## Public surface

`defineConfig`, `replayableConfigSchema`, `replayableAssetsSchema`, `createVariants`; configuration input/output and `PlayableVariant` types.

[Usage and reference](https://github.com/replayablejs/replayable/blob/main/docs/reference/config.md).
The package manifest defines supported import paths; internal source files are not public APIs.

## Development

From the repository root, install with `pnpm install --frozen-lockfile` and build dependencies
with `pnpm build`. Run `pnpm --filter @replayablejs/config test` for this package's tests.

## License

Original code is [MIT licensed](https://github.com/replayablejs/replayable/blob/main/LICENSE). Bundled third-party resources retain
their accompanying license terms.
