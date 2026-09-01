/**
 * KeyboardInput.ts — contrôle au clavier.
 *
 * Utile sur la cible web, qui nous sert de banc de test : on peut y lancer
 * le jeu automatiquement et vérifier que tout marche, sans téléphone.
 * Sur iOS et Android, cette classe ne s'active tout simplement pas.
 */

import type { InputSource, MoveIntent } from './InputSource';
import { clampToUnitCircle } from './InputSource';

/** Vrai uniquement quand on tourne dans un navigateur. */
export function isKeyboardAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.addEventListener === 'function';
}

export class KeyboardInput implements InputSource {
  private readonly pressed = new Set<string>();

  private readonly onKeyDown = (e: KeyboardEvent) => {
    this.pressed.add(e.code);
    // Empêche la page de défiler quand on joue aux flèches.
    if (e.code.startsWith('Arrow')) e.preventDefault();
  };

  private readonly onKeyUp = (e: KeyboardEvent) => {
    this.pressed.delete(e.code);
  };

  /** Si on quitte l'onglet, on relâche tout : évite le joueur "bloqué en marche". */
  private readonly onBlur = () => {
    this.pressed.clear();
  };

  constructor() {
    if (!isKeyboardAvailable()) return;
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
  }

  /**
   * On lit `event.code` et non `event.key` : `code` désigne la POSITION
   * physique de la touche. Du coup ZQSD (AZERTY) et WASD (QWERTY)
   * fonctionnent tous les deux sans configuration.
   */
  getMoveIntent(): MoveIntent {
    let x = 0;
    let z = 0;

    if (this.pressed.has('KeyW') || this.pressed.has('KeyZ') || this.pressed.has('ArrowUp')) z -= 1;
    if (this.pressed.has('KeyS') || this.pressed.has('ArrowDown')) z += 1;
    if (this.pressed.has('KeyA') || this.pressed.has('KeyQ') || this.pressed.has('ArrowLeft')) x -= 1;
    if (this.pressed.has('KeyD') || this.pressed.has('ArrowRight')) x += 1;

    return clampToUnitCircle(x, z);
  }

  dispose(): void {
    if (!isKeyboardAvailable()) return;
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
  }
}
