/** Reports every trusted browser input that constitutes playable activity. */
export function observeUserActivity(listener: () => void): void {
  const handleInteraction = (event: Event): void => {
    if (!event.isTrusted) {
      return;
    }

    listener();
  };

  document.addEventListener('click', handleInteraction, true);
  document.addEventListener('keydown', handleInteraction, true);
  document.addEventListener('mousedown', handleInteraction, true);
  document.addEventListener('pointerdown', handleInteraction, true);
  document.addEventListener('touchstart', handleInteraction, true);
}
