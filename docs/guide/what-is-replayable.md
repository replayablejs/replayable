# What is Replayable?

Replayable brings modern web technology to playable ad development. It combines fast tooling,
flexible rendering and automated asset processing in a workflow built around the constraints of
playable ads.

The TypeScript toolkit takes your application code, source assets and project configuration,
then builds and exports playable files for your selected ad networks.

You design the interactions and presentation. Replayable handles the surrounding work: processing
resources, previewing changes, loading assets, responding to the host and producing delivery files.

Want to build your first playable? Start with the [Quickstart](./getting-started.md).

## Use Cases

### Interactive Ad Experiences

Build a short ad with an introduction, user interaction and an endcard. Use ordinary DOM
elements for an interface-driven experience, or [Pixi](../reference/pixi.md) for a canvas scene
with sprites, text and animation. The optional Spine integration supports skeletal animation.

The [examples](./examples.md) show both approaches: a DOM word ad and a Pixi/Spine card ad.
They use the same runtime for readiness, audio, screen state, completion and store actions.

### Campaign Variations

Keep related creatives in one project. Configure languages, ad parameters and named
variations, then build them for the networks you select. Each combination becomes a separate
playable, so a language or campaign variation does not need its own copy of the application.

For example, two languages and three networks produce six builds for one named variation.
[Project configuration](../reference/config.md) controls the combinations and their overrides.
These creative variations are separate from Replayable's package release version.

### Reusable Asset Workflows

Use the [asset pipeline](../reference/assets.md) as part of a playable build or run it separately
with `replayable assets`. It processes images, atlases, Spine resources, shaders, sounds, fonts
and translations, and generates TypeScript modules for the selected resources.

Processing rules live alongside your code. Change a source file or an encoding option and
regenerate the outputs instead of repeating the conversion by hand.

## Developer Experience

Replayable brings application development and ad delivery into the same workflow.

- **Local development with Vite.** Run `replayable dev` to preview a variant with hot module
  replacement. Select a language or creative version from the command line.
- **TypeScript configuration.** Describe assets, screen sizes, languages, parameters and network
  choices in a validated configuration. Inspect the resolved variants with `replayable config`.
- **Generated asset modules.** Refer to processed resources through generated metadata and
  registries rather than maintaining output filenames yourself.
- **A shared runtime.** Use one interface for readiness, visibility, audio, updates, completion
  and store actions while the build selects the appropriate host integration.
- **Optional development controls.** Enable stats, a sound toggle and an endcard trigger during
  preview. Production builds select disabled implementations for these tools.

See the [CLI reference](../reference/cli.md) for commands and options.

## Built for Compact Delivery

Playable ads have limited space and need to become interactive quickly. Replayable provides
controls over both the resources you ship and when you load them.

### Process Resources at Build Time

Image and audio processing select compact encodings from generated candidates. Atlas rules
control texture packing, and font processing produces WOFF2 subsets using the selected locale's
text. Asset selection and exclusions let each variant include the resources it needs.

The final size still depends on your ad and source assets. Adjust processing options and
measure the exported file as part of preparing a campaign.

### Separate Initial and Deferred Loading

The runtime loads the primary bundle during `playable.ready()`. Put resources that can wait in
`secondary` and load that bundle explicitly after the initial scene is usable. Rendering
integrations register their loaders before readiness so the application can use loaded resources
when it constructs the scene.

### Export for the Destination

Run `replayable build` to produce runnable variants, then `replayable export` to package the
existing builds. Implemented profiles include AppLovin, Google, Liftoff, Meta, Mintegral, Moloco,
Unity and local preview. The exporter prepares the profile's delivery format and checks its
implemented resource and size rules.

Test the resulting files in the destination's tools and on the devices you support. Export
validation does not replace that campaign-specific verification.

## How It Fits Your Ad

Replayable supplies a runtime and a production pipeline, while your application owns interaction logic,
scene composition and the endcard. You can start with a small DOM scene and add rendering or
animation packages as needed. All Replayable packages share one release version.

There is no required visual editor or separate project format. The application, configuration and
processing rules are files you can review and keep in version control.

Continue with [Getting Started](./getting-started.md) to create a complete playable, or explore
[Build and Export](./build-and-export.md) to see how a project becomes delivery files.

## Acknowledgements

Created by Sargis Sargsyan through an AI-assisted engineering workflow, using OpenAI Codex
extensively across implementation, testing and documentation. Product direction, architecture
and final decisions remained human-led.
