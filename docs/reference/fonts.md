# Fonts

Font sources selected below `fonts/`.

Each rule requires `options.family`. Output is subset WOFF2. Subsets include printable ASCII and resolved locale text; `extraCharacters` adds literal characters used outside the dictionary. Font encoding does not grant embedding or redistribution rights. Preserve the source font license and select a family name used consistently by your scene.

## Source and Configuration

This example reads `fonts/PatrickHand-Regular.ttf` below `assets/`. Save the configuration as
`replayable.assets.ts` and run `pnpm exec replayable assets`.

```ts
import { defineConfig } from '@replayablejs/assets';

export default defineConfig({
  sourceDir: 'assets',
  outDir: 'src/assets/resources',
  localization: { language: 'en', fallback: 'en' },
  assets: {
    fonts: [
      {
        match: 'PatrickHand-Regular.ttf',
        options: { family: 'Patrick Hand', extraCharacters: '★' },
      },
    ],
  },
  emit: { assets: 'src/assets/assets.ts' },
});
```

Use `Patrick Hand` as the font family in your scene after readiness. The extra star is retained even when no translation contains it. Add characters produced dynamically by ad interactions here.

## Related

See [asset configuration](./assets.md) for selection, output and bundles. The
[asset example](https://github.com/replayablejs/replayable/tree/main/examples/basic-assets)
contains source resources and executable rules.
