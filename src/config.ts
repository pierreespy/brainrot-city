/**
 * config.ts — TOUS les réglages du jeu au même endroit.
 *
 * C'est LE fichier à modifier pour tester des choses : change une valeur,
 * sauvegarde, le jeu se recharge tout seul. Aucun autre fichier à toucher.
 */

export const CONFIG = {
  /**
   * Le monde est un carré centré sur (0, 0). Ici : de -99 à +99 sur X et Z.
   *
   * ⚠️ Cette valeur est choisie comme un MULTIPLE EXACT du pas de la ville
   * (`blockSize + roadWidth` = 33) : le bord du monde tombe alors au milieu
   * d'une rue, jamais dans un immeuble, et la ville remplit tout le terrain.
   */
  world: {
    halfSize: 99,
    /** Couleur du sol = l'asphalte des rues (les trottoirs sont posés dessus). */
    groundColor: 0x30354a,
  },

  /**
   * La ville. Elle est faite de RUES et de PÂTÉS DE MAISONS alternés.
   *
   * Le motif se répète tous les `blockSize + roadWidth` : les rues sont
   * centrées sur les multiples de ce pas, donc (0, 0) — où démarre le
   * joueur — est toujours un carrefour.
   */
  city: {
    /** Côté d'un pâté de maisons, entre deux rues. */
    blockSize: 22,
    /** Largeur d'une rue, d'un trottoir à l'autre. */
    roadWidth: 11,
    /** Le trottoir dépasse du pâté : c'est lui qu'on longe en courant. */
    sidewalkHeight: 0.18,
    sidewalkColor: 0x474e68,
    /** Chaque pâté est découpé en `lotsPerBlock` × `lotsPerBlock` parcelles. */
    lotsPerBlock: 2,
    /**
     * Profondeur de l'immeuble, en multiples de sa parcelle. Le bâtiment est
     * plaqué sur la RUE et déborde vers l'intérieur du pâté : à 1 il occupe
     * exactement sa parcelle, à 1.4 il mord sur la cour.
     *
     * ⚠️ Ne jamais descendre sous 1 : les immeubles laisseraient des trous
     * entre eux et la ville deviendrait traversable en diagonale.
     */
    lotDepth: { min: 1, max: 1.45 },
    /**
     * Hauteur des immeubles. Volontairement BASSE : plus haut, les façades
     * situées derrière le joueur passeraient devant la caméra et le
     * cacheraient (constaté au banc de test). À relire avec `camera.offset`.
     */
    height: { min: 4, max: 10 },
    /** Probabilité qu'une parcelle reste vide (place, terrain vague). */
    emptyLotChance: 0.12,
    /** Palette des façades — tirée au hasard, mais toujours la même partie. */
    palette: [0x5f6890, 0x7079a3, 0x515a7f, 0x828bb4, 0x6a7398, 0x4d5578],
    /**
     * Graine du générateur aléatoire. Change ce nombre = autre ville.
     * Fixe = la ville est identique à chaque lancement (et testable).
     */
    seed: 20260902,
  },

  /**
   * Les mortels — les PNJ que l'on convertit (Milestone 4).
   *
   * ⚠️ Un mortel a un **type** dès maintenant, alors qu'il n'en existe qu'un
   * seul (le citoyen). C'est volontaire : hoplites, prêtresses et philosophes
   * sont prévus (voir UNIVERS.md), et les greffer plus tard sur un code qui
   * suppose « tous les mortels sont identiques » coûterait une réécriture.
   */
  mortals: {
    /** Combien de mortels vivent dans la cité en même temps. */
    count: 100,

    /**
     * Le catalogue des types. Un type = une ligne, comme pour les dieux.
     * `value` est le nombre de fidèles gagnés à la conversion (Milestone 4).
     */
    types: {
      citizen: {
        label: 'Citoyen',
        color: 0xd8c9a3,
        value: 1,
        /** Unités par seconde. Très lent face aux 18 u/s du joueur. */
        speed: 2.6,
        radius: 0.45,
        height: 1.1,
      },
    },

    /** Durée d'une marche en ligne droite avant de changer de cap. */
    wander: { minSeconds: 2, maxSeconds: 5 },

    /**
     * Écart maximal (en radians) autour d'une direction cardinale.
     *
     * Les mortels ne partent PAS dans une direction totalement aléatoire :
     * ils suivent l'axe des rues, avec un léger flottement. Sans cela, ils
     * passeraient leur temps le nez dans les façades.
     */
    headingJitter: 0.35,

    /** Graine du placement initial : la même cité peuplée à chaque lancement. */
    seed: 77,
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
    /**
     * Position de la caméra RELATIVE au joueur (vue 3/4 arrière).
     *
     * ⚠️ Le rapport y/z fixe l'inclinaison, et donc ce qui peut passer
     * DEVANT le joueur : ici la ligne de visée monte de 40 pour 18, soit
     * 2,2 unités de hauteur par unité de recul. Un immeuble situé 5 unités
     * derrière le joueur devrait donc dépasser 11 de haut pour le cacher —
     * c'est pour cela que `city.height.max` reste bas.
     */
    offset: { x: 0, y: 40, z: 18 },
    /** Souplesse du suivi : 0 = collée, 1 = très molle. */
    smoothing: 0.12,
    /**
     * Champ de vision. Plus élevé sur téléphone (écran étroit tenu à la
     * verticale) pour qu'on voie assez de ville autour du joueur.
     */
    fov: 60,
    /**
     * Anticipation : la caméra vise un peu DEVANT le joueur, proportion-
     * nellement à sa vitesse. On voit ainsi où l'on va, pas d'où l'on vient.
     * 0 = désactivé. Exprimé en unités de monde à pleine vitesse.
     *
     * ⚠️ Le coût d'un demi-tour est le DOUBLE de cette valeur. À 7, faire
     * droite puis gauche balayait 14 unités à 65 u/s — presque quatre fois
     * la vitesse du joueur : l'image se bousculait.
     */
    lookAhead: 3.5,
    /**
     * Souplesse propre à l'anticipation. Même convention que `smoothing` :
     * c'est la part de l'écart qui RESTE à chaque frame, donc plus c'est
     * proche de 1, plus c'est mou. Elle doit rester nettement plus molle que
     * le suivi, sinon la caméra part avant le joueur.
     */
    lookAheadSmoothing: 0.965,
    /**
     * En dessous de cette intensité de mouvement, on ne change plus la
     * cible d'anticipation : elle est simplement CONSERVÉE. Sans ça,
     * relâcher le doigt recentrait la caméra, et repartir dans l'autre sens
     * la relançait — deux mouvements parasites pour un simple aller-retour.
     */
    lookAheadDeadZone: 0.15,
  },

  joystick: {
    /** Rayon du joystick en points. Au-delà, l'intensité est au maximum. */
    radius: 60,
    /**
     * Sous ce déplacement du doigt (en points), on considère qu'on n'a pas
     * bougé. Sans cette zone morte, le personnage tremblote sur place.
     */
    deadZone: 8,
  },
} as const;
