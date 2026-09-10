import { Rectangle, SplitText } from 'pixi.js';
import { describe, expect, it } from 'vitest';

import { fitText } from '../src/text/fit-text.js';

/** Fixed bounds isolate scale fitting from browser font measurement. */
function createLabel(): SplitText {
  const text = new SplitText({ text: 'Label', style: {}, autoSplit: false });
  text.boundsArea = new Rectangle(-100, -25, 200, 50);
  return text;
}

describe('fitText', () => {
  it('fits uniformly and recomputes from local bounds on every call', () => {
    const text = createLabel();
    fitText(text, { width: 100, height: 50 });
    expect(text.scale).toMatchObject({ x: 0.5, y: 0.5 });
    fitText(text, { width: 100, height: 50 });
    expect(text.scale.x).toBe(0.5);
    fitText(text, { width: 400, height: 10 });
    expect(text.scale).toMatchObject({ x: 0.2, y: 0.2 });
    fitText(text, { width: 400 });
    expect(text.scale).toMatchObject({ x: 1, y: 1 });
    text.destroy({ children: true });
  });

  it('leaves placement and content unchanged', () => {
    const text = createLabel();
    text.position.set(20, 30);
    text.pivot.set(4, 5);
    text.rotation = 0.4;
    fitText(text, { width: 100 });
    expect(text.position).toMatchObject({ x: 20, y: 30 });
    expect(text.pivot).toMatchObject({ x: 4, y: 5 });
    expect(text.rotation).toBe(0.4);
    expect(text.text).toBe('Label');
    text.destroy({ children: true });
  });

  it('handles empty bounds without a non-finite scale', () => {
    const text = createLabel();
    text.boundsArea = new Rectangle(0, 0, 0, 0);
    fitText(text, { width: 100, height: 50 });
    expect(text.scale).toMatchObject({ x: 1, y: 1 });
    text.destroy({ children: true });
  });

  it.each([0, -1, Infinity, NaN])('rejects invalid fitting dimensions: %s', (dimension) => {
    const text = createLabel();
    expect(() => fitText(text, { width: dimension })).toThrow('positive finite');
    expect(() => fitText(text, { width: 100, height: dimension })).toThrow('positive finite');
    text.destroy({ children: true });
  });
});
