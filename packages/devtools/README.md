# @replayablejs/devtools

Provide optional stats, sound controls and an endcard trigger for development previews.

Part of [Replayable](https://github.com/replayablejs/replayable) **0.1.0-alpha.0**.
APIs may change during the alpha series.

## Install

```sh
pnpm add @replayablejs/devtools@0.1.0-alpha.0
```

## Public surface

`createStats`, `createSoundControl`, `createEndCardTrigger` and their returned control types.

[Usage and reference](https://github.com/replayablejs/replayable/blob/main/docs/reference/devtools.md).
The package manifest defines supported import paths; internal source files are not public APIs.

## Development

From the repository root, install with `pnpm install --frozen-lockfile` and build dependencies
with `pnpm build`. Run `pnpm --filter @replayablejs/devtools test` for this package's tests.

## Peer dependencies

- `@replayablejs/runtime`: `workspace:*`

Workspace ranges are converted to package versions when packed.

## License

Original code is [MIT licensed](https://github.com/replayablejs/replayable/blob/main/LICENSE). Bundled third-party resources retain
their accompanying license terms.
