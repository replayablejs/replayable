# Kenney model sources

Five real game models demonstrate OBJ/MTL conversion, external textures, material colors,
node animation, skeletal animation, and geometry compression.

| Pack | Selected sources | Included dependencies |
| --- | --- | --- |
| [Car Kit 3.1](https://kenney.nl/assets/car-kit) | `car-kit/race.obj` | `race.mtl`, `Textures/colormap.png` |
| [Platformer Kit 4.1](https://kenney.nl/assets/platformer-kit) | `platformer-kit/tree.obj`, `chest.glb`, `character-oopi.glb` | `tree.mtl`, shared `Textures/colormap.png` |
| [Blocky Characters 2.0](https://kenney.nl/assets/blocky-characters) | `blocky-characters/character-a.glb` | `Textures/texture-a.png` |

All files are CC0-1.0, created and distributed by Kenney. Each pack directory retains the
original `License.txt`. Its `SOURCE.json` records the official download URL, archive SHA-256,
original archive paths, and per-file SHA-256 hashes. Model and image bytes are unchanged;
only their containing format directories were removed.

The source GLBs reference external images. Keep each model's `Textures/` directory beside it.
Replayable embeds those dependencies in one generated GLB per selected entry point.

The platformer character contains 25 animation clips and a six-joint skin, the chest contains
three clips, and the blocky character contains 27 clips animating its body-part nodes. See
`../..`'s example README and `replayable.assets.ts` for the compression and bundle choices.

## Additional layout examples

The root `chest.glb` and five entries under `layouts/` are derived CC0 examples
from these same Kenney models. They demonstrate flat and per-model embedded GLB,
geometry-only OBJ, plain-color OBJ + MTL, and external or embedded glTF.
`layouts/SOURCE.json` documents modifications and hashes; original pack files stay
unchanged. See [the complete layout and configuration guide](../../MODELS.md).
