/** Adds a localized label that fits inside CSS-authored button padding, like Pixi's fitText. */
export function addButtonLabel(button: HTMLButtonElement, text: string): () => void {
  const label = document.createElement('span');
  label.className = 'button-label';
  label.textContent = text;
  button.append(label);

  // Button dimensions come from layout, not the label. Measure only on size
  // changes (including the initially hidden endcard becoming visible).
  const observer = new ResizeObserver(() => {
    if (button.clientWidth === 0) {
      return;
    }

    // Fit at the authored font size, not the result of the previous resize.
    // Adjust typography instead of adding a second scale beneath the breathing button.
    label.style.fontSize = 'inherit';
    if (label.offsetWidth === 0 || label.offsetHeight === 0) {
      return;
    }

    const style = getComputedStyle(button);
    const width =
      button.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const height =
      button.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);

    const scale = Math.max(0, Math.min(1, width / label.offsetWidth, height / label.offsetHeight));
    label.style.fontSize = `${parseFloat(style.fontSize) * scale}px`;
  });
  observer.observe(button);

  return () => observer.disconnect();
}
