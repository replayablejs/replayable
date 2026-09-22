---
'@replayablejs/three': minor
'@replayablejs/build': patch
---

Add a Three.js renderer foundation with a shared WebGL 2 canvas, runtime-driven
rendering, perspective-camera resizing, and idempotent cleanup with setup rollback.
Add GLB loading, independent model skeletons and application-controlled animation
mixers, and shared model-resource cleanup. Keep application-created
scene resources caller-owned. Add optional Meshopt and Draco integrations through
separate package entries, with shared decoders, safe worker cleanup, and a warning
when both codecs are registered. Reject duplicate Three.js instances in playable
builds to keep renderer and application dependencies aligned.
