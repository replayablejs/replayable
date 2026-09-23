# @replayablejs/three

## 0.1.0-alpha.10

### Patch Changes

- @replayablejs/canvas@0.1.0-alpha.10
  - @replayablejs/runtime@0.1.0-alpha.10

## 0.1.0-alpha.9

### Patch Changes

- @replayablejs/canvas@0.1.0-alpha.9
  - @replayablejs/runtime@0.1.0-alpha.9

## 0.1.0-alpha.8

### Minor Changes

- 2b2d977: Add a Three.js renderer foundation with a shared WebGL 2 canvas, runtime-driven
  rendering, perspective-camera resizing, and idempotent cleanup with setup rollback.
  Add GLB loading, independent model skeletons and application-controlled animation
  mixers, and shared model-resource cleanup. Keep application-created
  scene resources caller-owned. Add optional Meshopt and Draco integrations through
  separate package entries, with shared decoders, safe worker cleanup, and a warning
  when both codecs are registered. Reject duplicate Three.js instances in playable
  builds to keep renderer and application dependencies aligned.

### Patch Changes

- 4c6576f: Embed Google build assets in JavaScript while keeping HTML, CSS, and JavaScript modules separate, so generated models, images, fonts, and locale data do not introduce unsupported file extensions into the upload ZIP.

  Decode inline Base64 GLBs locally before parsing them with Three.js instead of fetching their data URLs. This fixes model loading in ad hosts that block or intercept those requests, including Meta playable environments.

- @replayablejs/canvas@0.1.0-alpha.8
  - @replayablejs/runtime@0.1.0-alpha.8
