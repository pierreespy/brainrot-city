/**
 * TouchInput.ts — la direction donnée par le joystick tactile.
 *
 * Ce fichier ne connaît PAS les doigts, les écrans ni React. C'est juste une
 * boîte qui contient une direction. Le composant visuel `Joystick.tsx` la
 * remplit, le jeu la lit. Cette séparation permet de tester la logique de jeu
 * sans écran tactile.
 */

import type { InputSource, MoveIntent } from './InputSource';
import { clampToUnitCircle } from './InputSource';

export class TouchInput implements InputSource {
  private intent: MoveIntent = { x: 0, z: 0 };

  /** Appelé par le joystick quand le doigt bouge. */
  setIntent(x: number, z: number): void {
    this.intent = clampToUnitCircle(x, z);
  }

  /** Appelé quand le doigt est relâché : le personnage s'arrête. */
  clear(): void {
    this.intent = { x: 0, z: 0 };
  }

  getMoveIntent(): MoveIntent {
    return this.intent;
  }

  dispose(): void {
    this.clear();
  }
}
