/** Build-only runtime substitute: no host, asset, or platform setup is needed. */
export const playable = {
  config: {
    devtools: {
      stats: {
        display: 'expanded',
        fps: true,
        frameInterval: true,
        jsHeap: true,
        drawCalls: true,
        textureBinds: true,
        programUses: true,
      },
    },
  },
  state: { visible: true },
  postRender: {
    add() {
      return () => {};
    },
  },
  on() {
    return () => {};
  },
};
