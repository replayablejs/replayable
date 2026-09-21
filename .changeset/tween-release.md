---
'@replayablejs/tween': minor
---

Add `release(target)` to disconnect all plain-object property bindings and cancel pending writes through Motion's public property-effect cleanup API. Stop the object's tweens, call `release` for each animated object, then destroy the artwork. Nested targets such as `chip.scale` must be released separately. Playback controls retain their existing behavior.

Update Motion to 13.3.0 for its public property-effect release API.
