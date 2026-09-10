# Shaders

Directories below `shaders/` containing both `vert.glsl` and `frag.glsl`.

Shader rules accept selection fields but no processor options. Sources are copied unchanged. The resolver checks that both files exist, not GLSL syntax, shader versions or compatibility with your renderer. Runtime built-in loading returns the two source strings.

## Source and Configuration

This example reads `shaders/glow/vert.glsl and shaders/glow/frag.glsl` below `assets/`. Save the configuration as
`replayable.assets.ts` and run `pnpm exec replayable assets`.

```ts
import { defineConfig } from '@replayablejs/assets';

export default defineConfig({
  sourceDir: 'assets',
  outDir: 'src/assets/resources',
  localization: { language: 'en', fallback: 'en' },
  assets: {
    shaders: [{ match: 'glow' }],
  },
  emit: { assets: 'src/assets/assets.ts' },
});
```

Both files are required. Compile the generated source strings with your renderer and handle shader compilation errors there.

## Related

See [asset configuration](./assets.md) for selection, output and bundles. The
[asset example](https://github.com/replayablejs/replayable/tree/main/examples/basic-assets)
contains source resources and executable rules.
