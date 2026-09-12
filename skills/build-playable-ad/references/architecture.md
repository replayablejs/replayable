# Runtime integration and scene structure

Inspect `examples/basic-playable` for DOM scenes or `examples/basic-pixi-playable` for Pixi
at the project's package version. Follow their lifecycle and composition rather than copying
only imports. Keep the entry point focused on registering integrations, awaiting readiness,
creating and mounting the scene, starting it, initializing configured devtools and requesting
secondary assets. Only include steps the project uses.

Register DOM sprite decoding before primary loading. Read the matching example's loader rather
than assuming cached sprites already are HTML images. Keep renderer-specific conversions behind
a small typed helper instead of repeating cache assertions throughout the application.

Use the examples' scene composition as a starting point, adapting it to the creative. Let features
own their animations and subscriptions; keep the main scene focused on coordination. Separate
immutable configuration from instance state. Visual hiding and resource disposal are distinct:
choose their behavior from the creative's lifecycle rather than implicitly destroying resources
whenever a component becomes invisible.

## Screen and controls

Scope DOM styles to the scene or feature; Replayable owns its page shell. Read `playable.screen`
for orientation, frame and safe-area data. Safe area is a frame-local rectangle: derive content
insets without applying offsets twice. Keep fullscreen backgrounds separate from inset content.
For DOM layouts, expose necessary screen values to CSS and prefer grid/flexbox over duplicating
layout calculations in resize handlers. Use design dimensions appropriate to the creative and
verify both orientations at more than one aspect ratio.

Honor resolved runtime controls rather than hard-coding their visibility. Route installs through
`playable.openStore()` and avoid duplicate activation from overlapping input handlers.

## Animation and development tools

Use `@replayablejs/tween` for lifecycle-aware DOM or renderer animations. Its DOM support means
an HTML scene does not require a separate animation library. Inspect the installed declarations
and matching examples for supported options. Keep animation controls and subscriptions with
their owner, and stop them before destroying their targets. Check in-progress animations during
resize and visibility changes as well as in a stationary preview.

Devtools require their factories as well as configuration. Follow the example's initialization;
restart development after changing build-selected settings such as stats. Do not assume exported
preview artifacts include development controls.
