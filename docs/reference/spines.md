# Spines

Export directories containing a skeleton, atlas and referenced texture pages below `spines/`.

Rules match the export directory. Image options apply to each texture page; skeleton and atlas formats are retained. Scale is also emitted as metadata. Install the optional Pixi Spine integration before readiness. Use compatible Spine exports and runtime versions, and comply with the separate Spine and artwork licenses.

## Source and Configuration

This example reads `spines/character/` below `assets/`. Save the configuration as
`replayable.assets.ts` and run `pnpm exec replayable assets`.

```ts
import { defineConfig } from '@replayablejs/assets';

export default defineConfig({
  sourceDir: 'assets',
  outDir: 'src/assets/resources',
  localization: { language: 'en', fallback: 'en' },
  assets: {
    spines: [{ match: 'character', options: { scale: 0.5 } }],
  },
  emit: { assets: 'src/assets/assets.ts' },
});
```

Place the skeleton, atlas and all referenced texture pages together in this directory. Register `createSpineIntegration()` before runtime readiness; see [Pixi](./pixi.md#optional-spine).

## Related

See [asset configuration](./assets.md) for selection, output and bundles. The
[asset example](https://github.com/replayablejs/replayable/tree/main/examples/basic-assets)
contains source resources and executable rules.
