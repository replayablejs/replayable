# Public audio API

## Public API boundary

Use `playable.audio` and generated sound IDs. Do not access cached Howl objects, import Howler,
or create another audio context to work around the facade. Read installed public declarations;
`AudioPlayback.setVolume`, `position` and `duration` were added in `0.1.0-alpha.3`.

- `play(id, options)` returns managed playback that can wait for loading and permission. Retain
  the handle; stopping it while pending cancels the eventual start.
- `playOneShot` drops blocked/unloaded effects, preventing stale effects from playing later.
- `setVolume(0)` silences a voice without restarting or stopping its clock. Volume is finite
  in 0..1; changing it cancels fade-in. It does not reverse an already stopping playback.
- `position` is backend time in seconds, zero before start/after finish and wrapped for loops.
  `duration` is zero until loaded and retained after finish. Guard zero duration in visual code.
- Runtime owns host volume/muting, visibility and browser audio permission. Requesting playback
  before interaction does not guarantee that sound can start before a trusted gesture.

The alpha.3 facade does not expose seek, scheduling, playback status/events or sample-accurate
batch starts. Do not invent those guarantees. If a required capability is absent, identify the
smallest public API addition and its contract; toolkit changes are a separate scope from ad work.

Use playback time for visuals that must follow audio rather than an independent elapsed timer.
Zero position alone cannot distinguish pending playback from completion. Explicitly handle
unloaded sounds and audio-disabled variants, and do not claim visual timing proves playback.
Dispose of retained playback handles when their owner is actually destroyed.

Verify loading, first-interaction permission, mute and visibility recovery in the relevant host
or device. Distinguish those checks from desktop preview and build validation.
