# @replayablejs/build

## 0.1.0-alpha.8

### Patch Changes

- 4c6576f: Embed Google build assets in JavaScript while keeping HTML, CSS, and JavaScript modules separate, so generated models, images, fonts, and locale data do not introduce unsupported file extensions into the upload ZIP.

  Decode inline Base64 GLBs locally before parsing them with Three.js instead of fetching their data URLs. This fixes model loading in ad hosts that block or intercept those requests, including Meta playable environments.

- 2b2d977: Add a Three.js renderer foundation with a shared WebGL 2 canvas, runtime-driven
  rendering, perspective-camera resizing, and idempotent cleanup with setup rollback.
  Add GLB loading, independent model skeletons and application-controlled animation
  mixers, and shared model-resource cleanup. Keep application-created
  scene resources caller-owned. Add optional Meshopt and Draco integrations through
  separate package entries, with shared decoders, safe worker cleanup, and a warning
  when both codecs are registered. Reject duplicate Three.js instances in playable
  builds to keep renderer and application dependencies aligned.
- @replayablejs/assets@0.1.0-alpha.8
  - @replayablejs/config@0.1.0-alpha.8
  - @replayablejs/devtools@0.1.0-alpha.8
  - @replayablejs/runtime@0.1.0-alpha.8

## 0.1.0-alpha.7

### Patch Changes

- Updated dependencies [8a26b04]
  - @replayablejs/assets@0.1.0-alpha.7
  - @replayablejs/runtime@0.1.0-alpha.7
  - @replayablejs/config@0.1.0-alpha.7
  - @replayablejs/devtools@0.1.0-alpha.7

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
