/**
 * store.ts — le catalogue du magasin : prix, parures, paquets d'or et de
 * lauriers.
 *
 * ⚠️ Pourquoi ce fichier n'est PAS dans `entities/gods/roster.ts`.
 *
 * Le roster décrit ce qu'un dieu **est** : sa couleur, sa capacité, ses
 * réglages. Ce qu'il **coûte** n'est pas de la même nature — c'est une
 * décision d'économie, qui se change en soldes un mardi soir sans que le jeu
 * bouge d'un pixel. Les mélanger obligerait à toucher au panthéon pour régler
 * un prix, et le contrat de la M12 (« un dieu = une ligne de données ») se
 * dissoudrait dans des considérations de boutique.
 *
 * Même principe que partout ailleurs : une parure = une ligne. Ajouter une
 * parure ne doit toucher ni le jeu, ni l'écran du magasin.
 */

import { GOD_ORDER, GODS, type GodId } from '../entities/gods/roster';

/**
 * Une parure a désormais deux paliers, pas juste deux niveaux de prix :
 *
 * - **commune** : la même divinité, d'une autre couleur — le petit achat
 *   qu'on refait, payé en or.
 * - **légendaire** : une tenue entièrement différente (un modèle 3D à part,
 *   voir `src/core/AssetLoader.ts`), payée en lauriers.
 *
 * L'union discriminée par `tier` (plutôt qu'un type unique à champs
 * optionnels) empêche STRUCTURELLEMENT une parure légendaire de porter son
 * propre `accent` : le halo du cortège reste toujours celui du dieu
 * (`GodAppearance.accent`, dans le roster), quelle que soit la tenue portée
 * — ce n'est pas une convention à respecter, le type ne laisse pas le champ
 * exister sur `LegendarySkin`.
 */
export type SkinTier = 'commune' | 'legendaire';

interface SkinBase {
  readonly id: string;
  readonly godId: GodId;
  /** Le nom affiché — court, il tient sur une vignette. */
  readonly label: string;
}

/** Le corps recoloré du dieu — le halo du cortège reste celui du roster. */
export interface CommonSkin extends SkinBase {
  readonly tier: 'commune';
  /** Le corps du dieu. */
  readonly color: number;
  /** Le halo et la teinte du cortège. */
  readonly accent: number;
  /** En or. 0 = fournie avec le dieu. */
  readonly price: number;
}

/** Une tenue entièrement différente — un modèle 3D à part, pas une teinte. */
export interface LegendarySkin extends SkinBase {
  readonly tier: 'legendaire';
  /**
   * Clé résolue par la table `require()` statique d'`AssetLoader.ts` — un
   * chemin construit dynamiquement ne serait pas vu par Metro au bundling.
   */
  readonly modelRef: string;
  /** En lauriers. */
  readonly price: number;
}

export type Skin = CommonSkin | LegendarySkin;

/**
 * L'identifiant de la parure d'origine d'un dieu.
 *
 * Elle n'est pas écrite dans le catalogue : elle EST le dieu, et ses couleurs
 * vivent déjà dans le roster. La dériver évite de les recopier — donc de les
 * voir diverger le jour où l'on retouchera une teinte.
 */
export function defaultSkinId(godId: GodId): string {
  return `${godId}-origine`;
}

/** La parure d'origine, fabriquée à partir de la ligne du dieu. Toujours commune. */
function originSkin(godId: GodId): CommonSkin {
  const god = GODS[godId];
  return {
    id: defaultSkinId(godId),
    godId,
    tier: 'commune',
    label: 'Origine',
    color: god.appearance.color,
    accent: god.appearance.accent,
    price: 0,
  };
}

/**
 * Les parures communes achetables.
 *
 * ⚠️ Les couleurs suivent la règle posée en M11 et rappelée par le roster :
 * la caméra plonge sur un sol clair (marbre, terre battue), donc une parure
 * pâle rendrait le dieu invisible dans sa propre cité. Toutes sont saturées
 * et plus sombres que la dalle la plus claire ; c'est l'accent, plus clair,
 * qui porte la couleur du cortège.
 */
const PURCHASABLE: readonly Skin[] = [
  { id: 'hermes-nuit', godId: 'hermes', tier: 'commune', label: 'Nuit', color: 0x1e3a8a, accent: 0x93c5fd, price: 120 },
  { id: 'hermes-olive', godId: 'hermes', tier: 'commune', label: 'Olivier', color: 0x3f6212, accent: 0xbef264, price: 120 },
  { id: 'zeus-orage', godId: 'zeus', tier: 'commune', label: 'Orage', color: 0x3f3f46, accent: 0xfef08a, price: 150 },
  { id: 'aphrodite-aurore', godId: 'aphrodite', tier: 'commune', label: 'Aurore', color: 0x9d174d, accent: 0xfecdd3, price: 150 },
  { id: 'poseidon-abysse', godId: 'poseidon', tier: 'commune', label: 'Abysse', color: 0x134e4a, accent: 0x5eead4, price: 150 },
  { id: 'athena-bronze', godId: 'athena', tier: 'commune', label: 'Bronze', color: 0x78350f, accent: 0xfcd34d, price: 150 },
  { id: 'hades-braise', godId: 'hades', tier: 'commune', label: 'Braise', color: 0x431407, accent: 0xfb923c, price: 150 },
  { id: 'ares-fer', godId: 'ares', tier: 'commune', label: 'Fer', color: 0x44403c, accent: 0xe7e5e4, price: 150 },
  // Les parures légendaires viennent ici, une fois qu'un premier modèle 3D
  // de tenue existe (voir assets/models/README.md) — aucune tant qu'aucun
  // .glb n'est déposé, pour ne pas référencer un modelRef qui pointe vers
  // rien.
];

/** Toutes les parures d'un dieu, l'origine en tête. */
export function skinsOf(godId: GodId): Skin[] {
  return [originSkin(godId), ...PURCHASABLE.filter((skin) => skin.godId === godId)];
}

/** La parure portant cet identifiant, ou `null` si personne ne la connaît. */
export function skinById(id: string): Skin | null {
  for (const godId of GOD_ORDER) {
    const found = skinsOf(godId).find((skin) => skin.id === id);
    if (found !== undefined) return found;
  }
  return null;
}

/** Toutes les parures achetables, dans l'ordre d'affichage des dieux. */
export function purchasableSkins(): Skin[] {
  return GOD_ORDER.flatMap((godId) => PURCHASABLE.filter((skin) => skin.godId === godId));
}

/**
 * Le prix d'un dieu, en or.
 *
 * Les deux dieux fournis d'emblée (`unlockedFromStart`) n'y figurent pas :
 * on ne vend pas ce que le joueur possède déjà.
 */
export const GOD_PRICES: Readonly<Record<GodId, number>> = {
  hermes: 0,
  zeus: 0,
  aphrodite: 400,
  poseidon: 400,
  athena: 600,
  hades: 600,
  ares: 800,
};

/**
 * Les paquets d'or contre argent réel.
 *
 * ⚠️ Ils sont AFFICHÉS mais INERTES, et c'est délibéré. Un achat intégré
 * demande un compte marchand, des identifiants de produit déclarés chez Apple
 * et Google, et une vérification côté serveur : c'est la M46 (monétisation),
 * pas une case à cocher. Les poser maintenant sert à voir la place qu'ils
 * prennent à l'écran — celle-là ne se découvre pas après coup.
 */
export interface GoldPack {
  readonly id: string;
  readonly gold: number;
  /** Le prix affiché, tel quel. Aucune conversion, aucune promesse. */
  readonly price: string;
  /** Mis en avant sur la rangée. Un seul, sinon plus rien ne ressort. */
  readonly featured: boolean;
}

export const GOLD_PACKS: readonly GoldPack[] = [
  { id: 'bourse', gold: 500, price: '1,99 €', featured: false },
  { id: 'coffre', gold: 1500, price: '4,99 €', featured: true },
  { id: 'tresor', gold: 4000, price: '9,99 €', featured: false },
];

/**
 * Les paquets de lauriers contre argent réel.
 *
 * Même principe que `GoldPack`, gardé comme un type à part plutôt que
 * généralisé : le laurier est une monnaie plus rare que l'or (moins
 * d'unités, prix plus élevé), pas la même chose sous un autre nom — un
 * champ `gold` partagé pour les deux aurait été trompeur à relire.
 *
 * ⚠️ INERTS, comme `GOLD_PACKS` : même raison (M46), voir plus haut.
 */
export interface LaurelPack {
  readonly id: string;
  readonly laurels: number;
  readonly price: string;
  readonly featured: boolean;
}

export const LAUREL_PACKS: readonly LaurelPack[] = [
  { id: 'larme', laurels: 50, price: '2,99 €', featured: false },
  { id: 'coupe', laurels: 180, price: '7,99 €', featured: true },
  { id: 'amphore', laurels: 500, price: '17,99 €', featured: false },
];
