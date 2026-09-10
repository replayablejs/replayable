const container = document.createElement('div');
document.body.append(container);

/** Minimal runtime facade used to verify canvas mounting in isolation. */
export const playable = { container };
