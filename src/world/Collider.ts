/**
 * Collider.ts — le contrat commun de tout ce qui bloque le passage.
 *
 * Même idée que `InputSource` côté contrôles : le joueur ne sait pas ce
 * qu'est un bâtiment. Il demande seulement « ma position est-elle valide ?
 * sinon, corrige-la ». La ville répond aujourd'hui ; demain une voiture ou
 * un mur d'arène répondront pareil, sans toucher au joueur.
 */

import type * as THREE from 'three';

export interface Collider {
  /**
   * Repousse `position` (x, z) hors des obstacles, en place.
   *
   * @param position position au sol à corriger (modifiée directement)
   * @param radius   rayon du personnage : on ne colle pas les murs
   * @returns true si la position a dû être corrigée
   */
  resolve(position: THREE.Vector2, radius: number): boolean;

  /**
   * Sort `position` d'un AMAS d'obstacles mitoyens, en place.
   *
   * `resolve()` traite chaque obstacle séparément et peut donc faire passer
   * d'un mur au suivant indéfiniment. `extract()` garantit la sortie, au
   * prix de quelques tests de plus : à réserver aux personnages qu'on
   * BOUSCULE — les fidèles se poussent entre eux et finissent dans les murs,
   * là où le joueur, lui, n'y entre jamais.
   */
  extract(position: THREE.Vector2, radius: number): boolean;
}

/** Un obstacle rectangulaire aligné sur les axes (le seul type utile ici). */
export interface Box2 {
  x: number;
  z: number;
  halfX: number;
  halfZ: number;
}
