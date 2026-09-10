import type { LetterWheel } from '../../types/panel';
import type { PuzzleLevel } from '../../types/puzzle';
import { fitStageToPanel } from '../layout/fit-stage-to-panel';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const FULL_ROTATION = Math.PI * 2;
const START_ANGLE = -Math.PI / 2;
const WHEEL_RADIUS_PERCENT = 37;
const WHEEL_SIZE_PIXELS = 340;

/** Builds the wheel's fixed SVG coordinate space and its responsive containing panel. */
export function createLetterWheel(
  level: PuzzleLevel,
  tutorial: HTMLElement,
  instruction: string,
): LetterWheel {
  const wheelPanel = document.createElement('section');
  const wheelStage = document.createElement('div');
  const currentWord = document.createElement('output');
  const letterWheel = document.createElement('div');
  const selectionPath = document.createElementNS(SVG_NAMESPACE, 'svg');
  const selectionLine = document.createElementNS(SVG_NAMESPACE, 'polyline');
  wheelPanel.className = 'wheel-panel';
  wheelPanel.ariaLabel = instruction;
  wheelStage.className = 'wheel-stage';
  currentWord.className = 'current-word';
  currentWord.ariaLive = 'polite';
  letterWheel.className = 'letter-wheel';
  letterWheel.role = 'group';
  letterWheel.ariaLabel = instruction;
  selectionPath.classList.add('selection-path');
  selectionPath.ariaHidden = 'true';
  selectionPath.setAttribute('viewBox', `0 0 ${WHEEL_SIZE_PIXELS} ${WHEEL_SIZE_PIXELS}`);
  selectionLine.classList.add('selection-line');
  selectionPath.append(selectionLine);
  const letterButtons = createLetterButtons(letterWheel, level);
  letterWheel.append(selectionPath);
  wheelStage.append(currentWord, letterWheel, tutorial);
  wheelPanel.append(wheelStage);
  const stopFitting = fitStageToPanel(wheelPanel, wheelStage);

  return {
    wheelPanel,
    currentWord,
    letterWheel,
    selectionLine,
    letterButtons,
    destroy: stopFitting,
  };
}

/** Creates one accessible button per uniquely identified wheel token. */
function createLetterButtons(
  letterWheel: HTMLElement,
  level: PuzzleLevel,
): ReadonlyMap<string, HTMLButtonElement> {
  const buttons = new Map<string, HTMLButtonElement>();

  for (const [index, letter] of level.letters.entries()) {
    const button = document.createElement('button');
    const angle = START_ANGLE + (index / level.letters.length) * FULL_ROTATION;

    button.className = 'letter-button';
    button.type = 'button';
    button.textContent = letter.value;
    button.dataset.letterId = letter.id;
    button.setAttribute('aria-pressed', 'false');
    button.style.setProperty('--letter-x', `${50 + Math.cos(angle) * WHEEL_RADIUS_PERCENT}%`);
    button.style.setProperty('--letter-y', `${50 + Math.sin(angle) * WHEEL_RADIUS_PERCENT}%`);
    letterWheel.append(button);
    buttons.set(letter.id, button);
  }

  return buttons;
}
