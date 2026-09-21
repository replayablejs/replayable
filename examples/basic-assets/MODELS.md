# Model layouts and configuration

**A folder per model is optional.** Put model entry files under `assets/models/`.
Select `.obj`, `.gltf`, or `.glb` files in `assets.models`. The pipeline follows their
material, buffer, and image references and produces **one self-contained `.glb` per
selected entry**. It does not bundle several independent models into one scene.

The main [configuration](replayable.assets.ts) selects every model with Meshopt.
All layouts below are real, checked-in Kenney examples, including animations where
supported by the source format. Derived layouts retain the original geometry;
they are not triangle placeholders.

## Supported source layouts

Paths below are relative to `assets/models/`. Pick whichever layout suits your source.

```text
models/
├── chest.glb                         # Flat, self-contained model
├── layouts/
│   ├── glb-embedded/
│   │   └── chest.glb                 # Same form in a dedicated model folder
│   ├── obj-geometry/
│   │   └── tree.obj                  # Geometry only; no material dependency
│   ├── obj-material/
│   │   ├── car.obj                   # Geometry + UVs; references car.mtl
│   │   └── car.mtl                   # Plain blue material; no image required
│   ├── gltf-external/
│   │   ├── chest.gltf                # JSON scene, materials, animations
│   │   ├── chest.bin                 # Referenced geometry/animation data
│   │   └── Textures/colormap.png     # Referenced texture
│   └── gltf-embedded/
│       └── chest.gltf                # Buffers/images embedded as data URIs
├── car-kit/
│   ├── race.obj                      # Textured OBJ
│   ├── race.mtl
│   └── Textures/colormap.png
├── platformer-kit/                   # Several entries sharing one palette
│   ├── tree.obj
│   ├── tree.mtl
│   ├── chest.glb                     # GLB with an external texture
│   ├── character-oopi.glb            # Skinned model with 25 animation clips
│   └── Textures/colormap.png
└── blocky-characters/
    ├── character-a.glb               # 27 clips animating body-part nodes
    └── Textures/texture-a.png
```

An OBJ can contain geometry without an MTL. An OBJ plus MTL is also sufficient when
materials use colors without image maps. Textured materials additionally require
all referenced images. Every explicit `usemtl` name must match a `newmtl` definition
in a referenced MTL library; an undefined name fails the build. OBJ does not carry skeletal animation; use glTF/GLB for
skins and animation clips. A `.glb` extension alone does not guarantee that its
images are embedded: the original Kenney GLBs here reference external PNG files.

References inside files determine dependencies, not matching filenames. Preserve
relative paths and case. For OBJ, keep the MTL beside or below the OBJ and images
beside or below their referring MTL. Do not select MTL, BIN, or PNG files as model
entries. Referenced images need no separate `textures` rule. A standalone copy
under `assets/textures/` is an independent asset with its own image options.

## IDs and outputs

The extensionless entry path relative to `assets/models/` is the model ID:

| Source entry                        | Model ID                        | Resource relative to `outDir`              |
| ----------------------------------- | ------------------------------- | ------------------------------------------ |
| `chest.glb`                         | `chest`                         | `models/chest.glb`                         |
| `layouts/obj-material/car.obj`      | `layouts/obj-material/car`      | `models/layouts/obj-material/car.glb`      |
| `platformer-kit/character-oopi.glb` | `platformer-kit/character-oopi` | `models/platformer-kit/character-oopi.glb` |

Each generated runtime entry has `src` and `compression`. It appears under
`assets.primary.models` or `assets.secondary.models`. The registry lists IDs.
Two selected entries such as `car.obj` and `car.glb` in the same directory collide;
use different names or folders, or select only one representation.

## Every model rule option

```ts
models: [
  {
    match: '**',
    exclude: ['**/character-*.glb'],
    options: {
      compression: 'meshopt',
      textures: { lossless: true, scale: 1 },
    },
  },
],
```

| Field                       | Allowed values                   | Default / meaning                                                                                           |
| --------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `assets.models`             | Array of model rules             | Omitted or `[]`: no models selected                                                                         |
| `match`                     | Glob string                      | `'**'`: all supported entry files; relative to `assets/models/`                                             |
| `exclude` on a rule         | Array of glob strings            | No exclusions; same category-relative paths as `match`                                                      |
| `options.compression`       | `'none'`, `'meshopt'`, `'draco'` | `'none'`; this example explicitly chooses `'meshopt'`                                                       |
| `options.textures.scale`    | Positive number                  | `1`; scales embedded texture dimensions                                                                     |
| `options.textures.lossless` | Boolean                          | `true` when the entire `textures` object is omitted; `false` when the object is provided without this field |
| `options.textures.quality`  | Integer from `1` through `100`   | Optional encoder default; only valid when `lossless` is false                                               |

`models: [{}]` selects all entries with schema defaults. Setting `textures: {}`
selects general image defaults: scale 1 and lossy encoding. For predictable color
preservation, explicitly use `textures: { lossless: true }`. Setting `quality`
with `lossless: true` is invalid. There are no model rule options for renderer,
output format, animation selection, or codec level.

Texture settings apply to color images. Normal, occlusion, metallic/roughness, and
other data textures retain their source bytes at scale 1, or use lossless PNG when
resized. This also applies when a texture is shared between color and data slots.
An unchanged source image may be retained when smaller than its encoded candidate;
`quality` does not promise a particular file format or exact output size. KTX2
textures can pass through unchanged, but this pipeline does not generate or resize
KTX2. Geometry compression and image encoding are separate operations.

## Selection, overrides, and bundles

Rules are evaluated in order. **The last matching rule replaces the entire options
object**, rather than merging with earlier rules. An excluded entry does not match
that particular rule; it can still match another rule. To veto an entry across all
rules, use top-level `exclude` with source-relative paths including `models/`.

```ts
assets: {
  models: [
    { options: { compression: 'meshopt', textures: { quality: 60 } } },
    // Resets this entry to compression:none and lossless textures.
    { match: 'platformer-kit/chest.glb' },
  ],
},
exclude: ['models/**/character-*.glb'],
```

Models start in primary. Secondary bundle patterns are also source-relative and
include `models/`. A secondary exclusion leaves the asset in primary; it does not
remove it from the build. Select entry files, not their dependency images.

```ts
bundles: {
  secondary: {
    include: ['models/platformer-kit/**'],
    exclude: ['models/platformer-kit/tree.obj'],
  },
},
```

## Run every configuration

[scripts/model-examples.ts](scripts/model-examples.ts) contains executable recipes
for every model rule field and compression choice, texture defaults and overrides,
selection, both exclusion scopes, and bundle assignment.

From the repository root, after installing dependencies and running `pnpm build`:

```sh
pnpm --filter @replayablejs/example-basic-assets models:examples list
pnpm --filter @replayablejs/example-basic-assets models:examples meshopt
pnpm --filter @replayablejs/example-basic-assets models:examples all
```

| Recipe             | Demonstrates                                    |
| ------------------ | ----------------------------------------------- |
| `disabled`         | Empty model rules                               |
| `defaults`         | All entries with implicit schema defaults       |
| `meshopt`          | All entries with Meshopt                        |
| `none`             | Explicitly uncompressed geometry                |
| `draco`            | All entries with Draco                          |
| `single`           | One flat filename                               |
| `folder`           | A shared pack folder                            |
| `format`           | Only OBJ entries                                |
| `rule-exclude`     | Category-relative exclusion on one rule         |
| `global-exclude`   | Source-relative veto across rules               |
| `override`         | Last matching rule replaces all options         |
| `lossless`         | Explicit original-size lossless textures        |
| `lossy`            | Lossy color textures with quality 70            |
| `texture-defaults` | Explicit empty texture options                  |
| `scaled`           | Half-size lossless textures                     |
| `bundles`          | Secondary include/exclude with primary fallback |

Each recipe writes resources, a typed assets module, and registries into its own
`dist/model-examples/<recipe>/` directory. These are model-only builds. The main
`pnpm --filter @replayablejs/example-basic-assets assets` command builds all asset
categories into `src/assets/` using `replayable.assets.ts`.

## Source provenance and runtime loading

Original pack directories retain Kenney's CC0 licenses and source manifests.
The six additional model entries are derived from the car, tree, and chest; the
chest variants retain its three clips. [layouts/SOURCE.json](assets/models/layouts/SOURCE.json)
records inputs, modifications, and output hashes. Regenerate those source layouts
with `pnpm --filter @replayablejs/example-basic-assets models:prepare`.

The pipeline supports OBJ, glTF, and GLB, not arbitrary FBX or Blender files. Export
those to glTF/GLB first. Geometry-only and plain-color OBJ variants intentionally
omit the original palette appearance.

Meshopt outputs require a Meshopt decoder in the runtime loader; Draco outputs
require a Draco decoder. Uncompressed outputs require neither geometry decoder.
This fixture generates files and metadata; it does not install a Three.js runtime
integration. See the [model reference](../../docs/reference/models.md) for the
pipeline contract and limitations.
