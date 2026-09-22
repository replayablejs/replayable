# @replayablejs/assets

## 0.1.0-alpha.8

### Patch Changes

- @replayablejs/runtime@0.1.0-alpha.8

## 0.1.0-alpha.7

### Minor Changes

- 8a26b04: Add a models asset category that converts OBJ/MTL, glTF, and GLB sources into self-contained
  GLB files with embedded textures. Support optional Draco or Meshopt compression, shared
  image scaling and encoding, typed model entries and registries, and existing bundle and
  exclusion rules. Missing model dependencies fail with source-specific diagnostics. Preserve valid UVs outside
  [0, 1] when Meshopt falls back to floating-point texture coordinates.

  The runtime asset contract adds ModelAsset and the models category for future renderer
  integrations. Applications with exhaustive AssetCategory handling should add a models case.

### Patch Changes

- Updated dependencies [8a26b04]
  - @replayablejs/runtime@0.1.0-alpha.7

## 0.1.0-alpha.6

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

- Update sharp to 0.35.4 to include the patched libheif dependency used during image processing (GHSA-rgj7-g3m4-5g8c).
- @replayablejs/runtime@0.1.0-alpha.1

## 0.1.0-alpha.0

### Minor Changes

- Initial release of all ten Replayable packages for building, running and exporting playable ads.

### Patch Changes

- Updated dependencies [09a1e86]
- Updated dependencies [39bfcd4]
  - @replayablejs/runtime@0.1.0-alpha.0
