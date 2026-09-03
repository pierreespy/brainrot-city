/**
 * store.ts — le catalogue du magasin : prix, parures, paquets de drachmes.
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

/** Une parure : la même divinité, d'une autre couleur. */
export interface Skin {
  readonly id: string;
  readonly godId: GodId;
  /** Le nom affiché — court, il tient sur une vignette. */
  readonly label: string;
  /** Le corps du dieu. */
  readonly color: number;
  /** Le halo et la teinte du cortège. */
  readonly accent: number;
  /** En drachmes. 0 = fournie avec le dieu. */
  readonly price: number;
}

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

/** La parure d'origine, fabriquée à partir de la ligne du dieu. */
function originSkin(godId: GodId): Skin {
  const god = GODS[godId];
  return {
    id: defaultSkinId(godId),
    godId,
    label: 'Origine',
    color: god.appearance.color,
    accent: god.appearance.accent,
    price: 0,
  };
}

/**
 * Les parures achetables.
 *
 * ⚠️ Les couleurs suivent la règle posée en M11 et rappelée par le roster :
 * la caméra plonge sur un sol clair (marbre, terre battue), donc une parure
 * pâle rendrait le dieu invisible dans sa propre cité. Toutes sont saturées
 * et plus sombres que la dalle la plus claire ; c'est l'accent, plus clair,
 * qui porte la couleur du cortège.
 */
const PURCHASABLE: readonly Skin[] = [
  { id: 'hermes-nuit', godId: 'hermes', label: 'Nuit', color: 0x1e3a8a, accent: 0x93c5fd, price: 120 },
  { id: 'hermes-olive', godId: 'hermes', label: 'Olivier', color: 0x3f6212, accent: 0xbef264, price: 120 },
  { id: 'zeus-orage', godId: 'zeus', label: 'Orage', color: 0x3f3f46, accent: 0xfef08a, price: 150 },
  { id: 'aphrodite-aurore', godId: 'aphrodite', label: 'Aurore', color: 0x9d174d, accent: 0xfecdd3, price: 150 },
  { id: 'poseidon-abysse', godId: 'poseidon', label: 'Abysse', color: 0x134e4a, accent: 0x5eead4, price: 150 },
  { id: 'athena-bronze', godId: 'athena', label: 'Bronze', color: 0x78350f, accent: 0xfcd34d, price: 150 },
  { id: 'hades-braise', godId: 'hades', label: 'Braise', color: 0x431407, accent: 0xfb923c, price: 150 },
  { id: 'ares-fer', godId: 'ares', label: 'Fer', color: 0x44403c, accent: 0xe7e5e4, price: 150 },
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
 * Le prix d'un dieu, en drachmes.
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
 * Les paquets de drachmes contre argent réel.
 *
 * ⚠️ Ils sont AFFICHÉS mais INERTES, et c'est délibéré. Un achat intégré
 * demande un compte marchand, des identifiants de produit déclarés chez Apple
 * et Google, et une vérification côté serveur : c'est la M46 (monétisation),
 * pas une case à cocher. Les poser maintenant sert à voir la place qu'ils
 * prennent à l'écran — celle-là ne se découvre pas après coup.
 */
export interface CoinPack {
  readonly id: string;
  readonly drachmas: number;
  /** Le prix affiché, tel quel. Aucune conversion, aucune promesse. */
  readonly price: string;
  /** Mis en avant sur la rangée. Un seul, sinon plus rien ne ressort. */
  readonly featured: boolean;
}

export const COIN_PACKS: readonly CoinPack[] = [
  { id: 'bourse', drachmas: 500, price: '1,99 €', featured: false },
  { id: 'coffre', drachmas: 1500, price: '4,99 €', featured: true },
  { id: 'tresor', drachmas: 4000, price: '9,99 €', featured: false },
];
