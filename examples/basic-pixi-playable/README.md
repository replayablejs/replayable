# Pixi/Spine two-card ad

English and Spanish; eight network profiles. Reveal both cards to finish. Scene features own the tutorial, inactivity hint, layout, audio requests and star-rating endcard.

This is a private example workspace. It is not an npm package to publish.

## Run

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm --filter @replayablejs/example-basic-pixi-playable dev
# Stop the server before building.
pnpm --filter @replayablejs/example-basic-pixi-playable build
pnpm --filter @replayablejs/example-basic-pixi-playable export
```

Read the TypeScript configuration files in this directory before editing generated resources.
Source assets and generated destinations are defined there. Playable projects share asset paths
between development and production, so run those operations separately.

## Adapt the example

Keep the entry, configuration imports and asset sources together. Change ad interaction settings and
store destinations for your campaign. Example store URLs are test destinations. Validate the final
playable on the intended browser/device and ad host; a local preview is not network certification.

## Resources

Follow the attribution and license files next to the assets. The repository's MIT license applies
to original code and does not replace third-party font, Spine or artwork terms.
