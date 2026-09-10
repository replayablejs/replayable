# @replayablejs/runtime

Manage host readiness, assets, screen state, audio, updates, completion and store actions.

Part of [Replayable](https://github.com/replayablejs/replayable) **0.1.0-alpha.0**.
APIs may change during the alpha series.

## Install

```sh
pnpm add @replayablejs/runtime@0.1.0-alpha.0
```

## Public surface

`playable` and runtime types. Subpaths: `/assets` for generated asset contracts and `/shell` for shell element IDs.

[Usage and reference](https://github.com/replayablejs/replayable/blob/main/docs/reference/runtime.md).
The package manifest defines supported import paths; internal source files are not public APIs.

## Development

From the repository root, install with `pnpm install --frozen-lockfile` and build dependencies
with `pnpm build`. Run `pnpm --filter @replayablejs/runtime test` for this package's tests.

## License

Original code is [MIT licensed](https://github.com/replayablejs/replayable/blob/main/LICENSE). Bundled third-party resources retain
their accompanying license terms.
