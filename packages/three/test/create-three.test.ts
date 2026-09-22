// @vitest-environment happy-dom
import { PerspectiveCamera, Mesh, BoxGeometry, MeshBasicMaterial } from 'three';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

import { createThree } from '../src/create-three.js';
import { loadThreeModel } from '../src/loader/load-three-model.js';
import { loadThreeTexture } from '../src/loader/load-three-texture.js';

const state = vi.hoisted(() => ({
  construct: vi.fn<(options: object) => void>(),
  dispose: vi.fn<() => void>(),
  clearColor: vi.fn<(color: string, alpha: number) => void>(),
  setPixelRatio: vi.fn<(ratio: number) => void>(),
  setSize: vi.fn<(width: number, height: number, style: boolean) => void>(),
  resetState: vi.fn<() => void>(),
  render: vi.fn<(scene: unknown, camera: unknown) => void>(),
  shared: vi.fn<() => WebGL2RenderingContext | WebGLRenderingContext | null>(),
  context: vi.fn<() => WebGL2RenderingContext>(),
  setContext: vi.fn<(context: WebGL2RenderingContext) => void>(),
  canvas: vi.fn<() => HTMLCanvasElement>(),
  destroyHost: vi.fn<() => void>(),
  on: vi.fn<(event: string, callback: () => void) => () => void>(),
  add: vi.fn<(callback: (context: { deltaSeconds: number }) => void) => () => void>(),
  register: vi.fn<() => () => void>(),
  unregister: vi.fn<() => void>(),
  stopResize: vi.fn<() => void>(),
  stopRender: vi.fn<() => void>(),
  screen: { frame: undefined as { width: number; height: number } | undefined, resolution: 1 },
}));

vi.mock('@replayablejs/runtime', () => ({
  playable: {
    config: { backgroundColor: '#abcdef' },
    screen: state.screen,
    on: state.on,
    update: { add: state.add },
    loader: { register: state.register },
  },
}));
vi.mock('@replayablejs/canvas', () => ({
  getCanvasHost: () => ({
    getCanvas: state.canvas,
    getSharedContext: state.shared,
    setSharedContext: state.setContext,
    destroy: state.destroyHost,
  }),
}));
vi.mock('three', async (importOriginal) => ({
  ...(await importOriginal<typeof import('three')>()),
  WebGLRenderer: class {
    autoClear = true;
    constructor(options: object) {
      state.construct(options);
    }
    dispose = state.dispose;
    setClearColor = state.clearColor;
    setPixelRatio = state.setPixelRatio;
    setSize = state.setSize;
    getContext = state.context;
    resetState = state.resetState;
    render = state.render;
  },
}));

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal(
    'WebGL2RenderingContext',
    class {
      readonly version = 2;
    },
  );
  vi.stubGlobal(
    'WebGLRenderingContext',
    class {
      readonly version = 1;
    },
  );
  state.shared.mockReturnValue(null);
  state.context.mockReturnValue(new WebGL2RenderingContext());
  state.canvas.mockReturnValue(document.createElement('canvas'));
  state.on.mockReturnValue(state.stopResize);
  state.add.mockReturnValue(state.stopRender);
  state.register.mockReturnValue(state.unregister);
  state.screen.frame = undefined;
  state.screen.resolution = 1;
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Three renderer foundation', () => {
  it('owns a new canvas and renders only when the runtime dispatches an update', () => {
    const camera = new PerspectiveCamera(40, 1, 0.1, 100);
    const three = createThree({ camera, antialias: true, powerPreference: 'low-power' });
    expect(state.construct).toHaveBeenCalledWith({
      canvas: state.canvas(),
      alpha: false,
      antialias: true,
      powerPreference: 'low-power',
    });
    expect(state.register).toHaveBeenCalledWith('models', loadThreeModel);
    expect(state.register).toHaveBeenCalledWith('textures', loadThreeTexture);
    expect(three).not.toHaveProperty('createModel');
    expect(state.setContext).toHaveBeenCalledWith(state.context());
    expect(state.clearColor).toHaveBeenCalledWith('#abcdef', 1);
    expect(three.renderer.autoClear).toBe(true);
    expect(three.camera).toBe(camera);
    expect(state.render).not.toHaveBeenCalled();
    const frame = state.add.mock.calls[0]?.[0];
    expect(frame).toBeTypeOf('function');
    frame?.({ deltaSeconds: 1 / 60 });
    expect(state.render).toHaveBeenCalledWith(three.scene, camera);
    expect(state.resetState.mock.invocationCallOrder[0]).toBeLessThan(
      state.render.mock.invocationCallOrder[0] ?? Infinity,
    );
    three.destroy();
    three.destroy();
    expect(state.unregister).toHaveBeenCalledTimes(2);
    expect(state.stopRender).toHaveBeenCalledOnce();
    expect(state.stopResize).toHaveBeenCalledOnce();
    expect(state.dispose).toHaveBeenCalledOnce();
    expect(state.destroyHost).toHaveBeenCalledOnce();
    expect(state.stopRender.mock.invocationCallOrder[0]).toBeLessThan(
      state.dispose.mock.invocationCallOrder[0] ?? Infinity,
    );
  });

  it('rolls back integrations and loader registrations when renderer setup fails', () => {
    const release = vi.fn<() => void>();
    const setup = vi.fn<() => () => void>().mockReturnValue(release);
    state.construct.mockImplementation(() => {
      throw new Error('renderer failed');
    });
    expect(() =>
      createThree({ camera: new PerspectiveCamera(), integrations: [{ setup }] }),
    ).toThrow('renderer failed');
    expect(setup).toHaveBeenCalledOnce();
    expect(release).toHaveBeenCalledOnce();
    expect(state.unregister).toHaveBeenCalledTimes(2);
  });

  it('borrows WebGL 2 without clearing or destroying the existing host', () => {
    const context = new WebGL2RenderingContext();
    state.shared.mockReturnValue(context);
    const three = createThree({ camera: new PerspectiveCamera() });
    expect(state.construct).toHaveBeenCalledWith(expect.objectContaining({ context, alpha: true }));
    expect(three.renderer.autoClear).toBe(false);
    expect(state.setContext).not.toHaveBeenCalled();
    three.destroy();
    expect(state.dispose).toHaveBeenCalledOnce();
    expect(state.destroyHost).not.toHaveBeenCalled();
  });

  it('rejects a borrowed WebGL 1 context without destroying its owner', () => {
    state.shared.mockReturnValue(new WebGLRenderingContext());
    expect(() => createThree({ camera: new PerspectiveCamera() })).toThrow('WebGL 2');
    expect(state.construct).not.toHaveBeenCalled();
    expect(state.destroyHost).not.toHaveBeenCalled();
  });

  it('catches up to the current screen and resizes without overwriting camera choices or CSS', () => {
    state.screen.frame = { width: 600, height: 300 };
    state.screen.resolution = 2;
    const camera = new PerspectiveCamera(40, 1, 0.5, 200);
    camera.position.set(1, 2, 3);
    const projection = vi.spyOn(camera, 'updateProjectionMatrix');
    const three = createThree({ camera });
    expect(state.setPixelRatio).toHaveBeenLastCalledWith(2);
    expect(state.setSize).toHaveBeenLastCalledWith(600, 300, false);
    expect(camera.aspect).toBe(2);
    const resize = state.on.mock.calls[0]?.[1];
    state.screen.frame = { width: 300, height: 600 };
    state.screen.resolution = 1.5;
    resize?.();
    expect(state.setPixelRatio).toHaveBeenLastCalledWith(1.5);
    expect(state.setSize).toHaveBeenLastCalledWith(300, 600, false);
    expect(camera.aspect).toBe(0.5);
    expect(camera.fov).toBe(40);
    expect(camera.near).toBe(0.5);
    expect(camera.far).toBe(200);
    expect(camera.position.toArray()).toEqual([1, 2, 3]);
    expect(projection).toHaveBeenCalledTimes(2);
    state.screen.frame = { width: 0, height: 0 };
    resize?.();
    expect(projection).toHaveBeenCalledTimes(2);
    three.destroy();
  });

  it('receives the first resize after creation before readiness', () => {
    const three = createThree({ camera: new PerspectiveCamera() });
    expect(state.setSize).not.toHaveBeenCalled();
    state.screen.frame = { width: 320, height: 480 };
    state.on.mock.calls[0]?.[1]();
    expect(state.setSize).toHaveBeenCalledWith(320, 480, false);
    three.destroy();
  });

  it('detaches scene contents without disposing application-owned GPU resources', () => {
    const three = createThree({ camera: new PerspectiveCamera() });
    const geometry = new BoxGeometry();
    const material = new MeshBasicMaterial();
    const disposeGeometry = vi.spyOn(geometry, 'dispose');
    const disposeMaterial = vi.spyOn(material, 'dispose');
    const mesh = new Mesh(geometry, material);
    three.scene.add(mesh);
    three.destroy();
    expect(mesh.parent).toBeNull();
    expect(disposeGeometry).not.toHaveBeenCalled();
    expect(disposeMaterial).not.toHaveBeenCalled();
    geometry.dispose();
    material.dispose();
  });

  it('releases the owned canvas if renderer construction fails', () => {
    state.construct.mockImplementation(() => {
      throw new Error('WebGL unavailable');
    });
    expect(() => createThree({ camera: new PerspectiveCamera() })).toThrow('WebGL unavailable');
    expect(state.destroyHost).toHaveBeenCalledOnce();
    expect(state.dispose).not.toHaveBeenCalled();
  });

  it('releases renderer and host when configuration fails', () => {
    state.clearColor.mockImplementation(() => {
      throw new Error('configuration failed');
    });
    expect(() => createThree({ camera: new PerspectiveCamera() })).toThrow('configuration failed');
    expect(state.dispose).toHaveBeenCalledOnce();
    expect(state.destroyHost).toHaveBeenCalledOnce();
  });

  it('unsubscribes when initial screen synchronization fails', () => {
    state.screen.frame = { width: 400, height: 600 };
    state.setSize.mockImplementation(() => {
      throw new Error('resize failed');
    });
    expect(() => createThree({ camera: new PerspectiveCamera() })).toThrow('resize failed');
    expect(state.stopResize).toHaveBeenCalledOnce();
    expect(state.dispose).toHaveBeenCalledOnce();
    expect(state.destroyHost).toHaveBeenCalledOnce();
    expect(state.add).not.toHaveBeenCalled();
  });

  it('rolls back screen subscriptions when frame subscription fails', () => {
    state.add.mockImplementation(() => {
      throw new Error('subscribe failed');
    });
    expect(() => createThree({ camera: new PerspectiveCamera() })).toThrow('subscribe failed');
    expect(state.stopResize).toHaveBeenCalledOnce();
    expect(state.dispose).toHaveBeenCalledOnce();
    expect(state.destroyHost).toHaveBeenCalledOnce();
  });

  it('preserves setup and cleanup errors together', () => {
    const setup = new Error('subscribe failed');
    const cleanup = new Error('dispose failed');
    state.add.mockImplementation(() => {
      throw setup;
    });
    state.dispose.mockImplementation(() => {
      throw cleanup;
    });
    expect(() => createThree({ camera: new PerspectiveCamera() })).toThrow(
      new AggregateError([setup, cleanup], 'Three setup and cleanup failed.', { cause: setup }),
    );
    expect(state.destroyHost).toHaveBeenCalledOnce();
  });

  it('completes cleanup despite errors and never retries a destroyed resource', () => {
    const three = createThree({ camera: new PerspectiveCamera() });
    state.stopRender.mockImplementation(() => {
      throw new Error('unsubscribe failed');
    });
    state.dispose.mockImplementation(() => {
      throw new Error('dispose failed');
    });
    expect(() => three.destroy()).toThrow(AggregateError);
    expect(state.stopResize).toHaveBeenCalledOnce();
    expect(state.destroyHost).toHaveBeenCalledOnce();
    expect(() => three.destroy()).not.toThrow();
    expect(state.dispose).toHaveBeenCalledOnce();
  });
});
