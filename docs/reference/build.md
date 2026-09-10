# Build and preview

`@replayablejs/build` provides the Node-side build operations used by the CLI.

| API                                       | Input and result                                                                |
| ----------------------------------------- | ------------------------------------------------------------------------------- |
| `buildProject(config, workingDirectory?)` | Validate input, build all variants; return output directory and variant results |
| `buildVariant(variant, options)`          | Build one resolved variant with explicit project root and output directory      |
| `servePreview(config, options)`           | Start local preview; return variant ID, URLs and async `close()`                |

`servePreview` requires `projectRoot` and accepts host, port, language, version and open options.
Each build result includes the variant ID, HTML path, output directory and asset summary.

Project builds clear the configured output root, process variants sequentially and restore the
first variant's generated assets as a deterministic baseline. Do not run build and development
concurrently against the same generated paths. Use a dedicated output directory.

The build supplies runtime configuration, asset representation and network aliases. The compiled
browser targets are iOS 16.1 and Chrome 105. A runnable build is intermediate output; use
[export](./export.md) to produce delivery artifacts.

[Build contracts](https://github.com/replayablejs/replayable/blob/main/packages/build/src/types/build.ts).

## Project Builds

Use `buildProject` for the complete project. Its optional working directory defaults to the
current process directory. The result exposes:

| Field                        | Meaning                                                       |
| ---------------------------- | ------------------------------------------------------------- |
| `outputDirectory`            | Absolute root containing the built variants                   |
| `variants`                   | Ordered results for each version/network/language combination |
| `variants[].variantId`       | The resolved variant identifier                               |
| `variants[].htmlFile`        | Absolute path to that variant's entry HTML                    |
| `variants[].outputDirectory` | Directory containing that runnable variant                    |
| `variants[].assets`          | Asset generation summary                                      |

## Single-Variant Builds

Use `createVariants` from `@replayablejs/config` to obtain resolved variants, then pass one to
`buildVariant`. Supply `projectRoot` and an absolute `outputDirectory` explicitly. This API is
useful for tooling that selects a single variant rather than building the whole campaign.

## Preview Server Lifecycle

`servePreview` returns the selected `variantId`, `localUrls`, `networkUrls` and an async `close()`.
Retain that result and await `close()` when your tool is finished with the server. The `language`
and `version` options select configured values. Use `host` to make the server reachable from a
test device and `open` to launch the browser.

For normal command-line use, follow the [CLI reference](./cli.md). The programmatic APIs are for
scripts and tools that need to inspect results or manage the server lifecycle themselves.
