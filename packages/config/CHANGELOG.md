# @replayablejs/config

## 0.1.0-alpha.7

### Patch Changes

- Updated dependencies [8a26b04]
  - @replayablejs/assets@0.1.0-alpha.7

## 0.1.0-alpha.6

### Patch Changes

- @replayablejs/assets@0.1.0-alpha.6

## 0.1.0-alpha.5

### Minor Changes

- 9658505: Add per-version and per-network `assets.bundles` and make network overrides the final configuration layer.

  **Behavior change:** precedence is now **project → version → network**, previously project → network → version. When a version and network set the same parameter or completion timer, the network now wins. Completion timers resolve independently; network `false` disables a timer, while a network duration can override a version's `false`.

  Bundle overrides replace the complete selection, including include/exclude arrays, rather than merging it. Omit `assets.bundles` to inherit; use `assets.bundles: {}` to keep all included assets in primary. Network selections take precedence over version selections. Runtime loading APIs are unchanged.

  **Migration:** inspect projects with conflicting version/network parameter or completion values using `replayable config --json`. Remove or adjust the network override if the version value should continue to apply. Projects without conflicting overrides retain their behavior. Asset exclusions remain additive, and audio remains disabled when any configuration layer disables it.

### Patch Changes

- @replayablejs/assets@0.1.0-alpha.5

## 0.1.0-alpha.4

### Patch Changes

- @replayablejs/assets@0.1.0-alpha.4

## 0.1.0-alpha.3

### Patch Changes

- @replayablejs/assets@0.1.0-alpha.3

## 0.1.0-alpha.2

### Patch Changes

- @replayablejs/assets@0.1.0-alpha.2

## 0.1.0-alpha.1

### Patch Changes

- Updated dependencies
  - @replayablejs/assets@0.1.0-alpha.1

## 0.1.0-alpha.0

### Minor Changes

- Initial release of all ten Replayable packages for building, running and exporting playable ads.

### Patch Changes

- Updated dependencies [09a1e86]
  - @replayablejs/assets@0.1.0-alpha.0
