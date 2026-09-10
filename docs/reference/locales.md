# Locales

The project translation dictionary selected by locale rules.

Rules accept selection fields and no processor options. Standalone asset configuration chooses `language` and `fallback`; project configuration expands its language list into builds. The resolved dictionary is loaded by the runtime localization service and contributes characters to font subsets. Use the example translations for the authored dictionary structure.

## Source and Configuration

This example reads `locales/translations.jsonc` below `assets/`. Save the configuration as
`replayable.assets.ts` and run `pnpm exec replayable assets`.

```ts
import { defineConfig } from '@replayablejs/assets';

export default defineConfig({
  sourceDir: 'assets',
  outDir: 'src/assets/resources',
  localization: { language: 'en', fallback: 'en' },
  assets: {
    locales: [{}],
  },
  emit: { assets: 'src/assets/assets.ts' },
});
```

Use phrase keys consistently in application code. Each generated variant retains its resolved language values, including configured fallback values.

## Translation Dictionary

```json
{
  "play": { "en": "Play", "es": "Jugar" },
  "install": { "en": "Install" }
}
```

With Spanish selected and English fallback, `play` becomes `Jugar` and `install` becomes `Install`.
Include the locale category in the asset rules so readiness loads the dictionary.

```ts
import { playable } from '@replayablejs/runtime';

await playable.ready();
const button = document.createElement('button');
button.textContent = playable.localization.translate('play');
playable.container.append(button);
```

The language is selected at build time. Configure multiple project languages to produce separate
variants. Resolved translations also contribute characters to [font subsets](./fonts.md).

## Related

See [asset configuration](./assets.md) for selection, output and bundles. The
[asset example](https://github.com/replayablejs/replayable/tree/main/examples/basic-assets)
contains source resources and executable rules.
