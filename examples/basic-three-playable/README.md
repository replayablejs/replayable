# Basic Three.js playable

A Three.js City Builder example for Replayable, inspired by
[Kenney’s City Builder](https://github.com/KenneyNL/Starter-Kit-City-Builder).

## Current state

The preview renders a woodland neighborhood with one bending road, six existing houses,
sparse tree groves, a fountain, and three marked empty plots. Houses face the
road, with additional homes extending along its right-hand side. A fixed angled camera frames the
playable street in portrait and landscape. The scene includes sunlight, shadows,
and a single shared palette texture applied to all model materials.

Tap an empty plot to place its assigned building: medium on the left, tallest in
the middle, and shortest on the right. Each accepted tap hides that plot's
pavement and marker, plays a placement sound, and animates the building into place.
Each plot has a fixed building type; occupied plots are ignored.
Entrance paths start as grass. Pavement tiles start appearing 100ms after the building starts,
overlapping its entrance as they extend toward the road. The HTML overlay shows the
City Builder wordmark and persistent CTA. After `buildingsToEndcard` buildings and their paths
finish appearing, the end card shows the same logo and the Kenney UI button.
There is no instruction prompt, progress counter, or building selection tray.

`config/params.ts` sets `buildingsToEndcard` to **2** by default. Its allowed values
are **1** and **2**; project configuration validates the range and integer step.
The three plots remain available choices, but the player only needs the configured
number of placements. Store buttons use `playable.openStore()` and respect the
network's persistent-CTA and end-card interaction settings.

## Run

From the repository root:

```sh
pnpm install
pnpm build
pnpm --filter @replayablejs/example-basic-three-playable dev
```

Build or check this example:

```sh
pnpm --filter @replayablejs/example-basic-three-playable build
pnpm --filter @replayablejs/example-basic-three-playable typecheck
pnpm --filter @replayablejs/example-basic-three-playable lint
```

`config/store.ts` uses the same test store destinations as the existing examples.
Replace them before publishing your own playable.

## Playable flow

1. Show the city, three empty plots, logo, and persistent CTA.
2. Tap any empty plot to place its assigned building and reveal its entrance path.
3. After the configured one or two placements finish, stop input and reveal the end card.
4. The end-card button opens the store through the active network adapter.

The camera stays fixed and frames the neighborhood in portrait and landscape.
There is no physics engine or economy. The example owns gameplay state, audio,
animations, and resource cleanup; the Three.js integration owns rendering and
model/texture loading. HTML controls overlay the canvas without replacing it.

The reference repository identifies its code as MIT and its assets as CC0. See
[third-party notices](./THIRD_PARTY_NOTICES.md) for provenance and licenses.

## Asset layout

```text
assets/
  models/city/
    building-small-{a,b,c}.glb
    grass.glb
    grass-trees.glb
    pavement.glb
    pavement-fountain.glb
    road-straight.glb
    road-corner.glb
  textures/
    city-colormap.png
  sounds/
    placement-{a,b,c}.ogg
  sprites/ui/
    home.png
    cta-button.png
    endcard-button.png
  fonts/
    KenneyFuture.ttf
```

The source GLBs retain geometry, UVs, and material properties but contain no
texture references. `textures/city-colormap.png` is loaded once through the Three.js
texture loader with lossless processing. `prepare-city-palette.ts` configures the cached texture with `SRGBColorSpace`
and `flipY = false`. `apply-city-palette.ts` assigns it to model materials and
marks those materials for an update.
These models are static and contain no animation clips.

`config/assets.ts` applies Meshopt to every model. `src/main.ts` installs only
`createMeshoptIntegration()` before `playable.ready()`, along with the DOM sprite
loader. The generated registries and resources live in ignored `src/assets/`.
Run `pnpm --filter @replayablejs/example-basic-three-playable assets` to regenerate
them independently; dev and build also process assets.

## Scene ownership

`create-main-scene.ts` composes the neighborhood, lighting, and camera subscription.
`neighborhood-layout.ts` describes the one-unit grid and the three future building
plots. The camera fits the playable street on resize without adding orbit controls. Scenery, placed buildings, and pavement share instanced meshes, and
woodland groves and grassy clearings extend beyond the viewport without an exposed island edge.

Scene destruction stops its resize subscription, destroys model instances,
disposes shared model assets, then releases the standalone palette. Procedural
geometry, materials, and the sun shadow map are also released when the scene’s
`destroy()` method is called. The entry point follows the Pixi example’s startup
flow without adding browser page-exit handlers.

The terrain uses 625 cells (25 × 25), sized for the fixed camera across the
configured portrait and landscape aspect ratios with a small off-screen margin.
Its bounds are in `neighborhood-layout.ts`; recheck them if camera framing or
supported aspect ratios change. Instancing still groups tiles by source mesh.

## Building placement

`create-building-session.ts` owns occupied plots, the selected building, and progress.
`install-plot-input.ts` handles mouse and touch releases, ignoring hidden views and
completed playables. `create-plot-picker.ts` projects those coordinates onto the
plot plane using the actual canvas rectangle. It only listens on the canvas, leaving future HTML controls independent.

`create-gameplay.ts` connects those rules to model creation and placement sounds.
Building type depends on the plot, not tap order. Input is locked during the building’s 0.35-second scale animation and the overlapping
path reveal (0.22 seconds per tile, staggered by 0.12 seconds). The lifecycle-aware tween
pauses while the host is hidden, and success is reported after the final animation.
Gameplay cleanup removes input/listeners, stops animation, and destroys building
instances before the main scene releases shared assets.

The three house GLBs expose separate `ground` and `building` nodes. Placement
animates only `building`, pivoting at its base; `ground` stays full-size at its
original elevation. The placeholder pavement is removed when this stationary
ground is added, so no shrunken ground cell or lowered backing is needed for houses.

`create-city-model-batch.ts` keeps one instanced mesh per source mesh and reserves
space for future placements. Building and pavement hierarchies stay outside the
rendered scene; animation updates copy their transforms into those shared batches.
This preserves the building pivot, stationary ground, and pavement reveal without
adding separate mesh draws for each placement. Empty plot pavement uses the same
pavement batch and is hidden when replaced.

A building type absent from the starting neighborhood still needs its own batches
when first placed (the tallest house has separate ground and structure meshes).
Shadow passes also draw those batches. Existing types and additional pavement reuse
batches; hiding each plot marker removes its individual draw call. Cleanup stops
animations and hides instances before the neighborhood disposes the shared buffers.

The HTML UI uses Kenney’s CC0 UI Pack button and Kenney Future font, plus the
Game Icons home symbol. The logo combines these assets with “City Builder” text;
the persistent CTA uses yellow and the end-card CTA uses green. See `THIRD_PARTY_NOTICES.md` for source paths.

On completion, the existing logo moves and scales into its end-card position while
the backdrop fades in. The green button enters, then breathes using the same timing
as the other examples. Runtime lifecycle pauses the tweens while hidden; finite
network policies limit breathing to three cycles. Animation settings live in
`src/scene/interface/configs/end-card-animation.ts`.

Sounds and the green end-card button belong to the `secondary` asset bundle.
They load in the background after gameplay starts. The end card and its button are
created only on completion, using the loaded artwork without waiting for the bundle.

### Plot hint

`hint` enables a gentle pulse on one empty plot outline (default: `true`).
`hintDelay` sets the inactivity delay in seconds (default: `4`, range: `2–8`).
The pavement stays still. Placement stops the pulse immediately; after placement,
the next available outline can pulse after inactivity. Completion stops the hint.
`features/hint/create-plot-hint.ts` owns the timer and animation; plots expose their
markers without knowing about hint behavior. Both timing and animation pause while hidden.
