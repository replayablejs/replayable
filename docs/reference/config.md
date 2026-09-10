# Project configuration

Import `defineConfig` from `@replayablejs/config` and default-export its result from
`replayable.config.ts`. It validates input with strict schemas and supplies defaults.
Use `replayableConfigSchema` for direct parsing and `createVariants(config)` to inspect expansion.

| Field             | Purpose                                                       |
| ----------------- | ------------------------------------------------------------- |
| `name`            | Nonempty project name                                         |
| `entry`           | Application entry; defaults to `src/main.ts`                  |
| `assets`          | Asset configuration without standalone `localization`         |
| `localization`    | Nonempty `languages` and a `fallback` contained in that list  |
| `screen`          | Design orientations, viewport ratios and rendering resolution |
| `store`           | `androidUrl` and `iosUrl` destinations                        |
| `versions`        | Named overrides; defaults to `{ default: {} }`                |
| `networks`        | Selected profiles; defaults to `{ preview: {} }`              |
| `params`          | Typed ad parameter definitions                                |
| `audio`           | Audio capability                                              |
| `backgroundColor` | First-paint background                                        |
| `completion`      | Optional duration and inactivity timers in seconds            |
| `controls`        | Preview control preferences subject to network policy         |
| `devtools`        | Stats, sound-control and endcard-trigger preferences          |
| `build.outDir`    | Build directory; defaults to `dist`                           |

Languages use valid, canonically unique BCP 47 tags. Version names begin with a lowercase letter
and use lowercase letters, digits, underscores or hyphens. A variant ID combines version,
network and language. Version/network overrides accept asset exclusions, audio, completion and
parameter values. A completion override can use `false` to disable an inherited timer.

Keep a complete configuration with the example's screen, asset and localization setup rather than
copying a partial object without required fields. [DOM example configuration](https://github.com/replayablejs/replayable/blob/main/examples/basic-playable/replayable.config.ts)
and [Pixi example configuration](https://github.com/replayablejs/replayable/blob/main/examples/basic-pixi-playable/replayable.config.ts)
are executable starting points.

Public types include `ReplayableConfigInput` for author input, `ReplayableConfig` after validation,
`PlayableVariant`, and the field-specific input/output types exported by the package.
[Schema source](https://github.com/replayablejs/replayable/tree/main/packages/config/src/config).

## Entry and Output

`entry` is a string relative to the project root and defaults to `src/main.ts`.
`build.outDir` defaults to `dist`. Keep it dedicated to generated output: a project build clears it.

## Languages and Variants

`localization` is required. Provide a nonempty `languages` array and select one of those tags as
`fallback`. For example, `['en', 'es']` with fallback `'en'` creates an English and a Spanish
build for every selected network and creative version.

`networks` defaults to `{ preview: {} }`. Supported keys are `preview`, `applovin`, `google`,
`liftoff`, `meta`, `mintegral`, `moloco` and `unity`.

`versions` defaults to `{ default: {} }`. Two versions, three networks and two languages produce
12 variants. Each has an ID such as `default/preview/en`.

Parameter values resolve from the base definition, then the network override, then the version
override. Use `replayable config --json` to inspect the resolved values before building.

## Audio

- **Type:** `boolean`
- **Default:** `true`

Set `audio: false` to remove audio capability from the project. A network or version override
can disable audio with `false`; it cannot re-enable audio disabled by the project.
Application mute state is controlled separately through [runtime audio](./runtime.md#audio).

## Background Color

- **Type:** `string`
- **Default:** `'#000000'`

An opaque three- or six-digit hexadecimal color, such as `'#fff'` or `'#161616'`. It fills the
playable background before the scene mounts. Named colors and colors with transparency are invalid.

## Completion

`completion.duration` and `completion.inactivity` are optional positive durations in seconds.
Use a version or network override with `false` to disable an inherited timer.
Your application can also finish through `playable.complete('success')` or another supported reason.
See [completion and store actions](./runtime.md#completion-and-store-actions).

## Ad Parameters

Each parameter has a `type`, `default` and `description`:

| Type      | Additional fields                                 |
| --------- | ------------------------------------------------- |
| `boolean` | None                                              |
| `number`  | `range: { min, max, step }`, with a positive step |
| `string`  | A nonempty `options` array                        |

An optional `when: { param, equals }` describes when the parameter is relevant. Network and
version overrides supply parameter values by name rather than repeating their definitions.

## Preview Controls and Development Tools

`controls.persistentCta` defaults to `true` for preview. Network profiles apply their own delivery
policy to controls.

`devtools.soundControl` and `devtools.endCardTrigger` default to `false`. Enable the desired tools
in configuration, then create them in application code as shown in [development tools](./devtools.md).
Production builds select disabled implementations, including for exported preview variants.

## Screen and Store

`screen` requires both `portrait` and `landscape` orientation definitions. Each supplies `enabled`,
positive integer design `width` and `height`, and a positive `ratio` range. At least one orientation
must be enabled. Resolution settings define the pixel-ratio range and ordered render-scale levels.
Use the [complete quickstart configuration](../guide/getting-started.md) as a starting point.

`store` requires valid `androidUrl` and `iosUrl` URLs. Replace the quickstart placeholders with your
campaign destinations before delivery.

## Configuration Errors

Unknown fields are rejected. Check spelling and whether an option belongs at project level or
inside a network/version override. If language validation fails, check that the fallback is in the
language list and that no two tags normalize to the same language tag.
