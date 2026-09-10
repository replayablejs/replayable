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
copy, difficulty, colors or endcards.

## Asset processing

Use the category layout under the configured `sourceDir`: `sprites`, `textures`, `atlases`,
`spines`, `shaders`, `sounds`, `fonts`, `locales`. Omitted category rules select nothing.
A rule such as `sprites: [{}]` selects that category; file matches are category-relative.
Grouped Spine exports are matched by directory ID, such as `raptor`, not `raptor/**`.

Use generated modules and their types rather than guessing cache keys or resource shapes.
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
await playable.loader.load('secondary');
// Only now create objects or play effects that require its resources.
```

Keep first-interaction resources in primary. Start secondary loading at a deliberate point, display
appropriate waiting/error UI if an interaction depends on it, and handle rejection. Repeated
requests share the same promise, including failure; calling it again is not a retry strategy.

Secondary bundles defer runtime loading/decoding. Single-file delivery can still embed their bytes:
do not claim smaller total export size, a separate network download, or permission for remote
asset requests. Measure the final artifact and loading behavior. `playOneShot` drops effects when
blocked or unloaded; managed looping playback can wait for readiness.
