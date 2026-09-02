/**
 * districts.ts — le plan de la cité : quel quartier occupe quel pâté.
 *
 * C'est le remède au défaut de jeu constaté en Milestone 2, et écrit noir sur
 * blanc dans [`UNIVERS.md`](../../UNIVERS.md) : la grille était **uniforme**,
 * donc tous les carrefours se ressemblaient — on s'y perdait et on ne mesurait
 * pas sa progression.
 *
 * La cité compte 36 pâtés de maisons. Chacun reçoit ici un **quartier**, et le
 * quartier décide de tout le reste : la couleur du sol qu'on foule, ce qu'on
 * y construit, et **combien de mortels y vivent**. Traverser la cité, c'est
 * donc traverser des ambiances, pas répéter un motif.
 *
 * ⚠️ Le plan est **écrit à la main**, pas tiré au sort — contrairement au
 * contenu de chaque pâté, qui reste généré par la graine. Un repère tiré au
 * hasard n'est pas un repère : l'Acropole doit être au même endroit à chaque
 * partie, sinon elle n'aide personne à s'orienter.
 *
 *        x = -82  -49  -16  +16  +49  +82
 *   z = -82   ·    ·   ACRO  ·   BOIS  ·        ← le nord, droit devant
 *   z = -49   ·    ·    ·    ·    ·   THÉÂ
 *   z = -16  BOIS  ·   AGORA AGORA ·    ·
 *   z = +16   ·    ·   AGORA AGORA ·    ·       ← (0, 0) : le départ
 *   z = +49   ·    ·    ·    ·    ·    ·
 *   z = +82  PORT PORT PORT PORT PORT PORT      ← la mer au-delà
 *
 *   (· = la Céramique, le tissu urbain courant)
 */

/** Les six quartiers de la cité. */
export type DistrictId =
  | 'agora'
  | 'ceramique'
  | 'acropole'
  | 'port'
  | 'theatre'
  | 'boisSacre';

/** Comment on remplit un pâté de ce quartier. */
export type BuildStyle =
  /** Des maisons serrées, plaquées sur la rue : le tissu urbain. */
  | 'houses'
  /** Rien au sol, une colonnade sur le pourtour : une place. */
  | 'colonnade'
  /** Une plateforme et un temple dessus. */
  | 'temple'
  /** Des entrepôts bas et larges, le long du quai. */
  | 'warehouses'
  /** Des gradins en demi-cercle. */
  | 'tiers'
  /** Des oliviers, pas de bâti. */
  | 'grove';

export interface District {
  readonly id: DistrictId;
  /** Nom affiché au joueur quand il y entre. */
  readonly label: string;
  /**
   * Couleur de la dalle du pâté.
   *
   * ⚠️ C'est le réglage le plus important du fichier. La caméra plonge de
   * haut : ce que le joueur voit le plus, c'est **le sol**. Deux quartiers
   * qui partagent leur couleur de sol sont deux quartiers qu'on confondra.
   */
  readonly ground: number;
  /** Façades. Plusieurs teintes pour que le quartier ne soit pas plat. */
  readonly walls: readonly number[];
  /** Toits de tuiles — ou `null` pour du marbre nu, à ciel ouvert. */
  readonly roof: number | null;
  readonly build: BuildStyle;
  /**
   * Densité de mortels, 1 = la moyenne de la cité.
   *
   * C'est ce qui donne une RAISON d'aller quelque part : l'agora et le
   * théâtre valent le détour, le bois sacré est un raccourci désert.
   */
  readonly crowd: number;
}

const MARBLE = [0xe6e0d0, 0xdcd4c0, 0xefe9db, 0xd2c8b2] as const;
const OCHRE = [0xd9c6a1, 0xc9b48d, 0xe2d2b0, 0xbfa87f, 0xd0bb96] as const;
const TILE = 0xc4694a;

export const DISTRICTS: Record<DistrictId, District> = {
  agora: {
    id: 'agora',
    label: 'Agora',
    ground: 0xd8d2c0,
    walls: MARBLE,
    roof: null,
    build: 'colonnade',
    // Le cœur de la cité : c'est ici qu'on démarre, et il faut que ça
    // convertisse tout de suite, sinon la partie commence dans le vide.
    crowd: 2.6,
  },

  ceramique: {
    id: 'ceramique',
    label: 'La Céramique',
    ground: 0xcaa476,
    walls: OCHRE,
    roof: TILE,
    build: 'houses',
    crowd: 1,
  },

  acropole: {
    id: 'acropole',
    label: 'Acropole',
    ground: 0xe4dcc6,
    walls: MARBLE,
    roof: 0xc4694a,
    build: 'temple',
    // Peu de monde : c'est un sanctuaire, et il vaut pour le repère, pas
    // pour la récolte.
    crowd: 0.5,
  },

  port: {
    id: 'port',
    label: 'Le Port',
    ground: 0x9aa08c,
    walls: [0xc2ac86, 0xb09a76, 0xd0bb96],
    roof: 0xb05c3e,
    build: 'warehouses',
    crowd: 1.3,
  },

  theatre: {
    id: 'theatre',
    label: 'Le Théâtre',
    ground: 0xcfc7b0,
    walls: MARBLE,
    roof: null,
    build: 'tiers',
    // Le gros paquet de mortels d'un coup, promis par UNIVERS.md.
    crowd: 3,
  },

  boisSacre: {
    id: 'boisSacre',
    label: 'Bois sacré',
    ground: 0x7f8b4c,
    walls: MARBLE,
    roof: null,
    build: 'grove',
    crowd: 0.4,
  },
};

/**
 * Quel quartier occupe le pâté (bx, bz) ?
 *
 * Les indices sont ceux de la génération de `City.ts` : le pâté (bx, bz) est
 * centré en `bx × pitch + pitch / 2`. Pour une cité de 198 unités et un pas de
 * 33, ils vont de -3 à +2.
 *
 * L'ordre des tests compte : le premier qui répond gagne. Les repères
 * passent donc AVANT le tissu urbain, qui n'est que le cas par défaut.
 */
export function districtAt(bx: number, bz: number, lastBlock: number): DistrictId {
  // Le port occupe toute la rangée du bord, côté caméra : la mer devient le
  // bord de la carte, et on n'a plus besoin d'un mur invisible de ce côté.
  if (bz === lastBlock) return 'port';

  // L'Acropole est au nord, presque dans l'axe du départ : c'est la
  // direction où court un joueur qui ne sait pas encore où aller.
  if (bx === -1 && bz === -lastBlock - 1) return 'acropole';

  if (bx === lastBlock && bz === -1) return 'theatre';

  if (bx === -lastBlock - 1 && bz === 0) return 'boisSacre';
  if (bx === 1 && bz === -lastBlock - 1) return 'boisSacre';

  // Les quatre pâtés qui touchent (0, 0) : le joueur démarre à leur coin
  // commun, donc au milieu de l'agora.
  if ((bx === -1 || bx === 0) && (bz === -1 || bz === 0)) return 'agora';

  return 'ceramique';
}

/**
 * Le quartier qui contient le point (x, z).
 *
 * Sert au HUD — annoncer au joueur où il se trouve — et au peuplement.
 * Les rues appartiennent au pâté le plus proche : on n'est jamais « nulle
 * part », ce qui éviterait au HUD de clignoter à chaque traversée de rue.
 */
export function districtAtPoint(
  x: number,
  z: number,
  pitch: number,
  lastBlock: number,
): DistrictId {
  const bx = clampBlock(Math.round(x / pitch - 0.5), lastBlock);
  const bz = clampBlock(Math.round(z / pitch - 0.5), lastBlock);
  return districtAt(bx, bz, lastBlock);
}

function clampBlock(value: number, lastBlock: number): number {
  if (value < -lastBlock - 1) return -lastBlock - 1;
  if (value > lastBlock) return lastBlock;
  return value;
}
