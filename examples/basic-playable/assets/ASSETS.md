# Assets

## Shared example artwork

The images in `sprites/` are copies of the artwork in `basic-pixi-playable`:

- `gameplay/background.jpg`: blue gameplay background, copied from the Pixi example's `sprites/cta/bg.jpg`.
- `endcard/background.jpg`: green endcard background, copied from the Pixi example's `sprites/play/bg.jpg`.
- `ui/logo.png`: branding.
- `ui/persistent-cta-button.png`, `ui/endcard-button.png`: shared button surfaces.
- `ui/panel.png`: nine-slice background for both the puzzle and wheel panels.

Names describe their role in this example; the Pixi source filenames remain unchanged.

The shared sound icons now belong to `packages/devtools/src/sound-control/assets`.
They are development UI, not gameplay assets, and are absent from production bundles.

These source copies keep each example independently buildable. Replayable processes
them as standalone sprites for DOM use, rather than a Pixi texture atlas. Update
both examples when changing the shared artwork. No new license is asserted here;
the artwork retains the provenance of the Pixi example's original assets.

Images belong to the primary bundle. The example registers a DOM image handler
before `playable.ready()` and reads the loaded images through generated registries.
CSS uses the CTA textures as nine-slice borders. Buttons follow the Pixi example's
authored proportions and safe-area sizing; localized labels shrink to fit their
text areas without changing the artwork's dimensions. The font remains Noto Sans Armenian.

## Noto Sans Armenian

- Source: [Google Fonts](https://fonts.google.com/noto/specimen/Noto+Sans+Armenian)
- License: SIL Open Font License 1.1
- Files: `fonts/NotoSansArmenian.ttf`, `fonts/NotoSansArmenian-OFL.txt`

Replayable subsets the source font for each fixed-language variant and emits WOFF2.

## Sound

- Effects: [Casual Game Sounds](https://dustyroom.com/free-casual-game-sounds/)
  by Dustyroom, CC0
- Music: [Swinging Sweet](https://opengameart.org/content/short-loops-background-music-pack)
  by hernandack, CC0
- Licenses: `sounds/Dustyroom-Casual-Game-Sounds-CC0.txt`,
  `sounds/Swinging-Sweet-CC0.txt`

Replayable transcodes each source to its smallest supported output. Audio-disabled
variants exclude the complete `sounds` category before asset processing.
