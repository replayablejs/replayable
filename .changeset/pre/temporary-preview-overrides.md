---
'@replayablejs/config': minor
'@replayablejs/build': minor
'@replayablejs/cli': minor
---

Add temporary preview overrides through `replayable dev --overrides <file>` and the `servePreview` API. The JSON input supports version and language selection, parameter values, controls, and developer tools without changing the project's saved configuration or production builds.

Export the preview overrides schema, input type, and variant resolver from `@replayablejs/config`. Validate overrides against the project's parameter definitions and apply parameter overrides after project, version, and network values.
