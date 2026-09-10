# Sounds

Audio files selected below `sounds/`.

Options: `bitrate` 8–512 kbps (default 96), `channels` mono/stereo/source (default mono), and `sampleRate` 8000–192000 Hz (default 32000). Processing selects the smallest generated MP3/M4A candidate. Encoding requires the installed FFmpeg dependency. Runtime audio applies capability, gesture and visibility rules.

## Source and Configuration

This example reads `sounds/click.wav` below `assets/`. Save the configuration as
`replayable.assets.ts` and run `pnpm exec replayable assets`.

```ts
import { defineConfig } from '@replayablejs/assets';

export default defineConfig({
  sourceDir: 'assets',
  outDir: 'src/assets/resources',
  localization: { language: 'en', fallback: 'en' },
  assets: {
    sounds: [{ match: 'click.wav', options: { bitrate: 96, channels: 'mono', sampleRate: 32000 } }],
  },
  emit: { assets: 'src/assets/assets.ts' },
});
```

For stereo music, choose `channels: 'stereo'` or preserve source channels with `'source'`. See [runtime audio](./runtime.md#audio) for managed playback and immediate effects.

## Related

See [asset configuration](./assets.md) for selection, output and bundles. The
[asset example](https://github.com/replayablejs/replayable/tree/main/examples/basic-assets)
contains source resources and executable rules.
