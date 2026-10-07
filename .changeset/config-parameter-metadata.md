---
'@replayablejs/cli': minor
---

Add `replayable config --metadata` for editors that need parameter definitions alongside resolved variants. The versioned JSON output includes parameter types, descriptions, defaults, numeric ranges, string options, and conditional visibility rules. The flag implies JSON output and can also be used with `--json`.

Existing `replayable config --json` output remains unchanged.
