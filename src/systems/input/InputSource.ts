/**
 * InputSource.ts — le contrat commun à toutes les façons de jouer.
 *
 * C'est l'idée clé de tout le projet côté contrôles : le jeu ne demande
 * jamais « quelle touche est appuyée ? » ni « où est le doigt ? ». Il demande
 * seulement « dans quelle direction veut-on aller ? ».
 *
 * Du coup, joystick tactile, clavier et (plus tard) manette sont
 * interchangeables sans qu'une seule ligne du jeu ne change.
 */

/** Direction voulue, normalisée entre -1 et 1. (0, 0) = immobile. */
export interface MoveIntent {
  x: number;
  z: number;
}

export interface InputSource {
  getMoveIntent(): MoveIntent;
  dispose(): void;
}

/**
 * Normalise un vecteur pour que sa longueur ne dépasse jamais 1.
 *
 * Sans ça, aller en diagonale donnerait une longueur de 1,41 : on se
 * déplacerait 41 % plus vite en biais qu'en ligne droite. C'est un grand
 * classique du bug de déplacement.
 */
export function clampToUnitCircle(x: number, z: number): MoveIntent {
  const length = Math.hypot(x, z);
  if (length > 1) {
    return { x: x / length, z: z / length };
  }
  return { x, z };
}
