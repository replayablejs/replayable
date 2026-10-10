# CLI

`@replayablejs/cli` installs the `replayable` executable. Run commands from the playable project
root. Configuration files must have a default export.

| Command             | Purpose                                          | Options                                                                                                                   |
| ------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `replayable assets` | Generate optimized assets and TypeScript modules | `-c, --config <file>`; default `replayable.assets.ts`                                                                     |
| `replayable config` | Open the resolved-variant viewer                 | `-c, --config <file>`; `--json` prints JSON instead                                                                       |
| `replayable dev`    | Serve one variant with Vite HMR                  | `-c, --config <file>`, `--host <host>`, `--language <language>`, `--version <version>`, `-o, --open`, `-p, --port <port>` |
| `replayable build`  | Build all configured variants                    | `-c, --config <file>`                                                                                                     |
| `replayable export` | Export existing variant builds                   | `-c, --config <file>`, `-o, --output <directory>`                                                                         |

Except for `assets`, configuration defaults to `replayable.config.ts`. Ports must be integers
from 1 through 65535. `dev --version` selects a project variant, not a package release number.
Use `replayable --help` or `<command> --help` for command help.

```sh
pnpm exec replayable config --json
pnpm exec replayable dev --language en --version default --open
pnpm exec replayable build
pnpm exec replayable export --output exports
```

Stop development before building the same project. Export reads build output and does not compile
application code. Command errors produce a nonzero exit status.

[Command implementation](https://github.com/replayablejs/replayable/tree/main/packages/cli/src/commands).

## Development Server

Start the default creative version and choose a configured language:

```sh
pnpm exec replayable dev --language en --version default --open
```

To test from another device on your local network, bind to a reachable interface:

```sh
pnpm exec replayable dev --host 0.0.0.0 --port 5173
```

Use the network URL reported by the server on that device. The language and version must exist
in the configuration. Stop the server before generating production builds in the same project.

## Inspect Configuration

```sh
pnpm exec replayable config
pnpm exec replayable config --json
```

The viewer helps inspect expanded variants. JSON output is useful when checking resolved parameter
values and overrides. These commands use `replayable.config.ts` unless `--config` is supplied.

For editors, include the validated parameter definitions alongside the resolved variants:

```sh
pnpm exec replayable config --json --metadata
```

`--metadata` implies JSON output and returns `{ schemaVersion: 1, params, versions, variants }`.
`params` contains the project's existing definitions: `type`, `description`, `default`,
number `range` (min/max/step), string `options`, and optional `when` conditions.
There is no separate label field; editors can use parameter names and descriptions.
`variants` is the same array returned by `--json` alone, including resolved overrides.
Definitions remain present even when a `when` condition is false; editors evaluate the
condition against the selected variant's parameter values. This command only reads
configuration; it does not save edits or modify project files.

## Generate Assets

```sh
pnpm exec replayable assets --config replayable.assets.ts
```

This command uses the standalone [asset configuration](./assets.md), which includes its own
selected language and fallback. Project builds derive those settings from each variant.

## Build and Export

```sh
pnpm exec replayable build --config replayable.config.ts
pnpm exec replayable export --config replayable.config.ts --output delivery
```

Build processes every configured variant. Export reads the resulting files and writes delivery
artifacts into `delivery` in this example. See [Build and Export](../guide/build-and-export.md)
for output paths and common failures.

## Troubleshooting

- **Configuration file cannot be found:** run from the project root or pass `--config`.
- **Configuration is rejected:** default-export a valid configuration and inspect the reported field.
- **Port is rejected:** use an integer from `1` to `65535`.
- **Export cannot find a build:** build with the same configuration before exporting.

For npm projects, replace `pnpm exec replayable` with `npx replayable` in these commands.

## Temporary preview overrides

Try runtime values without editing the project configuration:

```sh
pnpm exec replayable dev --overrides preview-overrides.json
```

```json
{
  "version": "default",
  "language": "en",
  "params": { "speed": 2 },
  "controls": { "persistentCta": false },
  "devtools": { "soundControl": true, "stats": { "display": "compact" } }
}
```

The version, language, and parameter names must already exist in the project.
Parameter types, ranges, steps, and options use the project's normal validation.
Explicit --version and --language flags take precedence over file selectors.
Temporary params take precedence over project defaults, version values, and preview-network values.

Omitted controls and devtools fields preserve project values. An explicit stats value replaces
that setting as a unit using the usual Replayable defaults: false disables it, true enables all
metrics, and an object customizes enabled stats. Unknown fields are rejected. Overrides cannot
change source paths, network selection, assets, or build settings.

The file is read once at startup; restart the command to apply file edits. Overrides affect
only this preview run, never modify the authored config, and are not used by build or export.
Relative override-file paths are resolved from the command's working directory.

Programmatic callers use the same object:

```ts
await servePreview(config, {
  projectRoot: process.cwd(),
  overrides: {
    version: 'default',
    params: { speed: 2 },
    controls: { persistentCta: false },
  },
});
```

The config package exports previewOverridesSchema, ReplayablePreviewOverrides, and
createPreviewVariant(config, overrides) for validation and resolution without starting a server.
