# Third-party assets

## Kenney City Builder

Source: https://github.com/KenneyNL/Starter-Kit-City-Builder

Revision: `4535092b740b378b700efd9df9e27a631815b84a`.

Copied assets:

- `assets/models/city/*.glb`: nine selected models from upstream `models/`.
- `assets/textures/city-colormap.png`: their shared color texture.
- `assets/sounds/*.ogg`: three placement sounds and the selection sound from upstream `sounds/`.

The upstream README identifies its models, sprites, and sound effects as
[CC0](https://creativecommons.org/publicdomain/zero/1.0/).
The source GLBs have their palette texture references removed, preserving geometry,
UVs, and material properties. The three house models are also split into named
`ground` and `building` nodes, preserving their assembled geometry. The building
node pivots at the top of its base so it can animate without scaling the ground. The shared palette is moved without modification.
Sounds are unmodified. Generated build assets are compressed by Replayable.

The upstream code license is reproduced below for reference. No Godot scripts
are copied into this example.

MIT License

Copyright (c) 2025 Kenney

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Kenney UI Pack 2.0

Source: https://kenney.nl/assets/ui-pack

License: CC0; original notice in `licenses/kenney-ui-pack.txt`.

- `assets/sprites/ui/cta-button.png`: unmodified `PNG/Yellow/Double/button_rectangle_depth_flat.png`.
- `assets/sprites/ui/endcard-button.png`: unmodified `PNG/Green/Double/button_rectangle_depth_flat.png`.
- `assets/fonts/KenneyFuture.ttf`: unmodified `Font/Kenney Future.ttf`.

The button is scaled uniformly at its original 3:1 aspect ratio. The persistent CTA uses yellow; the end-card CTA uses green.

## Kenney Game Icons 1.0

Source: https://kenney.nl/assets/game-icons

License: CC0; original notice in `licenses/kenney-game-icons.txt`.

- `assets/sprites/ui/home.png`: `PNG/White/2x/home.png`, with transparent edges trimmed.

The City Builder logo is an HTML composition of this home icon and text using
Kenney Future. It is an example-specific wordmark, not Kenney's own logo or a
premade logo supplied by Kenney. The previous Replayable placeholder artwork is removed.
