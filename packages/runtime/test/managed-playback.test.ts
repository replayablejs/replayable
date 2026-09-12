import { describe, expect, it, vi } from 'vitest';

import { createAudio as createDisabledAudio } from '../src/audio/disabled.js';
import { Howl } from '../src/audio/howler.js';
import { createManagedPlayback } from '../src/audio/managed-playback.js';

function createSound() {
  let nextId = 1000;
  const volumes = new Map<number, number>();
  const positions = new Map<number, number>();
  const fades = new Map<number, number>();
  const listeners = new Map<string, (id: number) => void>();
  const sound = {
    play: vi.fn<() => number>(() => ++nextId),
    stop: vi.fn<(id: number) => void>(),
    loop: vi.fn<(loop: boolean, id: number) => void>(),
    duration: vi.fn<() => number>(() => 8),
    seek: vi.fn<(id: number) => number>((id: number) => positions.get(id) ?? 0),
    volume: vi.fn<(value: number, id?: number) => number>((value: number, id?: number) => {
      if (id === undefined) {
        return volumes.get(value) ?? 1;
      }
      volumes.set(id, value);
      // Howler cancellation restores the fade target to its stored volume.
      if (fades.has(id)) {
        volumes.set(id, fades.get(id)!);
        fades.delete(id);
      }
      return value;
    }),
    fade: vi.fn<(from: number, to: number, milliseconds: number, id: number) => void>(
      (_from: number, to: number, _milliseconds: number, id: number) => {
        fades.set(id, to);
      },
    ),
    once: vi.fn<(event: string, listener: (id: number) => void, id: number) => void>(
      (event: string, listener: (id: number) => void, id: number) => {
        listeners.set(`${event}:${id}`, listener);
      },
    ),
    off: vi.fn<(event: string, listener: unknown, id: number) => void>(
      (event: string, _listener: unknown, id: number) => {
        listeners.delete(`${event}:${id}`);
      },
    ),
  };
  return {
    sound,
    // Only the Howl methods used by managed playback are implemented by this double.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    backend: sound as unknown as Howl,
    volumes,
    positions,
    fades,
    emit: (event: string, id: number) => {
      const key = `${event}:${id}`;
      const listener = listeners.get(key);
      listeners.delete(key);
      listener?.(id);
    },
  };
}

function createPlayback(loop = true, fadeIn = 0) {
  const finished = vi.fn<() => void>();
  const playback = createManagedPlayback({ loop, fadeIn, volume: 1 }, finished);
  return { playback, finished };
}

describe('managed playback controls', () => {
  it('preserves requested volume when the installed Howler cancels a fade', () => {
    vi.useFakeTimers();
    const sound = new Howl({ src: ['test.mp3'], preload: false });
    // Supply a voice without browser audio hardware; exercise real Howler volume/fade cleanup.
    const voice = {
      _id: 1001,
      _volume: 1,
      _muted: false,
      _paused: true,
      _interval: setInterval(() => {}, 100),
      _fadeTo: 1,
    };
    Object.assign(sound, { _state: 'loaded', _webAudio: false, _sounds: [voice] });
    const { playback } = createPlayback();
    try {
      vi.spyOn(sound, 'play').mockReturnValue(1001);
      vi.spyOn(sound, 'stop').mockReturnValue(sound);
      playback.setSound(sound);
      playback.start();
      Object.assign(voice, { _interval: setInterval(() => {}, 100), _fadeTo: 1 });
      playback.setVolume(0.3);
      expect(sound.volume(1001)).toBe(0.3);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      playback.stop();
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  });

  it('retains pending volume and exposes loaded duration before permission opens', () => {
    const { playback } = createPlayback();
    const { backend, sound, volumes } = createSound();
    expect(playback.position).toBe(0);
    expect(playback.duration).toBe(0);
    playback.setVolume(0.4);
    playback.setSound(backend);
    expect(playback.duration).toBe(8);
    expect(sound.play).not.toHaveBeenCalled();
    playback.start();
    expect(volumes.get(1001)).toBe(0.4);
  });

  it('does not bind a late sound or restart cancelled playback', () => {
    const { playback, finished } = createPlayback();
    const { backend, sound } = createSound();
    playback.stop();
    playback.setVolume(0.6);
    playback.setSound(backend);
    playback.start();
    expect(sound.play).not.toHaveBeenCalled();
    expect(playback.duration).toBe(0);
    expect(playback.position).toBe(0);
    expect(finished).toHaveBeenCalledOnce();
  });

  it('changes only its own voice without restarting or seeking, including silence', () => {
    const { backend, sound, positions, volumes } = createSound();
    const first = createPlayback().playback;
    const second = createPlayback().playback;
    for (const playback of [first, second]) {
      playback.setSound(backend);
      playback.start();
    }
    positions.set(1001, 3);
    first.setVolume(0);
    expect(volumes.get(1001)).toBe(0);
    expect(volumes.get(1002)).toBe(1);
    expect(sound.seek).not.toHaveBeenCalled();
    positions.set(1001, 4);
    expect(first.position).toBe(4);
    expect(sound.seek).toHaveBeenLastCalledWith(1001);
    first.setVolume(0.7);
    expect(first.position).toBe(4);
    expect(sound.play).toHaveBeenCalledTimes(2);
  });

  it('cancels fade-in and preserves the new volume for a later fade-out', () => {
    const { backend, sound, volumes, fades } = createSound();
    const { playback } = createPlayback(true, 1);
    playback.setSound(backend);
    playback.start();
    expect(fades.get(1001)).toBe(1);
    playback.setVolume(0.3);
    expect(fades.has(1001)).toBe(false);
    expect(volumes.get(1001)).toBe(0.3);
    playback.stop({ fadeOut: 0.5 });
    expect(sound.fade).toHaveBeenLastCalledWith(0.3, 0, 500, 1001);
  });

  it('reads and wraps backend loop position without maintaining a separate clock', () => {
    const { playback } = createPlayback();
    const { backend, positions } = createSound();
    playback.setSound(backend);
    playback.start();
    positions.set(1001, 8.25);
    expect(playback.position).toBe(0.25);
    positions.set(1001, 0.5);
    expect(playback.position).toBe(0.5);
    playback.stop();
    expect(playback.position).toBe(0);
    expect(playback.duration).toBe(8);
  });

  it('keeps fade-out running despite volume changes and retains duration after finish', () => {
    const { playback, finished } = createPlayback();
    const { backend, sound, positions, emit } = createSound();
    playback.setSound(backend);
    playback.start();
    playback.stop({ fadeOut: 1 });
    const calls = sound.volume.mock.calls.length;
    playback.setVolume(0.8);
    expect(sound.volume).toHaveBeenCalledTimes(calls);
    positions.set(1001, 2);
    expect(playback.position).toBe(2);
    emit('fade', 1001);
    expect(sound.stop).toHaveBeenCalledWith(1001);
    expect(finished).toHaveBeenCalledOnce();
    expect(playback.position).toBe(0);
    expect(playback.duration).toBe(8);
    playback.setVolume(0.5);
    expect(sound.volume).toHaveBeenCalledTimes(calls);
  });

  it('clears position but retains duration on natural completion', () => {
    const { playback } = createPlayback(false);
    const { backend, positions, emit } = createSound();
    playback.setSound(backend);
    playback.start();
    positions.set(1001, 8);
    expect(playback.position).toBe(8);
    emit('end', 1001);
    expect(playback.position).toBe(0);
    expect(playback.duration).toBe(8);
  });

  it.each([-0.1, 1.1, NaN, Infinity, -Infinity])(
    'rejects invalid volume %s in every state',
    (volume) => {
      const { playback } = createPlayback();
      const { backend } = createSound();
      expect(() => playback.setVolume(volume)).toThrow(RangeError);
      playback.setSound(backend);
      playback.start();
      expect(() => playback.setVolume(volume)).toThrow(RangeError);
      playback.stop({ fadeOut: 1 });
      expect(() => playback.setVolume(volume)).toThrow(RangeError);
      const finished = createPlayback().playback;
      finished.stop();
      expect(() => finished.setVolume(volume)).toThrow(RangeError);
      expect(() => createDisabledAudio().play('music').setVolume(volume)).toThrow(RangeError);
    },
  );

  it('provides zero metadata and accepts valid volume when disabled', () => {
    const playback = createDisabledAudio().play('music');
    playback.setVolume(0);
    playback.setVolume(1);
    expect(playback.position).toBe(0);
    expect(playback.duration).toBe(0);
  });
});
