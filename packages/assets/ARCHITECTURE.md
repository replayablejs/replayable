# Asset pipeline architecture

The assets package separates configuration validation, source selection, category processing and
emission. `src/index.ts` defines the public API; internal module aliases are implementation details.

`buildAssets` validates authored configuration, resolves sources from the project root, processes
selected logical assets and emits resources plus TypeScript metadata. Simple categories identify
files; grouped categories identify directories with a category-specific resource contract.
Localization is resolved for a fixed build language. Font subsetting consumes that resolved text.

Configuration schemas own option defaults and validation. Category processors own conversion.
Generated modules describe resources using the runtime asset contract; rendering integrations own
loading for categories requiring renderer-specific objects. Primary/secondary selection is shared
across categories rather than being a sound-specific mechanism.

Changes to generated formats must be checked against runtime loaders, renderer integrations and
isolated packed consumers. Use contract tests for selection, output paths and emitted modules,
and integration tests for native processors. Never treat a generated file as authored source.
