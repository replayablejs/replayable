# @replayablejs/build

## 0.1.0-alpha.6

### Patch Changes

- Updated dependencies [dc896ee]
  - @replayablejs/runtime@0.1.0-alpha.6
  - @replayablejs/assets@0.1.0-alpha.6
  - @replayablejs/devtools@0.1.0-alpha.6
  - @replayablejs/config@0.1.0-alpha.6

## 0.1.0-alpha.5

### Patch Changes

- Updated dependencies [9658505]
  - @replayablejs/config@0.1.0-alpha.5
  - @replayablejs/assets@0.1.0-alpha.5
  - @replayablejs/devtools@0.1.0-alpha.5
  - @replayablejs/runtime@0.1.0-alpha.5

## 0.1.0-alpha.4

### Patch Changes

- 2d7a2fb: Avoid embedding the runtime configuration twice in generated playable scripts.

  Use a UUID-based identifier for the captured script URL in Mintegral exports to make collisions with authored variable names negligibly likely, while preserving URL resolution after top-level await. The generated identifier varies between builds.

- @replayablejs/assets@0.1.0-alpha.4
  - @replayablejs/config@0.1.0-alpha.4
  - @replayablejs/devtools@0.1.0-alpha.4
  - @replayablejs/runtime@0.1.0-alpha.4

## 0.1.0-alpha.3

### Patch Changes

- Updated dependencies [d99c3cb]
  - @replayablejs/runtime@0.1.0-alpha.3
  - @replayablejs/assets@0.1.0-alpha.3
  - @replayablejs/devtools@0.1.0-alpha.3
  - @replayablejs/config@0.1.0-alpha.3

## 0.1.0-alpha.2

### Patch Changes

- 09f6ac1: Forward development aliases to Vite's Rolldown dependency optimizer so installed runtime and devtools packages resolve their build-selected imports during prebundling. This fixes unresolved `#adapter`, `#assets`, `#definition`, and `#audio` imports while retaining normal dependency optimization and automatic CommonJS audio interoperability. Changing the selected bindings also invalidates the optimizer cache.
- @replayablejs/assets@0.1.0-alpha.2
  - @replayablejs/config@0.1.0-alpha.2
  - @replayablejs/devtools@0.1.0-alpha.2
  - @replayablejs/runtime@0.1.0-alpha.2

## 0.1.0-alpha.1

### Patch Changes

- Updated dependencies
  - @replayablejs/assets@0.1.0-alpha.1
  - @replayablejs/config@0.1.0-alpha.1
  - @replayablejs/devtools@0.1.0-alpha.1
  - @replayablejs/runtime@0.1.0-alpha.1

## 0.1.0-alpha.0

### Minor Changes

- Initial release of all ten Replayable packages for building, running and exporting playable ads.

### Patch Changes

- Updated dependencies [09a1e86]
- Updated dependencies [39bfcd4]
  - @replayablejs/assets@0.1.0-alpha.0
  - @replayablejs/config@0.1.0-alpha.0
  - @replayablejs/devtools@0.1.0-alpha.0
  - @replayablejs/runtime@0.1.0-alpha.0
