# Export

`@replayablejs/export` exports existing playable builds. The public operation is
`exportProject(config, { projectRoot, outputDirectory? })`. The destination defaults to `exports`.
The result lists each variant's ID, artifact path and final size in bytes.

Run build first. Export does not regenerate application code or source assets. The CLI equivalent
is `replayable export`, with `--output` to choose a destination.

## Implemented profiles

Profiles are preview, AppLovin, Google, Liftoff, Meta, Mintegral, Moloco and Unity. The exporter
prepares each network's HTML or ZIP form, checks its resources and applies implemented delivery
rules. Outputs use names such as `preview_default_en.html` and `google_default_en.zip`.

The shared size ceiling is 5,000,000 bytes. Moloco requires strictly less than that value;
other size checks accept the boundary. Liftoff applies the limit to entry HTML. Google also
limits archive contents to 512 files. These are code-enforced limits, not a promise of current
network acceptance or a substitute for testing in the destination's tools.

The exporter is the delivery validator; there is no separate public artifact-inspection API.
Keep required third-party notices according to the resources' terms. Do not assume that exporting
a playable clears redistribution rights or supplies every resource's required attribution.

[Export pipeline](https://github.com/replayablejs/replayable/tree/main/packages/export/src/pipeline)
and [network validators](https://github.com/replayablejs/replayable/tree/main/packages/export/src/validation/networks).

## Delivery Workflow

1. Select campaign networks, languages and creative versions in project configuration.
2. Build the project with that configuration.
3. Run export with the same configuration and inspect any reported validation failure.
4. Test the resulting HTML or ZIP in its destination's tools.

Changing source files after building leaves the existing build unchanged. Rebuild before exporting
when code, assets or configuration have changed.

## Output and Failures

Use a dedicated export directory. Artifact names combine network, creative version and language,
so `google_default_en.zip` identifies the Google profile, default creative and English language.
The programmatic result contains the final artifact paths and byte sizes for successful exports.

If an artifact exceeds its limit, adjust the source assets or their processor settings and rebuild.
Start with large images, audio and optional resources. Moving an asset into a secondary bundle
changes when it loads; it does not make its bytes disappear from delivery.

If a required build file is missing, confirm the build directory and that both operations used the
same project root and configuration. See [Build and Export](../guide/build-and-export.md) for the
command-line workflow.
