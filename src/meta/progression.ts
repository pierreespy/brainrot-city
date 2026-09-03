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
  /** La monnaie de la cité. */
  drachmas: number;
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
    drachmas: 0,
    ownedGods,
    ownedSkins: ownedGods.map(defaultSkinId),
    selectedGod: ownedGods.includes(DEFAULT_GOD_ID) ? DEFAULT_GOD_ID : ownedGods[0],
    equippedSkins,
    bestScore: 0,
  };
}

/**
 * Ce que rapporte une partie, en drachmes.
 *
 * ⚠️ Un fidèle ne vaut PAS une drachme. À une conversion par seconde environ
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
    drachmas: state.drachmas + reward(faithful),
    bestScore: Math.max(state.bestScore, faithful),
  };
}

/**
 * Achète un dieu.
 *
 * Renvoie l'état INCHANGÉ si l'achat est impossible (déjà possédé, pas assez
 * de drachmes). L'écran n'a donc pas à vérifier deux fois : il propose, et
 * c'est ici que la règle s'applique — un seul endroit à relire pour savoir ce
 * qui est permis.
 */
export function buyGod(state: Progression, godId: GodId): Progression {
  if (ownsGod(state, godId)) return state;
  const price = godPrice(godId);
  if (state.drachmas < price) return state;

  return {
    ...state,
    drachmas: state.drachmas - price,
    ownedGods: [...state.ownedGods, godId],
    ownedSkins: [...state.ownedSkins, defaultSkinId(godId)],
    equippedSkins: { ...state.equippedSkins, [godId]: defaultSkinId(godId) },
  };
}

/** Achète une parure. Le dieu correspondant doit être possédé. */
export function buySkin(state: Progression, skinId: string): Progression {
  const skin = skinById(skinId);
  if (skin === null) return state;
  if (ownsSkin(state, skinId)) return state;
  if (!ownsGod(state, skin.godId)) return state;
  if (state.drachmas < skin.price) return state;

  return {
    ...state,
    drachmas: state.drachmas - skin.price,
    ownedSkins: [...state.ownedSkins, skinId],
    // Une parure qu'on vient de payer se porte tout de suite : sans cela, le
    // joueur paie et il ne se passe rien à l'écran.
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
 * L'apparence à donner au jeu : celle de la parure portée par le dieu choisi.
 *
 * ⚠️ C'est le SEUL pont entre la boutique et le moteur. Le jeu reçoit deux
 * couleurs, il ne saura jamais qu'elles ont été payées.
 */
export function appearanceOf(state: Progression): { color: number; accent: number } {
  const godId = state.selectedGod;
  const equipped = state.equippedSkins[godId];
  const skin = (equipped !== undefined ? skinById(equipped) : null) ?? skinsOf(godId)[0];
  return { color: skin.color, accent: skin.accent };
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
    drachmas: Math.max(0, Math.floor(loaded.drachmas ?? 0)),
    ownedGods,
    ownedSkins,
    selectedGod: selected !== undefined && ownedGods.includes(selected) ? selected : ownedGods[0],
    equippedSkins,
    bestScore: Math.max(0, Math.floor(loaded.bestScore ?? 0)),
  };
}
