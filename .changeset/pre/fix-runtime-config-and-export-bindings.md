---
'@replayablejs/build': patch
'@replayablejs/export': patch
---

Avoid embedding the runtime configuration twice in generated playable scripts.

Use a UUID-based identifier for the captured script URL in Mintegral exports to make collisions with authored variable names negligibly likely, while preserving URL resolution after top-level await. The generated identifier varies between builds.
