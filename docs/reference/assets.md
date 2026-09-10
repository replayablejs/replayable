# Assets

`@replayablejs/assets` validates asset rules, processes source resources and emits TypeScript
modules. Its main APIs are `defineConfig`, `assetConfigSchema` and `buildAssets`.

```ts
import { defineConfig } from '@replayablejs/assets';

export default defineConfig({
  sourceDir: 'assets',
  outDir: 'src/assets/resources',
  localization: { language: 'en', fallback: 'en' },
  assets: { sprites: [{}] },
  emit: {
    assets: 'src/assets/assets.ts',
    registries: 'src/assets/registries',
  },
});
```

Save this as `replayable.assets.ts` and run `replayable assets` from the project root. Within
project configuration, omit asset `localization`; variant expansion supplies the selected language.
`buildAssets(config, projectRoot?)` returns generation counts and destinations.

## Selection and output

Sources are grouped by category: sprites, textures, atlases, spines, shaders, sounds, fonts and
locales. Omitted category lists select nothing. A rule's `match` defaults to `**`; `exclude`
removes matching sources. Top-level exclusions use source-relative paths.

File categories match paths below their category directory. Grouped assets match their directory:
a Spine export at `spines/raptor` is selected by `match: 'raptor'`, not `raptor/**`.
Use an output directory separate from source assets. Generated files are build products; edit
source resources or rules and regenerate rather than editing the output.

## Bundles

Unmatched bundle selections remain in `primary`. Use `bundles.secondary.include` and optional
`exclude` to move selected IDs into `secondary`, for example `sounds/**`. Primary loads during
runtime readiness; start secondary loading explicitly through `playable.loader.load('secondary')`.

`emit.assets` defaults to `src/assets/assets.gen.ts`. `emit.registries` optionally generates
category registries. Runtime asset contracts come from `@replayablejs/runtime/assets`.

The [asset-only example](https://github.com/replayablejs/replayable/tree/main/examples/basic-assets)
contains working source layouts and rules for the supported categories. See the category pages
for processor options and licensing considerations.

## Choose a Processor

| Source                   | Processor                 | Typical use                   |
| ------------------------ | ------------------------- | ----------------------------- |
| Individual images        | [Sprites](./sprites.md)   | UI and scene images           |
| Individual images        | [Textures](./textures.md) | Texture resources             |
| Image groups             | [Atlases](./atlases.md)   | Pack multiple images together |
| Spine exports            | [Spines](./spines.md)     | Skeletal animation            |
| Shader pairs             | [Shaders](./shaders.md)   | Vertex and fragment programs  |
| Audio files              | [Sounds](./sounds.md)     | Music and effects             |
| Font files               | [Fonts](./fonts.md)       | Subsetted text fonts          |
| Translation dictionaries | [Locales](./locales.md)   | Language-specific text        |

## Generation Workflow

1. Put original resources below the corresponding category in `sourceDir`.
2. Add selection rules for the categories the playable uses.
3. Generate assets with the CLI, or let the project build process each variant.
4. Use the generated modules in application code and load their bundle before use.

For example, a project selecting sprites and sounds can keep this source layout:

```text
assets/
├─ sprites/
│  └─ button.png
└─ sounds/
   └─ click.wav
```

The category rule `match: 'button.png'` selects that sprite. A top-level exclusion refers to
`sprites/button.png` because it is relative to the source root.

::: tip Keep generation reproducible
Treat source resources and configuration as inputs. Regenerate output after changing either,
including when changing language or variant exclusions.
:::

## Troubleshooting

- **Nothing was generated:** an omitted category selects nothing; add a rule such as `sprites: [{}]`.
- **A rule does not match:** check whether it is category-relative or source-relative, and whether
  the processor selects files or grouped directories.
- **A loaded scene cannot find an asset:** check exclusions and whether the asset belongs to secondary.
- **Export is too large:** reduce source dimensions or adjust processor encoding options, then rebuild.
