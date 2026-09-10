# Atlases

Directories of images selected as logical assets below `atlases/`.

Alongside image options, atlas packing accepts `allowTrim` (true), `allowRotation` (true), `padding` (2), `extrude` (0), and `powerOfTwo` (false). Padding/extrusion must be nonnegative integers. Generated frame metadata preserves the information needed to reconstruct trimmed or rotated sprites.

## Source and Configuration

This example reads `atlases/ui/button.png` below `assets/`. Save the configuration as
`replayable.assets.ts` and run `pnpm exec replayable assets`.

```ts
import { defineConfig } from '@replayablejs/assets';

export default defineConfig({
  sourceDir: 'assets',
  outDir: 'src/assets/resources',
  localization: { language: 'en', fallback: 'en' },
  assets: {
    atlases: [{ match: 'ui', options: { padding: 2, extrude: 1 } }],
  },
  emit: { assets: 'src/assets/assets.ts' },
});
```

The rule selects the `ui` directory as one atlas. Generated frame metadata accounts for packing, trimming and rotation.

## Related

See [asset configuration](./assets.md) for selection, output and bundles. The
[asset example](https://github.com/replayablejs/replayable/tree/main/examples/basic-assets)
contains source resources and executable rules.
