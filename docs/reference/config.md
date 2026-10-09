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

### Override precedence

Overrides resolve in this order: **project → version → network**. The last explicitly
configured value wins. Project settings provide defaults, versions define the creative,
and networks make the final delivery adjustments. An omitted value inherits from the
previous layer.

| Setting                                        | Resolution                                                                                      |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `params`                                       | Each scalar or object child resolves independently; network wins conflicts.                     |
| `completion.duration`, `completion.inactivity` | Each timer resolves independently; network wins, including explicit `false` to disable a timer. |
| `assets.bundles`                               | The complete selection is replaced; network wins. `{}` keeps all included assets in primary.    |
| `assets.exclude`                               | Exclusions from all layers are combined; an override cannot restore an excluded asset.          |
| `audio`                                        | Any layer can disable audio; another layer cannot re-enable it.                                 |

For example, a project duration of `60`, a version duration of `45`, and a network
duration of `30` resolve to `30`. A network duration of `false` disables that timer.
If the network omits duration, the version's `45` is used.

**Migration:** previously, version values won conflicts with network values for parameters
and completion timers. Review configurations that set the same field in both dimensions.
To retain a version value on a network, remove the conflicting network override or set it
to the intended value. Configurations without conflicts keep their existing behavior.

Use `replayable config --json` to inspect the resolved values before building.

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

Every definition requires `type` and a nonempty `label`. Optional `info` provides help text,
and optional `category` groups controls in an editor. Names and display metadata are trimmed;
empty names, empty display metadata, unknown fields, and names that collide after trimming
are rejected. Omitting `params` produces an empty catalog.

For reusable TypeScript definitions, `@replayablejs/config` exports `ReplayableParamMetadata`
and `ReplayableParamCondition`, plus named definitions such as `ReplayableRangeParamDefinition`
and `ReplayableSelectParamDefinition`. All seven definitions extend the shared metadata.
`ReplayableScalarParamDefinition` combines the six scalar controls; `ReplayableParamDefinition`
also includes `ReplayableObjectParamDefinition`. Use `ReplayableSelectOption` for select choices.
These named contracts are preserved in the generated declarations; validation remains owned by
the schemas, with type checks ensuring the contracts match their inferred inputs and outputs.

| Type      | Required value fields                   | Allowed values                                                      |
| --------- | --------------------------------------- | ------------------------------------------------------------------- |
| `number`  | `default`                               | Any finite number, including negative and fractional numbers        |
| `boolean` | `default`                               | `true` or `false`, without coercion                                 |
| `text`    | `default`                               | Any string; empty text, whitespace, and newlines are preserved      |
| `range`   | `default`, `min`, `max`, `step`         | Finite, bounded, step-aligned numbers                               |
| `color`   | `default`                               | Six-digit RGB hex strings, such as `#Aa00Ff`; spelling is preserved |
| `select`  | `default`, `options: [{ name, value }]` | One of the declared string values                                   |
| `object`  | `parameters`                            | One group of scalar child values, derived from child defaults       |

Ranges require `min <= max` and a positive step. The maximum and default must be reachable
from the minimum in whole steps; fractional steps tolerate ordinary floating-point rounding.
Defaults and overrides must stay within the range. Plain `number` parameters accept no range fields.

Selects require at least one option, nonempty option names, and unique nonempty string values.
Defaults and overrides must match an option value exactly. Text and select values are never trimmed
or coerced. Colors accept neither shorthand nor alpha, named colors, or CSS functions.

Objects require at least one child, each with its own label and default. Children may use any
of the six scalar types but cannot be objects themselves. There is no group `default` or
`optional` flag. Arrays, `null`, media parameters, and highlighting fields are unsupported.

For example, inside a complete `defineConfig` call:

```ts
params: {
  tutorial: {
    type: 'object',
    label: 'Tutorial',
    category: 'Gameplay',
    parameters: {
      enabled: { type: 'boolean', label: 'Enabled', default: true },
      message: {
        type: 'text',
        label: 'Message',
        default: 'Swipe to play',
        when: { param: ['tutorial', 'enabled'], equals: true },
      },
      delay: {
        type: 'range',
        label: 'Delay',
        info: 'Seconds before showing the tutorial.',
        default: 4,
        min: 0,
        max: 10,
        step: 1,
      },
      color: { type: 'color', label: 'Text color', default: '#ffffff' },
    },
  },
  difficulty: {
    type: 'select',
    label: 'Difficulty',
    default: 'easy',
    options: [
      { name: 'Easy', value: 'easy' },
      { name: 'Hard', value: 'hard' },
    ],
  },
  speed: { type: 'number', label: 'Speed', default: 1.5 },
},
versions: {
  default: { params: { tutorial: { delay: 6 } } },
},
networks: {
  preview: { params: { tutorial: { enabled: false } } },
},
```

The resolved `tutorial` is
`{ enabled: false, message: 'Swipe to play', delay: 6, color: '#ffffff' }`.
Version and network overrides are partial value objects: omitted children inherit, an empty
group override changes nothing, and each child follows project → version → network precedence.
Unknown root keys or children and values violating their definitions are rejected, including
when a control is currently irrelevant. Explicit `false`, `0`, and `''` are retained.

At runtime, `playable.config.params` contains only resolved values, including nested group
objects. Definitions and editor metadata are not included. Values are typed as primitives or
readonly records of primitives; narrow them before reading a group or a particular scalar.
Every variant receives its own group objects.

### Conditional relevance

`when: { param, equals }` is optional on both groups and scalar definitions. A string `param`
references an exact root key; a two-element tuple such as `['tutorial', 'enabled']` references
a group child. Dots in a string are literal, not path separators. References must exist, target
a scalar, use an allowed comparison value, and cannot reference the parameter itself.

Conditions are editor metadata: they do not remove values, skip validation, or change runtime
behavior. Only a single equality is supported. Replayable retains this extension in metadata;
a future Studio adapter must omit or translate it. Schema alignment alone does not provide
Studio import, saving, or live updates.

### Migrating existing parameters

The new definition format replaces the previous format; legacy fields are rejected.

- Add a readable `label` to every definition and move `description` to optional `info`.
- Replace `type: 'string'` with `type: 'select'` and convert string options to
  `{ name: 'Display name', value: 'originalValue' }`. Preserve localization keys as select values.
- Replace bounded `type: 'number'` with `type: 'range'`, moving `min`, `max`, and `step`
  out of the old `range` object onto the definition.
- Use `text` for unrestricted strings and `number` for unrestricted finite numbers.
- Existing flat parameter names, runtime access, and version/network values can remain unchanged.

Editor consumers must also handle [CLI metadata version 2](./cli.md#inspect-configuration).

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

## Export filenames

`export.filename` changes delivery filenames without changing build directories:

```ts
export: {
  filename: '{name}_{version}_{network}_{language}',
},
```

The default is `{network}_{version}_{language}`. Supported placeholders are `{name}`
(project name), `{version}` (playable version name), `{network}`, and `{language}`.
Literal campaign text is allowed. Names become lowercase; punctuation and spaces
become underscores. For example, `City Builder` with the template above produces
`city_builder_default_google_en.zip`.

Do not include a directory or extension. The exporter adds `.html` or `.zip` for the
network and rejects unknown placeholders or duplicate output filenames before writing.
The CLI's `--output` option still controls the export directory.

For full control, provide a synchronous callback. It receives the original project
name, playable version name, network, and language. Its return value preserves
casing, spaces, and hyphens:

```ts
export: {
  filename: ({ name, version, network, language }) =>
    `${name}-${version}-${network}-${language}`,
},
```

Return a non-empty filename without a directory or `.html`/`.zip` extension.
Invalid filename characters and duplicate output names are rejected before writing.
The exporter adds the network's extension automatically. Async callbacks are not supported.
