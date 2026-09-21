# @replayablejs/tween

## 0.1.0-alpha.6

### Minor Changes

- dc896ee: Add `release(target)` to disconnect all plain-object property bindings and cancel pending writes through Motion's public property-effect cleanup API. Stop the object's tweens, call `release` for each animated object, then destroy the artwork. Nested targets such as `chip.scale` must be released separately. Playback controls retain their existing behavior.

  Update Motion to 13.3.0 for its public property-effect release API.

### Patch Changes

- Updated dependencies [dc896ee]
  - @replayablejs/runtime@0.1.0-alpha.6

## 0.1.0-alpha.5

### Patch Changes

- @replayablejs/runtime@0.1.0-alpha.5

## 0.1.0-alpha.4

### Patch Changes

- @replayablejs/runtime@0.1.0-alpha.4

## 0.1.0-alpha.3

### Patch Changes

- Updated dependencies [d99c3cb]
  - @replayablejs/runtime@0.1.0-alpha.3

## 0.1.0-alpha.2

### Patch Changes

- @replayablejs/runtime@0.1.0-alpha.2

## 0.1.0-alpha.1

### Patch Changes

- @replayablejs/runtime@0.1.0-alpha.1

## 0.1.0-alpha.0

### Minor Changes

- Initial release of all ten Replayable packages for building, running and exporting playable ads.

### Patch Changes

- Updated dependencies [09a1e86]
- Updated dependencies [39bfcd4]
  - @replayablejs/runtime@0.1.0-alpha.0
