/**
 * roster.ts — le catalogue des dieux jouables. Un dieu = UNE LIGNE.
 *
 * C'est le pari d'architecture annoncé dans [`UNIVERS.md`](../../../UNIVERS.md) :
 * un dieu n'est **pas une classe**, c'est une ligne de données. Apparence,
 * capacité, deux réglages propres — rien d'autre. Ajouter un huitième dieu
 * doit coûter une ligne ici et une implémentation de capacité, jamais une
 * modification du jeu lui-même.
 *
 * ⚠️ **Le jeu ne connaîtra jamais « Zeus ».** Il connaît « le dieu
 * sélectionné » et lui demande sa couleur ou sa capacité. C'est le même
 * contrat que pour les entrées (`systems/input/InputSource.ts`, où le jeu ne
 * sait pas s'il est piloté au doigt ou au clavier) et que pour les quartiers
 * (`world/districts.ts`, où la ville ne sait pas ce qu'est une Acropole).
 * Toute ligne de code qui testerait `if (god.id === 'zeus')` trahit ce
 * contrat : ce qui doit varier appartient à la ligne du dieu.
 *
 * **Ce que cette milestone ne fait PAS**, volontairement :
 *
 *   - l'écran de sélection (M13) — ici, on joue `DEFAULT_GOD_ID` ;
 *   - l'apparence réellement appliquée au joueur (M14) — les couleurs sont
 *     décidées, mais `Player` lit encore `CONFIG.player.color` ;
 *   - le déblocage progressif (M15) — `unlockedFromStart` est renseigné,
 *     personne ne le lit encore ;
 *   - les capacités elles-mêmes (M19 à M27) — `ability` décrit ce qu'elles
 *     feront, il n'y a pas encore une ligne de code pour les exécuter.
 *
 * C'est la même prudence que pour le **type** des mortels, posé en M4 alors
 * qu'il n'existait qu'un seul type : greffer ces champs plus tard, sur un
 * code qui suppose « il n'y a qu'un seul dieu », coûterait une réécriture.
 */

/** Les sept dieux du panthéon jouable. */
export type GodId =
  | 'hermes'
  | 'zeus'
  | 'aphrodite'
  | 'poseidon'
  | 'athena'
  | 'hades'
  | 'ares';

/**
 * Les sept capacités. Une par dieu, et le lien est fixe : c'est la capacité
 * qui définit la façon de jouer, pas l'inverse.
 */
export type AbilityId =
  | 'talaria'
  | 'foudre'
  | 'charme'
  | 'ressac'
  | 'egide'
  | 'styx'
  | 'charge';

/**
 * Ce que le jeu sait d'une capacité **avant** de savoir l'exécuter.
 *
 * Les durées et recharges vivent ici, et pas dans l'implémentation à venir
 * (M19+) : l'équilibrage (M27) se règle en relisant un tableau, pas en
 * fouillant sept fichiers.
 */
export interface AbilitySpec {
  readonly id: AbilityId;
  /** Nom affiché — sur le bouton de capacité (M19) et à la sélection (M13). */
  readonly label: string;
  /** Une ligne, à hauteur de joueur : ce que ça fait, pas comment. */
  readonly description: string;
  /**
   * Durée de l'effet, en secondes. **0 = instantané** (Foudre, Ressac,
   * Retour du Styx : elles agissent à l'activation et c'est fini).
   */
  readonly duration: number;
  /** Temps avant de pouvoir la relancer, en secondes. */
  readonly cooldown: number;
}

/**
 * De quoi le dieu a l'air.
 *
 * ⚠️ Les couleurs suivent la leçon de la M11 : la caméra plonge, le joueur
 * voit surtout **le sol**, qui est clair (marbre et terre battue). Un dieu
 * pâle disparaîtrait dedans, exactement comme les mortels beiges avant qu'on
 * les assombrisse. Toutes les teintes ci-dessous sont donc saturées et plus
 * sombres que la dalle la plus foncée de la cité.
 */
export interface GodAppearance {
  /** Le corps du dieu. */
  readonly color: number;
  /**
   * La teinte secondaire — halo, traînée, liseré du cortège (M14, M33).
   * Plus claire que `color` : c'est elle qui doit se voir en mouvement.
   */
  readonly accent: number;
}

/**
 * Les « un ou deux réglages propres » du dieu, en **multiplicateurs** des
 * valeurs de `CONFIG` — jamais en valeurs absolues. Un dieu ne redéfinit pas
 * le jeu, il l'infléchit ; et si l'on retouche la vitesse de base du joueur,
 * les sept dieux suivent tout seuls.
 *
 * ⚠️ Ils valent tous 1 pour l'instant, et c'est un choix, pas un oubli :
 * inventer des écarts avant d'avoir joué reviendrait à équilibrer à
 * l'aveugle. C'est le travail de la **M27**, qui aura les capacités sous la
 * main pour juger. Le champ existe dès maintenant pour la raison habituelle :
 * l'ajouter après coup obligerait à reprendre `Player` et `Conversion`.
 */
export interface GodTuning {
  /** Multiplie `CONFIG.player.speed`. */
  readonly speed: number;
  /** Multiplie `CONFIG.conversion.radius`. */
  readonly conversionRadius: number;
}

export interface God {
  readonly id: GodId;
  /** Le nom du dieu, tel qu'affiché. */
  readonly label: string;
  /** Son domaine, en trois mots — l'aide à choisir sur l'écran de sélection. */
  readonly domain: string;
  readonly appearance: GodAppearance;
  readonly ability: AbilitySpec;
  readonly tuning: GodTuning;
  /**
   * Disponible dès la première partie ?
   *
   * Deux seulement le sont : **Hermès**, le plus lisible (courir plus vite se
   * comprend sans explication), et **Zeus**, le plus spectaculaire. Les cinq
   * autres se débloquent en jouant (M15) — c'est ce qui donne une raison de
   * rejouer sans rien demander au joueur.
   */
  readonly unlockedFromStart: boolean;
}

/** Réglages neutres — le cas par défaut tant que la M27 n'a pas tranché. */
const NEUTRAL: GodTuning = { speed: 1, conversionRadius: 1 };

/**
 * Le catalogue.
 *
 * Chaque capacité répond à un **problème de jeu différent**, pour que choisir
 * son dieu soit un vrai choix et pas une préférence esthétique :
 * la distance (Hermès), le ramassage (Zeus, Poséidon), la marge d'erreur
 * (Aphrodite), la perte (Athéna, Hadès) et le conflit (Arès).
 */
export const GODS: Record<GodId, God> = {
  hermes: {
    id: 'hermes',
    label: 'Hermès',
    domain: 'Voyageurs et messagers',
    appearance: { color: 0x1d84b5, accent: 0x7dd3fc },
    ability: {
      id: 'talaria',
      label: 'Talaria',
      description: 'Sprint : +80 % de vitesse, le cortège suit sans se disloquer.',
      duration: 3,
      cooldown: 12,
    },
    tuning: NEUTRAL,
    unlockedFromStart: true,
  },

  zeus: {
    id: 'zeus',
    label: 'Zeus',
    domain: 'Ciel et foudre',
    appearance: { color: 0xb45309, accent: 0xfde047 },
    ability: {
      id: 'foudre',
      label: 'Foudre',
      description: 'Convertit d’un coup tous les mortels dans un rayon.',
      duration: 0,
      cooldown: 20,
    },
    tuning: NEUTRAL,
    unlockedFromStart: true,
  },

  aphrodite: {
    id: 'aphrodite',
    label: 'Aphrodite',
    domain: 'Amour et beauté',
    appearance: { color: 0xbe185d, accent: 0xf9a8d4 },
    ability: {
      id: 'charme',
      label: 'Charme',
      description: 'Le rayon de conversion est multiplié par 2,5.',
      duration: 6,
      cooldown: 20,
    },
    tuning: NEUTRAL,
    unlockedFromStart: false,
  },

  poseidon: {
    id: 'poseidon',
    label: 'Poséidon',
    domain: 'Mers et tremblements',
    appearance: { color: 0x0e5a6e, accent: 0x67e8f9 },
    ability: {
      id: 'ressac',
      label: 'Ressac',
      description: 'Une vague pousse vers toi les mortels devant toi.',
      duration: 0,
      cooldown: 18,
    },
    tuning: NEUTRAL,
    unlockedFromStart: false,
  },

  athena: {
    id: 'athena',
    label: 'Athéna',
    domain: 'Sagesse et stratégie',
    appearance: { color: 0x0f766e, accent: 0x99f6e4 },
    ability: {
      id: 'egide',
      label: 'Égide',
      description: 'Ton cortège ne peut rien perdre.',
      duration: 5,
      cooldown: 25,
    },
    tuning: NEUTRAL,
    unlockedFromStart: false,
  },

  hades: {
    id: 'hades',
    label: 'Hadès',
    domain: 'Enfers et richesses',
    appearance: { color: 0x5b21b6, accent: 0xc4b5fd },
    ability: {
      id: 'styx',
      label: 'Retour du Styx',
      description: 'Récupère la moitié des fidèles perdus récemment.',
      duration: 0,
      cooldown: 30,
    },
    tuning: NEUTRAL,
    unlockedFromStart: false,
  },

  ares: {
    id: 'ares',
    label: 'Arès',
    domain: 'Guerre et carnage',
    appearance: { color: 0x991b1b, accent: 0xfca5a5 },
    ability: {
      id: 'charge',
      label: 'Charge',
      description: 'Ton cortège vole des fidèles aux cortèges rivaux.',
      duration: 4,
      cooldown: 22,
    },
    tuning: NEUTRAL,
    unlockedFromStart: false,
  },
};

/**
 * L'ordre d'affichage — celui de l'écran de sélection (M13).
 *
 * Écrit à la main plutôt que dérivé de `GODS` : l'ordre des clés d'un objet
 * est un détail d'écriture, pas une décision de design. Les deux dieux
 * disponibles d'emblée viennent en tête, sinon le joueur ouvrirait un écran
 * dont les premières cases sont verrouillées.
 */
export const GOD_ORDER: readonly GodId[] = [
  'hermes',
  'zeus',
  'aphrodite',
  'poseidon',
  'athena',
  'hades',
  'ares',
];

/**
 * Le dieu joué tant qu'il n'y a pas d'écran pour en choisir un (M13).
 *
 * Hermès : sa capacité est la plus lisible, et il est débloqué d'emblée.
 */
export const DEFAULT_GOD_ID: GodId = 'hermes';

/** Le dieu correspondant à cet identifiant. */
export function godById(id: GodId): God {
  return GODS[id];
}

/** Les dieux jouables dès la première partie — lu par la M15. */
export function startingGods(): God[] {
  return GOD_ORDER.map((id) => GODS[id]).filter((god) => god.unlockedFromStart);
}
