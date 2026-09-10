# Sprites

Individual images selected below `sprites/`.

Image options are `scale` (positive; default 1), `lossless` (default false), and optional lossy `quality` from 1 to 100. Do not combine `lossless: true` with `quality`. The processor chooses an output encoding; generated metadata describes the result.

## Source and Configuration

This example reads `sprites/button.png` below `assets/`. Save the configuration as
`replayable.assets.ts` and run `pnpm exec replayable assets`.

```ts
import { defineConfig } from '@replayablejs/assets';

export default defineConfig({
  sourceDir: 'assets',
  outDir: 'src/assets/resources',
  localization: { language: 'en', fallback: 'en' },
  assets: {
    sprites: [{ match: 'button.png', options: { scale: 0.5, quality: 80 } }],
  },
  emit: { assets: 'src/assets/assets.ts' },
});
```

Use scale to reduce image dimensions before encoding. Quality controls lossy output; omit quality when using `lossless: true`.

## Related

See [asset configuration](./assets.md) for selection, output and bundles. The
[asset example](https://github.com/replayablejs/replayable/tree/main/examples/basic-assets)
contains source resources and executable rules.
