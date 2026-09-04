/**
 * progression.ts — ce que le joueur possède, et rien d'autre.
 *
 * C'est un fichier de **données pures** : aucun React, aucun stockage, aucun
 * Three.js. On y entre un état et une intention, il en sort un nouvel état.
 * C'est ce qui permet de le lire d'un coup d'œil, de le tester sans lancer le
 * jeu, et de changer la façon de sauvegarder (`storage.ts`) sans y toucher.
 *
 * Toutes les fonctions RENVOIENT un nouvel état plutôt que de modifier celui
 * qu'on leur donne : React ne redessine que ce qui a changé d'identité, et un
 * état modifié sur place passerait inaperçu.
 */

import { GOD_ORDER, GODS, DEFAULT_GOD_ID, type GodId } from '../entities/gods/roster';
import { GOD_PRICES, defaultSkinId, skinById, skinsOf } from './store';

export interface Progression {
  /** La monnaie de la cité — celle qu'on gagne en jouant. */
  gold: number;
  /**
   * Le laurier : la monnaie des dieux, plus rare que l'or. Comme les
   * paquets d'or (`GOLD_PACKS`), il ne s'obtient pour l'instant que contre
   * argent réel — et cet achat est lui aussi INERTE (M46). Il vaut donc 0
   * tant que la monétisation n'existe pas ; c'est voulu.
   */
  laurels: number;
  /** Les dieux acquis. */
  ownedGods: GodId[];
  /** Les parures acquises, toutes divinités confondues. */
  ownedSkins: string[];
  /** Le dieu que lancera la prochaine partie. */
  selectedGod: GodId;
  /** La parure portée, pour chaque dieu possédé. */
  equippedSkins: Partial<Record<GodId, string>>;
  /** Le meilleur score, en fidèles. Affiché sur l'onglet Jouer. */
  bestScore: number;
}

/**
 * L'état d'un joueur qui n'a jamais joué.
 *
 * Les dieux fournis d'emblée sont ceux que le roster déclare — le magasin ne
 * décide pas de ce qui est offert, il lit la même ligne que le jeu.
 */
export function initialProgression(): Progression {
  const ownedGods = GOD_ORDER.filter((id) => GODS[id].unlockedFromStart);
  const equippedSkins: Partial<Record<GodId, string>> = {};
  for (const id of ownedGods) equippedSkins[id] = defaultSkinId(id);

  return {
    gold: 0,
    laurels: 0,
    ownedGods,
    ownedSkins: ownedGods.map(defaultSkinId),
    selectedGod: ownedGods.includes(DEFAULT_GOD_ID) ? DEFAULT_GOD_ID : ownedGods[0],
    equippedSkins,
    bestScore: 0,
  };
}

/**
 * Ce que rapporte une partie, en or.
 *
 * ⚠️ Un fidèle ne vaut PAS un or. À une conversion par seconde environ
 * (voir `mortals.count`), une partie de trois minutes rapporterait de quoi
 * acheter Arès : la boutique n'aurait plus rien à offrir au bout d'un
 * après-midi. Un tiers place le premier dieu supplémentaire à quelques
 * parties — assez proche pour donner envie, assez loin pour être un but.
 */
export function reward(faithful: number): number {
  return Math.floor(faithful / 3);
}

export function ownsGod(state: Progression, godId: GodId): boolean {
  return state.ownedGods.includes(godId);
}

export function ownsSkin(state: Progression, skinId: string): boolean {
  return state.ownedSkins.includes(skinId);
}

/** Le prix d'un dieu — 0 s'il est fourni d'emblée. */
export function godPrice(godId: GodId): number {
  return GOD_PRICES[godId];
}

/** Enregistre le résultat d'une partie : la récompense, et le record. */
export function finishRun(state: Progression, faithful: number): Progression {
  return {
    ...state,
    gold: state.gold + reward(faithful),
    bestScore: Math.max(state.bestScore, faithful),
  };
}

/**
 * Achète un dieu.
 *
 * Renvoie l'état INCHANGÉ si l'achat est impossible (déjà possédé, pas assez
 * d'or). L'écran n'a donc pas à vérifier deux fois : il propose, et
 * c'est ici que la règle s'applique — un seul endroit à relire pour savoir ce
 * qui est permis.
 */
export function buyGod(state: Progression, godId: GodId): Progression {
  if (ownsGod(state, godId)) return state;
  const price = godPrice(godId);
  if (state.gold < price) return state;

  return {
    ...state,
    gold: state.gold - price,
    ownedGods: [...state.ownedGods, godId],
    ownedSkins: [...state.ownedSkins, defaultSkinId(godId)],
    equippedSkins: { ...state.equippedSkins, [godId]: defaultSkinId(godId) },
  };
}

/**
 * Achète une parure. Le dieu correspondant doit être possédé.
 *
 * La monnaie débitée dépend du palier : l'or pour une parure commune, les
 * lauriers pour une légendaire — jamais l'inverse, c'est tout le sens de la
 * distinction des deux paliers.
 */
export function buySkin(state: Progression, skinId: string): Progression {
  const skin = skinById(skinId);
  if (skin === null) return state;
  if (ownsSkin(state, skinId)) return state;
  if (!ownsGod(state, skin.godId)) return state;

  if (skin.tier === 'commune') {
    if (state.gold < skin.price) return state;
    return {
      ...state,
      gold: state.gold - skin.price,
      ownedSkins: [...state.ownedSkins, skinId],
      // Une parure qu'on vient de payer se porte tout de suite : sans cela,
      // le joueur paie et il ne se passe rien à l'écran.
      equippedSkins: { ...state.equippedSkins, [skin.godId]: skinId },
    };
  }

  if (state.laurels < skin.price) return state;
  return {
    ...state,
    laurels: state.laurels - skin.price,
    ownedSkins: [...state.ownedSkins, skinId],
    equippedSkins: { ...state.equippedSkins, [skin.godId]: skinId },
  };
}

/** Choisit le dieu de la prochaine partie. */
export function selectGod(state: Progression, godId: GodId): Progression {
  if (!ownsGod(state, godId)) return state;
  return { ...state, selectedGod: godId };
}

/** Fait porter une parure possédée à son dieu. */
export function equipSkin(state: Progression, skinId: string): Progression {
  const skin = skinById(skinId);
  if (skin === null || !ownsSkin(state, skinId)) return state;
  return { ...state, equippedSkins: { ...state.equippedSkins, [skin.godId]: skinId } };
}

/**
 * Ce que le moteur doit afficher pour le dieu joué : soit une couleur plate
 * (parure commune, recolorable comme aujourd'hui), soit un modèle 3D à
 * charger en entier (parure légendaire, tenue différente).
 *
 * ⚠️ L'accent (halo, traînée du cortège) vient TOUJOURS du roster
 * (`GodAppearance.accent`), jamais de la parure — même une légendaire ne le
 * redéfinit pas, c'est une règle de conception, pas un oubli : le type
 * `LegendarySkin` ne porte structurellement pas de champ `accent`.
 */
export type PlayerAppearance =
  | { readonly kind: 'flat'; readonly color: number; readonly accent: number }
  | { readonly kind: 'model'; readonly modelRef: string; readonly accent: number };

/**
 * L'apparence à donner au jeu : celle de la parure portée par le dieu choisi.
 *
 * ⚠️ C'est le SEUL pont entre la boutique et le moteur. Le jeu reçoit une
 * apparence, il ne saura jamais qu'elle a été payée.
 */
export function appearanceOf(state: Progression): PlayerAppearance {
  const godId = state.selectedGod;
  const accent = GODS[godId].appearance.accent;
  const equipped = state.equippedSkins[godId];
  const skin = (equipped !== undefined ? skinById(equipped) : null) ?? skinsOf(godId)[0];

  if (skin.tier === 'commune') {
    return { kind: 'flat', color: skin.color, accent };
  }
  return { kind: 'model', modelRef: skin.modelRef, accent };
}

/**
 * Une couleur plate à afficher — pour les endroits qui ne savent PAS encore
 * dessiner un modèle 3D (les badges du menu, et le joueur en jeu tant que
 * `Player.ts` ne sait charger que des couleurs). Sous une parure légendaire,
 * on retombe sur la teinte d'origine du dieu : mieux vaut un badge qui
 * ressemble au dieu que le rendu figé d'un modèle qu'on ne sait pas encore
 * afficher en aperçu.
 */
export function flatColorOf(state: Progression): { color: number; accent: number } {
  const appearance = appearanceOf(state);
  if (appearance.kind === 'flat') return appearance;
  return GODS[state.selectedGod].appearance;
}

/**
 * Remet d'aplomb un état venu du disque.
 *
 * Une sauvegarde peut dater d'une version où un dieu n'existait pas encore,
 * où une parure a été retirée, ou avoir été tronquée par un plantage. Plutôt
 * que de faire confiance au fichier, on ne garde que ce que le catalogue
 * reconnaît encore — le jeu démarre toujours, quitte à avoir oublié une
 * parure disparue.
 */
export function sanitize(loaded: Partial<Progression> | null): Progression {
  const fresh = initialProgression();
  if (loaded === null) return fresh;

  const ownedGods = GOD_ORDER.filter(
    (id) => GODS[id].unlockedFromStart || (loaded.ownedGods ?? []).includes(id),
  );
  const known = new Set(ownedGods.flatMap((id) => skinsOf(id).map((skin) => skin.id)));
  const ownedSkins = [
    ...new Set([...ownedGods.map(defaultSkinId), ...(loaded.ownedSkins ?? []).filter((id) => known.has(id))]),
  ];

  const equippedSkins: Partial<Record<GodId, string>> = {};
  for (const id of ownedGods) {
    const wanted = loaded.equippedSkins?.[id];
    equippedSkins[id] =
      wanted !== undefined && ownedSkins.includes(wanted) ? wanted : defaultSkinId(id);
  }

  const selected = loaded.selectedGod;
  return {
    gold: Math.max(0, Math.floor(loaded.gold ?? 0)),
    laurels: Math.max(0, Math.floor(loaded.laurels ?? 0)),
    ownedGods,
    ownedSkins,
    selectedGod: selected !== undefined && ownedGods.includes(selected) ? selected : ownedGods[0],
    equippedSkins,
    bestScore: Math.max(0, Math.floor(loaded.bestScore ?? 0)),
  };
}
