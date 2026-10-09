# @replayablejs/cli

## 0.1.0-alpha.13

### Minor Changes

- f9f4895: Add temporary preview overrides through `replayable dev --overrides <file>` and the `servePreview` API. The JSON input supports version and language selection, parameter values, controls, and developer tools without changing the project's saved configuration or production builds.

  Export the preview overrides schema, input type, and variant resolver from `@replayablejs/config`. Validate overrides against the project's parameter definitions and apply parameter overrides after project, version, and network values.

### Patch Changes

- Updated dependencies [f9f4895]
  - @replayablejs/config@0.1.0-alpha.13
  - @replayablejs/build@0.1.0-alpha.13
  - @replayablejs/export@0.1.0-alpha.13
  - @replayablejs/assets@0.1.0-alpha.13

## 0.1.0-alpha.12

### Patch Changes

- Updated dependencies [5c498cd]
  - @replayablejs/assets@0.1.0-alpha.12
  - @replayablejs/build@0.1.0-alpha.12
  - @replayablejs/export@0.1.0-alpha.12
  - @replayablejs/config@0.1.0-alpha.12

## 0.1.0-alpha.11

### Minor Changes

- eef4f3e: Add `replayable config --metadata` for editors that need parameter definitions alongside resolved variants. The versioned JSON output includes parameter types, descriptions, defaults, numeric ranges, string options, and conditional visibility rules. The flag implies JSON output and can also be used with `--json`.

  Existing `replayable config --json` output remains unchanged.

### Patch Changes

- @replayablejs/assets@0.1.0-alpha.11
  - @replayablejs/build@0.1.0-alpha.11
  - @replayablejs/config@0.1.0-alpha.11
  - @replayablejs/export@0.1.0-alpha.11

## 0.1.0-alpha.10

### Patch Changes

- Updated dependencies [a4f9ea5]
  - @replayablejs/config@0.1.0-alpha.10
  - @replayablejs/export@0.1.0-alpha.10
  - @replayablejs/build@0.1.0-alpha.10
  - @replayablejs/assets@0.1.0-alpha.10

## 0.1.0-alpha.9

### Patch Changes

- Updated dependencies [972531a]
  - @replayablejs/config@0.1.0-alpha.9
  - @replayablejs/export@0.1.0-alpha.9
  - @replayablejs/build@0.1.0-alpha.9
  - @replayablejs/assets@0.1.0-alpha.9

## 0.1.0-alpha.8

### Patch Changes

- Updated dependencies [4c6576f]
- Updated dependencies [2b2d977]
  - @replayablejs/build@0.1.0-alpha.8
  - @replayablejs/assets@0.1.0-alpha.8
  - @replayablejs/config@0.1.0-alpha.8
  - @replayablejs/export@0.1.0-alpha.8

## 0.1.0-alpha.7

### Patch Changes

- Updated dependencies [8a26b04]
  - @replayablejs/assets@0.1.0-alpha.7
  - @replayablejs/build@0.1.0-alpha.7
  - @replayablejs/config@0.1.0-alpha.7
  - @replayablejs/export@0.1.0-alpha.7

## 0.1.0-alpha.6

### Patch Changes

- @replayablejs/assets@0.1.0-alpha.6
  - @replayablejs/build@0.1.0-alpha.6
  - @replayablejs/config@0.1.0-alpha.6
  - @replayablejs/export@0.1.0-alpha.6

## 0.1.0-alpha.5

### Patch Changes

- Updated dependencies [9658505]
  - @replayablejs/config@0.1.0-alpha.5
  - @replayablejs/build@0.1.0-alpha.5
  - @replayablejs/export@0.1.0-alpha.5
  - @replayablejs/assets@0.1.0-alpha.5

## 0.1.0-alpha.4

### Patch Changes

- Updated dependencies [2d7a2fb]
  - @replayablejs/build@0.1.0-alpha.4
  - @replayablejs/export@0.1.0-alpha.4
  - @replayablejs/assets@0.1.0-alpha.4
  - @replayablejs/config@0.1.0-alpha.4

## 0.1.0-alpha.3

### Patch Changes

- @replayablejs/assets@0.1.0-alpha.3
  - @replayablejs/build@0.1.0-alpha.3
  - @replayablejs/config@0.1.0-alpha.3
  - @replayablejs/export@0.1.0-alpha.3

## 0.1.0-alpha.2

### Patch Changes

- Updated dependencies [09f6ac1]
  - @replayablejs/build@0.1.0-alpha.2
  - @replayablejs/assets@0.1.0-alpha.2
  - @replayablejs/config@0.1.0-alpha.2
  - @replayablejs/export@0.1.0-alpha.2

## 0.1.0-alpha.1

### Patch Changes

- Updated dependencies
  - @replayablejs/assets@0.1.0-alpha.1
  - @replayablejs/build@0.1.0-alpha.1
  - @replayablejs/config@0.1.0-alpha.1
  - @replayablejs/export@0.1.0-alpha.1

## 0.1.0-alpha.0

### Minor Changes

- Initial release of all ten Replayable packages for building, running and exporting playable ads.

### Patch Changes

- Updated dependencies [09a1e86]
  - @replayablejs/assets@0.1.0-alpha.0
  - @replayablejs/build@0.1.0-alpha.0
  - @replayablejs/config@0.1.0-alpha.0
  - @replayablejs/export@0.1.0-alpha.0
