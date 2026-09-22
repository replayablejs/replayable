import { sprites } from '../../assets/registries/sprites';
import { createSpriteImage } from './create-sprite-image';

/** Combine the home icon and two-line title into one logo. Brand text stays untranslated. */
export function createLogo(): HTMLElement {
  const homeIcon = createSpriteImage(sprites['ui/home'], '');
  const wordmark = createWordmark();

  const logo = document.createElement('div');
  logo.className = 'city-logo';
  // Announce the complete brand once, rather than its decorative parts.
  logo.setAttribute('role', 'img');
  logo.ariaLabel = 'City Builder';
  logo.append(homeIcon, wordmark);

  return logo;
}

/** CSS stacks “City” above “Builder” and gives each line its size and color. */
function createWordmark(): HTMLSpanElement {
  const cityLine = document.createElement('span');
  cityLine.textContent = 'City';

  const builderLine = document.createElement('span');
  builderLine.textContent = 'Builder';

  const wordmark = document.createElement('span');
  wordmark.className = 'city-logo-title';
  wordmark.ariaHidden = 'true';
  wordmark.append(cityLine, builderLine);

  return wordmark;
}
