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

Customize delivery names with `export.filename` in `replayable.config.ts`, for example
`'{name}_{version}_{network}_{language}'`. The default remains
`'{network}_{version}_{language}'`. The exporter normalizes names and adds the
network's extension automatically. Templates cannot contain directory separators,
unknown placeholders, or an explicit `.html`/`.zip` extension. Colliding names are
rejected before exports are written.

For full control, provide a synchronous callback. It receives the original project
name, playable version name, network, and language. Its return value preserves
casing, spaces, and hyphens:

```ts
export: {
  filename: ({ name, version, network, language }) =>
    `${name}-${version}-${network}-${language}`,
},
```

Return a non-empty filename without a directory or `.html`/`.zip` extension.
Invalid filename characters and duplicate output names are rejected before writing.
The exporter adds the network's extension automatically. Async callbacks are not supported.
