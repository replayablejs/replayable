---
'@replayablejs/runtime': minor
---

Add `setVolume(volume)`, `position`, and `duration` to managed audio playback handles.
Per-voice volume changes preserve playback position, support silent running loops, and cancel
fade-in without overriding application mute or host restrictions. Pending playback retains
volume changes; stopping and finished handles validate but ignore them.

Position reports backend time in seconds and wraps for loops. Loaded duration remains available
after playback finishes. Audio-disabled variants expose zero metadata and validate volume
changes without playing audio.
