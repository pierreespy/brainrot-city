/**
 * Input.ts — traduit "ce que fait le joueur" en une direction simple.
 *
 * IMPORTANT (architecture) : le reste du jeu ne sait PAS si tu joues au
 * clavier, au joystick tactile ou à la manette. Il demande juste "dans quelle
 * direction veut-on aller ?" et reçoit un vecteur entre -1 et 1.
 *
 * C'est pour ça que le portage mobile ne touchera QUE ce fichier.
 */

/** Direction voulue, normalisée. (0,0) = immobile. */
export interface MoveIntent {
  x: number;
  z: number;
}

export class Input {
  /** Ensemble des touches physiquement enfoncées à cet instant. */
  private readonly pressed = new Set<string>();
  private readonly intent: MoveIntent = { x: 0, z: 0 };

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

    // En diagonale, (1,1) a une longueur de 1.41 : on irait plus vite en
    // biais qu'en ligne droite. On normalise pour que la vitesse soit égale
    // dans toutes les directions.
    const length = Math.hypot(x, z);
    if (length > 0) {
      x /= length;
      z /= length;
    }

    this.intent.x = x;
    this.intent.z = z;
    return this.intent;
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
  }
}
