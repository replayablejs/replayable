# @replayablejs/build

Run local preview and produce runnable playable variants.

Part of [Replayable](https://github.com/replayablejs/replayable) **0.1.0-alpha.0**.
APIs may change during the alpha series.

## Install

```sh
pnpm add -D @replayablejs/build@0.1.0-alpha.0
```

## Public surface

`servePreview`, `buildProject`, `buildVariant` and their option/result types.

[Usage and reference](https://github.com/replayablejs/replayable/blob/main/docs/reference/build.md).
The package manifest defines supported import paths; internal source files are not public APIs.

## Development

From the repository root, install with `pnpm install --frozen-lockfile` and build dependencies
with `pnpm build`. Run `pnpm --filter @replayablejs/build test` for this package's tests.

## License

Original code is [MIT licensed](https://github.com/replayablejs/replayable/blob/main/LICENSE). Bundled third-party resources retain
their accompanying license terms.

Google builds keep HTML, CSS, and JavaScript modules as separate files, but embed
asset data in JavaScript. Models, images, fonts, and locale data therefore do not
appear as separate files in the upload ZIP. Secondary bundles still defer loading
and decoding through the runtime; their embedded bytes may download with JavaScript.
