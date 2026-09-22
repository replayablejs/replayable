---
'@replayablejs/build': patch
'@replayablejs/three': patch
---

Embed Google build assets in JavaScript while keeping HTML, CSS, and JavaScript modules separate, so generated models, images, fonts, and locale data do not introduce unsupported file extensions into the upload ZIP.

Decode inline Base64 GLBs locally before parsing them with Three.js instead of fetching their data URLs. This fixes model loading in ad hosts that block or intercept those requests, including Meta playable environments.
