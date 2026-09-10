# Examples

The repository includes complete projects you can run and adapt. Install its dependencies and
build the packages once:

```sh
git clone https://github.com/replayablejs/replayable.git
cd replayable
pnpm install --frozen-lockfile
pnpm build
```

## DOM Word Ad

[Try the DOM word ad](/demos/basic-playable.html){target="_blank" rel="noopener"}

```sh
pnpm --filter @replayablejs/example-basic-playable dev
```

Drag letters to complete words and reach the endcard. This example uses runtime assets,
localization, audio and completion with ordinary DOM elements. It includes English and Armenian.

## Pixi and Spine

[Try the Pixi and Spine ad](/demos/basic-pixi-playable.html){target="_blank" rel="noopener"}

```sh
pnpm --filter @replayablejs/example-basic-pixi-playable dev
```

Reveal two animated cards. This example includes English and Spanish, a tutorial, inactivity
hints, responsive layout, audio and a star-rating endcard. It installs the optional Spine
integration before runtime readiness.

## Asset Processing

```sh
pnpm --filter @replayablejs/example-basic-assets assets
```

The asset-only project demonstrates category layouts and processing rules. It generates
resources and TypeScript modules rather than a playable application.

## Adapt a Project

Copy its entry, configuration files and source assets together. Replace workspace dependencies
with matching published Replayable versions. Change store URLs and campaign settings, and check
all included resources' attribution and license terms before redistribution.

Stop development before running the example's build and export scripts. The playable examples
configure eight networks and two languages each, yielding sixteen variants per example.
