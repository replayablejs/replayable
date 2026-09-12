# @replayablejs/runtime

## 0.1.0-alpha.3

### Minor Changes

- d99c3cb: Add `setVolume(volume)`, `position`, and `duration` to managed audio playback handles.
  Per-voice volume changes preserve playback position, support silent running loops, and cancel
  fade-in without overriding application mute or host restrictions. Pending playback retains
  volume changes; stopping and finished handles validate but ignore them.

  Position reports backend time in seconds and wraps for loops. Loaded duration remains available
  after playback finishes. Audio-disabled variants expose zero metadata and validate volume
  changes without playing audio.

## 0.1.0-alpha.2

## 0.1.0-alpha.1

## 0.1.0-alpha.0

### Minor Changes

- Initial release of all ten Replayable packages for building, running and exporting playable ads.

### Patch Changes

- Keep build-only devtools aliases out of public declarations so installed consumers can resolve the factory types. Include Replayable's license in the runtime package alongside the benchmark license.
