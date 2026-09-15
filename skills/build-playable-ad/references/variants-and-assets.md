# Variants and assets

## Creative variations

Keep one interaction implementation and expose differences through typed parameters. For example,
add these fields to the starter's `defineConfig` object:

```ts
params: {
  difficulty: {
    type: 'string',
    default: 'easy',
    description: 'Puzzle difficulty',
    options: ['easy', 'hard'],
  },
},
versions: {
  easy: { params: { difficulty: 'easy' } },
  hard: { params: { difficulty: 'hard' } },
},
networks: { preview: {}, google: {} },
localization: { languages: ['en', 'es'], fallback: 'en' },
```

This defines eight variants: two creative versions × two networks × two languages. Inspect
`replayable config --json` and the installed runtime config type for reading resolved parameter
values. Number parameters additionally require `range: { min, max, step }`; string parameters
require `options`. Value precedence is base, then network, then creative-version override.

Language selection alone does not translate application copy. Supply locale dictionaries or
implement localized content and verify text fitting. Preview a specific combination with
`replayable dev --version hard --language es`. Do not duplicate whole projects merely to change
copy, difficulty, colors or endcards. Prefer CSS variables for DOM themes so versions share the
same layout and components. Extract large configuration sections into typed subfiles when useful,
following the matching basic example rather than reproducing nested root wrappers in each file.

Parameter selection and file selection are separate: pair creative parameters with the asset
exclusions that remove unused resources. Check the installed override schema before promising
per-version or per-network bundle assignments; alpha.4 exposes asset exclusions there, not bundle
overrides. A limitation in that release is not a universal limitation of Replayable.

## Asset processing

Use the category layout under the configured `sourceDir`: `sprites`, `textures`, `atlases`,
`spines`, `shaders`, `sounds`, `fonts`, `locales`. Omitted category rules select nothing.
A rule such as `sprites: [{}]` selects that category; file matches are category-relative.
Grouped Spine exports are matched by directory ID, such as `raptor`, not `raptor/**`.

Use generated modules and their types rather than guessing cache keys or resource shapes.
Access sprites/sounds through the generated registries rather than string literals scattered
through features.

Use Replayable's locale resources and the matching example's lookup for translatable visible
copy when localization is required, including projects initially shipping only English. Keep
internal identifiers out of translation dictionaries and validate text fitting for each language.
Use non-breaking punctuation spacing where the language requires it, such as French before `!`.

Localized filenames resolve to one logical registry key: for example, `pointer.png`,
`pointer.fr.png` and `pointer.it.png` can share `sprites.pointer`. Verify the configured fallback
and the selected resource in the generated variant; do not write runtime filename switching.
Keep source artwork at its useful resolution and configure output resizing/encoding through the
asset pipeline. Verify generated dimensions and the final export's contents rather than assuming
source dimensions, displayed CSS size and delivered pixel size are the same.

Keep source resources under project ownership and retain their required license files. The skill
ships no fonts, artwork, audio or Spine exports; obtain assets suitable for the user's project.

For precise category options, use the [asset reference](https://replayablejs.github.io/replayable/reference/assets.html)
and the linked category pages.

## Deferred loading

Inside the existing `assets` configuration, selected resources can be assigned to a secondary
bundle, for example:

```ts
bundles: { secondary: { include: ['sounds/**'] } },
```

This does not select sounds by itself: add sound selection rules separately. Unmatched resources
remain primary. After runtime readiness, explicitly request the secondary bundle:

```ts
void playable.loader.load('secondary');
```

Keep resources needed immediately by the selected flow in primary, including flows that skip an
introduction. Follow the matching example's secondary-loading lifecycle; loading an empty bundle
need not require special branching. Do not delay the whole scene simply because secondary exists.
If a later interaction requires readiness that the flow does not guarantee, handle that dependency
at its owner using the public loader promise and an appropriate failure path. Respect an explicitly
chosen loading flow rather than introducing speculative gates. Repeated requests share the same
promise, including failure; calling it again is not a retry strategy.

Secondary bundles defer runtime loading/decoding. Single-file delivery can still embed their bytes:
do not claim smaller total export size, a separate network download, or permission for remote
asset requests. Measure the final artifact and loading behavior. `playOneShot` drops effects when
blocked or unloaded; managed looping playback can wait for readiness.
