# Textures

Individual images selected below `textures/` for rendering integrations.

Use the same `scale`, `lossless` and lossy `quality` options as sprites. Runtime values for this category require a renderer-owned loader; generating a texture does not install an arbitrary 3D renderer.

## Source and Configuration

This example reads `textures/background.png` below `assets/`. Save the configuration as
`replayable.assets.ts` and run `pnpm exec replayable assets`.

```ts
import { defineConfig } from '@replayablejs/assets';

export default defineConfig({
  sourceDir: 'assets',
  outDir: 'src/assets/resources',
  localization: { language: 'en', fallback: 'en' },
  assets: {
    textures: [{ match: 'background.png', options: { quality: 80 } }],
  },
  emit: { assets: 'src/assets/assets.ts' },
});
```

Load the generated texture through your rendering integration before applying it to a scene object.

## Related

See [asset configuration](./assets.md) for selection, output and bundles. The
[asset example](https://github.com/replayablejs/replayable/tree/main/examples/basic-assets)
contains source resources and executable rules.
