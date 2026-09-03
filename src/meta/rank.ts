/**
 * rank.ts — le niveau du joueur, déduit de ce qu'il a déjà fait.
 *
 * ⚠️ Le niveau n'est PAS stocké. Il se calcule à partir du meilleur cortège,
 * la seule trace durable d'une partie réussie (voir `progression.ts`). Un
 * champ de plus dans la sauvegarde aurait exigé de le faire vivre à chaque
 * fin de partie, de le réparer au chargement, et de décider quoi en faire
 * quand la formule change — pour une information qui se recalcule en une
 * ligne.
 *
 * La marche est VOLONTAIREMENT plate au début : le bandeau supérieur montre
 * un niveau dès la première partie, plutôt qu'un « niveau 1 » immobile
 * pendant une heure.
 */

/** Le cortège à atteindre pour passer du niveau `level` au suivant. */
const STEP = 50;

export interface Rank {
  /** Le niveau affiché, à partir de 1. */
  level: number;
  /** Ce qui est acquis dans le niveau en cours. */
  progress: number;
  /** Ce qu'il faut pour le finir. */
  needed: number;
}

export function rankOf(bestScore: number): Rank {
  const total = Math.max(0, Math.floor(bestScore));
  return {
    level: 1 + Math.floor(total / STEP),
    progress: total % STEP,
    needed: STEP,
  };
}
