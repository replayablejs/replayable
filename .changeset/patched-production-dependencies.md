---
'@replayablejs/assets': patch
'@replayablejs/build': patch
'@replayablejs/export': patch
---

Update Sharp to 0.35.5 to include the patched librsvg dependency. Refresh the workspace lockfile to patched Undici and source-map-js releases used by export and build tooling, resolving the four high-severity production audit findings.
