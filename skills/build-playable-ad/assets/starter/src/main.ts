import { playable } from '@replayablejs/runtime';

await playable.ready();

const button = document.createElement('button');
button.textContent = 'Tap to play';
button.style.cssText = 'padding: 24px; font: 24px sans-serif; cursor: pointer';
playable.container.style.cssText =
  'display: grid; place-items: center; background: #17171c; color: white';
playable.container.append(button);

button.addEventListener('click', () => {
  button.textContent = 'You played!';
  button.disabled = true;
  playable.complete('success');
});
