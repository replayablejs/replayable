import { beforeEach, describe, expect, it, vi } from 'vitest';

type SoundListener = ((soundId: number) => void) | ((soundId: number, error: unknown) => void);

const howlerHarness = vi.hoisted(() => {
  class FakeHowl {
    readonly listeners = new Map<string, SoundListener>();
    readonly play = vi.fn<() => number>(() => 1);
    readonly stop = vi.fn<(soundId: number) => void>();
    readonly fade = vi.fn<(from: number, to: number, duration: number, soundId: number) => void>();
    readonly loop = vi.fn<(loop: boolean, soundId: number) => void>();
    readonly duration = vi.fn<() => number>(() => 8);
    readonly source: string;
    readonly unload = vi.fn<() => void>();
    readonly volume = vi.fn<() => FakeHowl>(() => this);

    constructor(options: { src: string }) {
      this.source = options.src;
      howlerHarness.instances.push(this);
    }

    load(): void {
      this.listeners.get('load')?.(0, undefined);
    }

    off(event: string): void {
      this.listeners.delete(event);
    }

    once(event: string, listener: SoundListener): void {
      this.listeners.set(event, listener);
    }
  }

  return {
    FakeHowl,
    instances: [] as FakeHowl[],
    mute: vi.fn<(muted: boolean) => void>(),
    volume: vi.fn<(volume: number) => void>(),
  };
});

vi.mock('#audio/howler.js', () => ({
  Howl: howlerHarness.FakeHowl,
  Howler: {
    autoSuspend: true,
    ctx: {
      resume: vi.fn<() => Promise<void>>(() => Promise.resolve()),
      state: 'running',
      suspend: vi.fn<() => Promise<void>>(() => Promise.resolve()),
    },
    mute: howlerHarness.mute,
    usingWebAudio: false,
    volume: howlerHarness.volume,
  },
}));

describe('audio', () => {
  beforeEach(() => {
    howlerHarness.instances.length = 0;
    vi.clearAllMocks();
  });

  it('starts managed playback when permission precedes sound loading', async () => {
    const harness = await createAudioHarness();

    harness.audio.update({ allowed: true, volume: 1 });
    harness.audio.play('music', { loop: true });

    expect(howlerHarness.instances).toHaveLength(0);

    await harness.loadSounds();
    const sound = harness.getSound('music');

    expect(sound.play.mock.calls).toHaveLength(1);
  });

  it('starts managed playback when sound loading precedes permission', async () => {
    const harness = await createAudioHarness();

    harness.audio.play('music', { loop: true });
    await harness.loadSounds();
    const sound = harness.getSound('music');

    expect(sound.play.mock.calls).toHaveLength(0);

    harness.audio.update({ allowed: true, volume: 1 });

    expect(sound.play.mock.calls).toHaveLength(1);
  });

  it('does not revive managed playback stopped before sound loading', async () => {
    const harness = await createAudioHarness();

    harness.audio.update({ allowed: true, volume: 1 });
    const playback = harness.audio.play('music', { loop: true });

    playback.stop();

    await harness.loadSounds();
    const sound = harness.getSound('music');

    expect(sound.play.mock.calls).toHaveLength(0);
  });

  it('keeps application and host mute intact when voice volume changes', async () => {
    const harness = await createAudioHarness();
    await harness.loadSounds();
    harness.audio.update({ allowed: true, volume: 0.4 });
    const playback = harness.audio.play('music', { loop: true });
    harness.audio.setMuted(true);
    howlerHarness.mute.mockClear();
    howlerHarness.volume.mockClear();
    playback.setVolume(0.8);
    expect(harness.audio.muted).toBe(true);
    expect(howlerHarness.mute).not.toHaveBeenCalled();
    expect(howlerHarness.volume).not.toHaveBeenCalled();
    harness.audio.update({ allowed: false, volume: 0.2 });
    expect(howlerHarness.mute).toHaveBeenLastCalledWith(true);
    howlerHarness.mute.mockClear();
    howlerHarness.volume.mockClear();
    playback.setVolume(1);
    expect(howlerHarness.mute).not.toHaveBeenCalled();
    expect(howlerHarness.volume).not.toHaveBeenCalled();
  });

  it('drops one-shots until both sound loading and permission are current', async () => {
    const harness = await createAudioHarness();

    harness.audio.update({ allowed: true, volume: 1 });
    harness.audio.playOneShot('click');

    await harness.loadSounds();
    const sound = harness.getSound('click');

    expect(sound.play.mock.calls).toHaveLength(0);

    harness.audio.update({ allowed: false, volume: 1 });
    harness.audio.playOneShot('click');
    expect(sound.play.mock.calls).toHaveLength(0);

    harness.audio.update({ allowed: true, volume: 1 });
    harness.audio.playOneShot('click');
    expect(sound.play.mock.calls).toHaveLength(1);
  });
});

async function createAudioHarness() {
  const { createAudio } = await import('../src/audio/enabled.js');
  const { createAssetLoader } = await import('../src/loader/create-asset-loader.js');
  const loader = createAssetLoader(
    {
      primary: {},
      secondary: {
        sounds: {
          click: '/assets/click.m4a',
          music: '/assets/music.m4a',
        },
      },
    },
    'resource',
  );
  const audio = createAudio(loader);

  return {
    audio,
    getSound(id: string): InstanceType<typeof howlerHarness.FakeHowl> {
      const sound = howlerHarness.instances.find(({ source }) => source.includes(`/${id}.`));

      if (sound === undefined) {
        throw new Error(`Sound ${JSON.stringify(id)} was not loaded.`);
      }

      return sound;
    },
    loadSounds: () => loader.load('secondary'),
  };
}
