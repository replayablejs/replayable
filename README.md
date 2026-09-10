<img src="docs/public/replayable-logo.svg" alt="Replayable logo" height="96">

# Replayable

[![CI](https://img.shields.io/github/actions/workflow/status/replayablejs/replayable/ci.yml?branch=main&style=flat-square&label=CI&logo=github)](https://github.com/replayablejs/replayable/actions/workflows/ci.yml)
[![npm alpha](https://img.shields.io/npm/v/%40replayablejs%2Fruntime/alpha?style=flat-square)](https://www.npmjs.com/package/@replayablejs/runtime)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)](LICENSE)
[![TypeScript](https://img.shields.io/badge/Built_with-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Built with Codex](https://img.shields.io/badge/Built_with-Codex-18181b?style=flat-square)](https://openai.com/codex/)

Replayable is a TypeScript toolkit for building playable ads. It combines asset processing,
network-specific builds and exports with a browser runtime and optional Pixi/Spine integration.
The product is Replayable; GitHub and npm use the `replayablejs` organization.

## Alpha release

Replayable **0.1.0-alpha.1** is an alpha release. APIs may change before 1.0.

```sh
pnpm add @replayablejs/runtime@0.1.0-alpha.1
pnpm add -D @replayablejs/cli@0.1.0-alpha.1 @replayablejs/config@0.1.0-alpha.1
```

See [getting started](https://replayablejs.github.io/replayable/guide/getting-started.html) for project setup and optional Pixi support.

## Examples

Try the ads in your browser or explore their source:

| Example                | Live demo                                                                             | Source                                      |
| ---------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------- |
| DOM word ad            | [Play demo](https://replayablejs.github.io/replayable/demos/basic-playable.html)      | [View source](examples/basic-playable)      |
| Pixi and Spine card ad | [Play demo](https://replayablejs.github.io/replayable/demos/basic-pixi-playable.html) | [View source](examples/basic-pixi-playable) |

See the [examples guide](https://replayablejs.github.io/replayable/guide/examples.html) for details.

## Run from source

Use Node.js 24 or newer and pnpm 10.32.1.

```sh
git clone https://github.com/replayablejs/replayable.git
cd replayable
pnpm install --frozen-lockfile
pnpm build
pnpm --filter @replayablejs/example-basic-playable dev
```

Open the URL printed by the server. To try Pixi/Spine, use
`pnpm --filter @replayablejs/example-basic-pixi-playable dev` instead.
Stop development before building the same example; both operations write generated assets.

```sh
pnpm --filter @replayablejs/example-basic-playable build
pnpm --filter @replayablejs/example-basic-playable export
```

Builds are written to `dist/<version>/<network>/<language>/` inside the example.
Export reads those builds and writes HTML/ZIP delivery files to `exports/`.

## Packages

- [`@replayablejs/assets`](packages/assets/README.md) — Build optimized resources and generated TypeScript asset modules.
- [`@replayablejs/config`](packages/config/README.md) — Validate project settings and expand versions, networks and languages into playable variants.
- [`@replayablejs/runtime`](packages/runtime/README.md) — Manage host readiness, assets, screen state, audio, updates, completion and store actions.
- [`@replayablejs/canvas`](packages/canvas/README.md) — Provide a shared canvas host for rendering integrations.
- [`@replayablejs/pixi`](packages/pixi/README.md) — Connect Pixi rendering, asset loaders and layout to the playable lifecycle.
- [`@replayablejs/tween`](packages/tween/README.md) — Animate DOM elements and object properties using lifecycle-aware Motion playback.
- [`@replayablejs/devtools`](packages/devtools/README.md) — Provide optional stats, sound controls and an endcard trigger for development previews.
- [`@replayablejs/build`](packages/build/README.md) — Run local preview and produce runnable playable variants.
- [`@replayablejs/export`](packages/export/README.md) — Turn existing playable builds into network-specific delivery artifacts.
- [`@replayablejs/cli`](packages/cli/README.md) — Run assets, configuration, development, build and export commands.

Root, documentation and example workspaces are private. All ten public packages share one toolkit version.
The `replayable` CLI name does not change with the npm scope.

## Documentation and development

- [Getting started](https://replayablejs.github.io/replayable/guide/getting-started.html)
- [Configuration](https://replayablejs.github.io/replayable/reference/config.html)
- [Asset pipeline](https://replayablejs.github.io/replayable/reference/assets.html)
- [Contributing](CONTRIBUTING.md)
- [Security reporting](SECURITY.md)

Run `pnpm docs:dev` for the documentation site and `pnpm check` for formatting, dependency
checks, lint, types, tests and builds. Example exports and `pnpm packages:check` are separate
checks, also run by CI.

## Acknowledgements

Created by Sargis Sargsyan through an AI-assisted engineering workflow, using OpenAI Codex
extensively across implementation, testing and documentation. Product direction, architecture
and final decisions remained human-led.

## License

Replayable's original code is [MIT licensed](LICENSE). Third-party code, datasets, fonts,
artwork and Spine resources retain their own terms. Keep the license and attribution files
that accompany those resources; the project license does not replace them.
