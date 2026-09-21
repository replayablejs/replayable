---
'@replayablejs/assets': minor
'@replayablejs/runtime': minor
---

Add a models asset category that converts OBJ/MTL, glTF, and GLB sources into self-contained
GLB files with embedded textures. Support optional Draco or Meshopt compression, shared
image scaling and encoding, typed model entries and registries, and existing bundle and
exclusion rules. Missing model dependencies fail with source-specific diagnostics. Preserve valid UVs outside
[0, 1] when Meshopt falls back to floating-point texture coordinates.

The runtime asset contract adds ModelAsset and the models category for future renderer
integrations. Applications with exhaustive AssetCategory handling should add a models case.
