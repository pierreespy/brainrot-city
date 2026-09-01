/**
 * InputManager.ts — regroupe toutes les sources de contrôle.
 *
 * Le jeu ne parle qu'à cette classe. Elle interroge chaque source disponible
 * et renvoie la première direction non nulle. Concrètement : sur téléphone
 * c'est le joystick qui répond, sur le banc de test web c'est le clavier —
 * et les deux cohabitent sans conflit.
 *
 * Ajouter une manette plus tard = ajouter une source ici, rien d'autre.
 */

import type { InputSource, MoveIntent } from './InputSource';
import { TouchInput } from './TouchInput';
import { KeyboardInput, isKeyboardAvailable } from './KeyboardInput';

const IDLE: MoveIntent = { x: 0, z: 0 };

export class InputManager {
  /** Exposé pour que le composant Joystick puisse le remplir. */
  readonly touch = new TouchInput();

  private readonly sources: InputSource[];

  constructor() {
    this.sources = [this.touch];
    // Le clavier n'existe que dans un navigateur : sur mobile on ne
    // l'instancie même pas, ça évite des écouteurs inutiles.
    if (isKeyboardAvailable()) {
      this.sources.push(new KeyboardInput());
    }
  }

  getMoveIntent(): MoveIntent {
    for (const source of this.sources) {
      const intent = source.getMoveIntent();
      if (intent.x !== 0 || intent.z !== 0) return intent;
    }
    return IDLE;
  }

  dispose(): void {
    for (const source of this.sources) source.dispose();
  }
}
