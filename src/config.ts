/**
 * config.ts — TOUS les réglages du jeu au même endroit.
 *
 * C'est LE fichier à modifier pour tester des choses : change une valeur,
 * sauvegarde, le jeu se recharge tout seul. Aucun autre fichier à toucher.
 */

export const CONFIG = {
  /** Le monde est un carré centré sur (0, 0). Ici : de -60 à +60 sur X et Z. */
  world: {
    halfSize: 60,
    groundColor: 0x2c3040,
  },

  player: {
    /** Unités par seconde. Monte à 30 pour voir la différence. */
    speed: 18,
    /** Le joueur est une capsule : rayon et hauteur du corps. */
    radius: 0.6,
    height: 1.6,
    color: 0x4ade80,
    /**
     * Temps (en secondes) pour atteindre la pleine vitesse.
     * 0 = démarrage sec, 0.3 = démarrage souple. C'est du "game feel".
     */
    acceleration: 0.12,
  },

  camera: {
    /** Position de la caméra RELATIVE au joueur (vue 3/4 arrière). */
    offset: { x: 0, y: 26, z: 20 },
    /** Souplesse du suivi : 0 = collée, 1 = très molle. */
    smoothing: 0.12,
    fov: 50,
  },
} as const;
