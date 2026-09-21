# Asset-generation fixture

Exercises image, atlas, Spine, shader, sound, font, localization and 3D model processing. This workspace generates resources; it is not a playable ad.

This is a private example workspace. It is not an npm package to publish.

## Run

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm --filter @replayablejs/example-basic-assets assets
```

Read the TypeScript configuration files in this directory before editing generated resources.
Source assets and generated destinations are defined there. Playable projects share asset paths
between development and production, so run those operations separately.

## Kenney 3D models

The `models` rules in [replayable.assets.ts](replayable.assets.ts) process five real game
models from Kenney's CC0 asset packs, plus six derived layout examples.
See **[Model layouts and every configuration](MODELS.md)** for actual folder trees,
all model options, and 16 runnable configuration recipes.

The five original models are:

| Model                     | Source                                    | Features                                                       | Compression |
| ------------------------- | ----------------------------------------- | -------------------------------------------------------------- | ----------- |
| Race car                  | `car-kit/race.obj` + MTL + PNG            | Body, four wheels, 1,952 triangles, color palette              | Meshopt     |
| Tree                      | `platformer-kit/tree.obj` + MTL + PNG     | Trunk/leaves, 816 triangles, color palette                     | Meshopt     |
| Treasure chest            | `platformer-kit/chest.glb` + PNG          | 232 triangles; open, close, and open-close animations          | Meshopt     |
| Platformer character Oopi | `platformer-kit/character-oopi.glb` + PNG | 938 triangles, six-joint skin, 25 animation clips              | Meshopt     |
| Blocky character A        | `blocky-characters/character-a.glb` + PNG | Six animated body parts, character texture, 27 animation clips | Meshopt     |

The characters are assigned to the secondary bundle. Their animations include idle, walk,
sprint, attacks, and interactions; Oopi also has jump, fall, and crouch clips. All **55 clips**
across the characters and chest are preserved. The original Kenney GLBs reference external
PNG images; Replayable embeds them in the generated GLBs.

Each output is a single file under `src/assets/resources/models/`. Generated entries are in
`assets.primary.models` or `assets.secondary.models`, and `src/assets/registries/models.ts`
provides the model IDs. Generation requires no Three.js dependency or renderer.

Original pack source files are unchanged from [Car Kit 3.1](https://kenney.nl/assets/car-kit),
[Platformer Kit 4.1](https://kenney.nl/assets/platformer-kit), and
[Blocky Characters 2.0](https://kenney.nl/assets/blocky-characters). Each selected pack includes
its original license plus source/download paths and SHA-256 hashes. See the
[model source inventory](assets/models/README.md).

`assets/textures/kenney-blocky/texture-a.png` also demonstrates standalone texture generation.
Embedded textures default to their original dimensions with lossless encoding.
The specific rule for `blocky-characters/character-a.glb` demonstrates lossy color
texture compression at quality 70 and half-size dimensions. Referenced images stay embedded in model
outputs even when the same artwork is also selected as a standalone texture.

Minimal triangles, simple materials, and Khronos fixtures remain in the assets package's
[test fixtures](../../packages/assets/test/fixtures/models/README.md) for focused regression
checks. The example itself uses Kenney models.

See the [models reference](../../docs/reference/models.md) for configuration and limitations.

## Adapt the example

Keep the entry, configuration imports and asset sources together. Change ad interaction settings and
store destinations for your campaign. Example store URLs are test destinations. Validate the final
playable on the intended browser/device and ad host; a local preview is not network certification.

## Resources

Follow the attribution and license files next to the assets. The repository's MIT license applies
to original code and does not replace third-party font, Spine or artwork terms.
