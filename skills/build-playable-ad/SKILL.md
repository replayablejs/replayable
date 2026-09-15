---
name: build-playable-ad
description: Create or modify playable ads using the published Replayable packages, including project setup, runtime integration, creative variants, assets, and network exports. Use for consumer ad projects, not maintenance or publication of the Replayable toolkit itself.
---

# Build a playable ad with Replayable

Deliver a working ad project and the requested delivery artifacts. Use the user's creative brief,
renderer, existing assets and target networks; do not replace an existing project with a starter.

## Start with the project

Inspect its manifest, configuration and entry point before editing. Use public `@replayablejs/*`
packages rather than importing Replayable repository internals or using workspace dependencies.
Keep Replayable packages at the same version. This skill's starter targets `0.1.0-alpha.1` on
Node.js 24+; for another installed version, consult that version's declarations and documentation
before adopting these examples. Do not silently upgrade an existing project.

For a new project, copy the contents of [assets/starter](assets/starter/) into an empty project
directory. It contains a complete configuration and a minimal DOM interaction. Rename the project,
replace the interaction with the requested ad, and replace placeholder store URLs before delivery.
Use the project's package manager; the starter works with npm. It needs no repository checkout,
Vite config or hand-authored HTML entry.

```sh
npm install
npm run build
npm run typecheck
npm run export
```

Do not install every Replayable package. The starter needs runtime, CLI and config; add renderer
or animation packages only when needed. A DOM ad is a useful low-dependency default when no
renderer is specified, not a requirement.

## Recreate an existing ad

Inspect both source and the live interaction when provided. Use configured repository credentials
for source access; keep the original checkout unchanged. Record loading, tutorial, idle guidance,
selection rules, animations, audio and each completion outcome. Compare portrait, wide landscape
and tablet-like aspect ratios. Do not activate outbound store links just to inspect the reference.
Summarize observed behavior and proposed implementation before substantial recreation work.
Distinguish verified behavior from inference, and preserve the user's intentional design changes.

## Build around the runtime

- Import `playable` from `@replayablejs/runtime`. Install renderer integrations before
  `await playable.ready()`, which initializes the host and primary resources.
- Mount DOM content in `playable.container`. Build the ad's own interaction, completion UI and
  endcard; `playable.complete('success')` records the outcome but does not create that UI.
- Route user-triggered install actions through `playable.openStore()`.
- Prefer `playable.audio`, `timers`, `update` and `fixedUpdate` for work that should respect the
  runtime lifecycle. Keep unsubscribe functions and dispose of scene-owned resources.
- Do not assume a browser preview reproduces ad-host lifecycle, audio or store behavior.

For a substantial ad, read [references/architecture.md](references/architecture.md) before
structuring the scene or responsive layout. When adding audio, read
[references/audio.md](references/audio.md); its extended playback APIs require alpha.3 or later,
not this minimal starter's alpha.1. Do not compensate for missing APIs by reaching into Howler.

Read [references/variants-and-assets.md](references/variants-and-assets.md) when adding creative
parameters, languages, assets or deferred loading. Read [references/renderers.md](references/renderers.md)
when using Pixi or Spine. These references are optional; a simple DOM ad need not load them.

## Validate the deliverable

Use `replayable config --json` to inspect variants and resolve configuration errors. Schemas are
strict: check installed types instead of guessing field names. Ad `versions` are creative variants,
not npm package versions.

Stop the development server before building: development and production share generated asset
paths. Build first when asset registries are generated, then run type checking and export after the final edits. Build clears its configured
output directory; keep source and generated output separate. Do not edit generated asset modules.

Build output is `dist/<version>/<network>/<language>/index.html`; delivery artifacts go to
`exports/`. Export reads existing builds, so an old successful export does not validate new edits.
Use the selected network profiles and resolve their actual export errors rather than inventing
universal size limits or modifying the exporter to bypass them.

When browser control is available, inspect portrait and landscape layouts, interaction through
completion, CTA visibility and input routing without opening external stores, and console errors
using the final preview artifact. Check visibility
and audio behavior when relevant. Report browser/device or ad-host checks as unverified when
those environments are unavailable; export success does not certify network acceptance.

For requested CI, a download catalog, or testing local toolkit packages, read
[references/build-and-delivery.md](references/build-and-delivery.md). These are optional workflows,
not requirements for every playable.

Finish with the project location, commands to run it, produced artifacts, checks performed and
remaining campaign inputs. Creating an ad does not by itself request an npm release, deployment,
or ad-network upload.

## Further API detail

Use installed declarations for exact signatures and the documentation for workflows:

- [Getting started](https://replayablejs.github.io/replayable/guide/getting-started.html)
- [Configuration](https://replayablejs.github.io/replayable/reference/config.html)
- [Runtime](https://replayablejs.github.io/replayable/reference/runtime.html)
- [Build and export](https://replayablejs.github.io/replayable/guide/build-and-export.html)

The live docs can advance beyond this starter. Prefer matching package versions over combining
examples from different releases.
