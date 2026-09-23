# @replayablejs/export

## 0.1.0-alpha.9

### Minor Changes

- 972531a: Add optional `export.filename` templates with project name, playable version, network, and language placeholders. Preserve the current filenames by default, append network-specific extensions automatically, and reject invalid templates and conflicting output names.

### Patch Changes

- Updated dependencies [972531a]
  - @replayablejs/config@0.1.0-alpha.9

## 0.1.0-alpha.8

### Patch Changes

- @replayablejs/config@0.1.0-alpha.8

## 0.1.0-alpha.7

### Patch Changes

- @replayablejs/config@0.1.0-alpha.7

## 0.1.0-alpha.6

### Patch Changes

- @replayablejs/config@0.1.0-alpha.6

## 0.1.0-alpha.5

### Patch Changes

- Updated dependencies [9658505]
  - @replayablejs/config@0.1.0-alpha.5

## 0.1.0-alpha.4

### Patch Changes

- 2d7a2fb: Avoid embedding the runtime configuration twice in generated playable scripts.

  Use a UUID-based identifier for the captured script URL in Mintegral exports to make collisions with authored variable names negligibly likely, while preserving URL resolution after top-level await. The generated identifier varies between builds.

- @replayablejs/config@0.1.0-alpha.4

## 0.1.0-alpha.3

### Patch Changes

- @replayablejs/config@0.1.0-alpha.3

## 0.1.0-alpha.2

### Patch Changes

- @replayablejs/config@0.1.0-alpha.2

## 0.1.0-alpha.1

### Patch Changes

- @replayablejs/config@0.1.0-alpha.1

## 0.1.0-alpha.0

### Minor Changes

- Initial release of all ten Replayable packages for building, running and exporting playable ads.

### Patch Changes

- Updated dependencies [09a1e86]
  - @replayablejs/config@0.1.0-alpha.0
