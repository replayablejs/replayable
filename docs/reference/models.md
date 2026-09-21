# Models

The `models` category accepts `.obj`, `.gltf`, and `.glb` entry points and generates one
self-contained `.glb` per model. Geometry, materials, animations, skins, and referenced images
are stored in the GLB. Conversion uses obj2gltf and glTF Transform.

## Source layout

```text
assets/models/car/
├─ car.obj
├─ car.mtl
└─ paint.png
```

OBJ can contain geometry alone. A referenced MTL supplies materials, and referenced images
supply textures. An OBJ plus MTL is sufficient when the materials only use plain colors.
Keep OBJ dependencies beside their referring file or in child directories; parent-directory
references are rejected by the converter. glTF sources may reference local BIN and image files
or embed them. Source GLBs can also reference external texture images, as Kenney's exports do;
these images are embedded in the generated output. Network dependencies are not fetched.

Rules select model entry files, not MTL/image/BIN dependencies. For this layout,
`match: 'car/*.obj'` selects the model. Referenced dependencies are embedded even if they do not
match the rule. Exclude `models/car/car.obj` to omit the whole model. Files in `models/` are not
also emitted as standalone `textures` or `sprites`.

## Configuration

```ts
assets: {
  models: [
    {}, // Every supported model; no geometry compression; lossless texture policy.
    {
      match: 'car/*.obj',
      options: {
        compression: 'meshopt',
        textures: { scale: 0.5, quality: 75 },
      },
    },
  ],
},
bundles: {
  secondary: { include: ['models/car/**'] },
},
```

The final matching rule supplies all options. Model IDs use the extensionless path below
`models/`, for example `car/car`. OBJ and GLB sources with the same output basename conflict;
select one or use different names.

| Option              | Default                           | Behavior                                                        |
| ------------------- | --------------------------------- | --------------------------------------------------------------- |
| `compression`       | `'none'`                          | `'none'`, `'draco'`, or `'meshopt'`                             |
| `textures.scale`    | `1`                               | Positive image-width multiplier; preserves aspect ratio and UVs |
| `textures.lossless` | `true` when `textures` is omitted | Use lossless image candidates; incompatible with `quality`      |
| `textures.quality`  | Encoder defaults                  | Integer 1–100 for lossy color-image encoding                    |

An explicit `textures` object follows the existing image options: omitting `lossless` selects
lossy encoding. Use `textures: { lossless: true, scale: 0.5 }` to resize losslessly encoded images.
Lossless encoding does not reverse damage in source JPEGs, and resizing changes pixel values.

Color images share the image pipeline's scaling and encoding implementation. Embedded outputs
compare PNG/JPEG/WebP candidates and retain the original when it is smaller and no resizing
is requested. No trimming, rotation, or atlas packing is applied. Images used in any non-color
slot (normal, metallic-roughness, occlusion, or unknown slots) keep their bytes when unscaled;
when resized they use PNG. This also protects an image shared between color and data slots.
Existing KTX2 images pass through under the default policy; resizing or re-encoding them is
unsupported and requires conventional source images. New KTX2 compression is not provided.

## Geometry compression

Draco compresses mesh geometry. Meshopt also supports animation and morph-target data.
Both use quantization and may introduce small numeric changes. Valid texture coordinates
outside `[0, 1]` remain floating-point when Meshopt skips their quantization. Existing compressed inputs
are decoded before the selected output policy is applied. `'none'` removes geometry codec
requirements, but cannot recover precision already lost in a compressed source.

Compression is opt-in because the playable must include a matching decoder. Compare final
ad size including that decoder, especially for small models. This pipeline prepares assets;
it does not install a Three.js loader or copy decoder scripts into a playable.

## Generated assets

```ts
// Shape inside the generated assets module; the actual src is a static GLB import.
primary: {
  models: {
    'car/car': { src: carGLB, compression: 'meshopt' },
  },
},
```

Model entries use the exported `ModelAsset` type. Registries expose stable model IDs.
The build plugin already treats GLB imports as binary resources: inline delivery embeds the
file, while resource delivery emits its URL. A future renderer integration can register a
`models` handler with the runtime loader. Model generation itself needs no Three.js dependency.

## Diagnostics and example

Missing or unreadable MTL, texture, or glTF buffer dependencies fail the build with the model
source path. An explicit OBJ `usemtl` name must have a matching `newmtl` definition
in a referenced MTL library; undefined names fail instead of becoming default materials.
Geometry-only OBJ files remain valid. Unsupported glTF extensions also fail rather than
silently discarding authored data. OBJ material conversion maps legacy MTL properties to glTF materials; it is not a general
importer for FBX, Blender projects, or every vendor-specific material feature.

The [basic-assets example](https://github.com/replayablejs/replayable/tree/main/examples/basic-assets)
uses real CC0 models from Kenney's Car Kit, Platformer Kit, and Blocky Characters packs:
a race car, tree, animated chest, skinned platformer character, and animated blocky character.
It exercises 55 animation clips, external palette/character images, OBJ/MTL conversion,
and GLB input. Licenses, original archive paths, and SHA-256 hashes are kept with the models.
Minimal geometry and glTF fixtures remain in the assets package's regression tests.

## Executable configuration examples

The [basic-assets model guide](https://github.com/replayablejs/replayable/blob/main/examples/basic-assets/MODELS.md) shows all supported
source layouts with real Kenney models, documents every model option and default,
and provides 16 runnable recipes for compression, texture processing, selection,
exclusions, overrides, and bundles.
