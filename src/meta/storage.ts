/**
 * storage.ts — la progression survit à la fermeture de l'app.
 *
 * Le seul fichier du dossier `meta/` qui connaisse le téléphone. Il ne décide
 * de rien : il écrit du texte et en relit, et c'est `progression.ts` qui juge
 * de ce que ce texte vaut (voir `sanitize`).
 *
 * Deux précautions, pour la même raison — une sauvegarde ne doit jamais
 * empêcher de jouer :
 *
 *   1. tout est enveloppé dans un `try` : un disque plein ou un stockage
 *      indisponible fait perdre la progression, pas la partie ;
 *   2. l'écriture est DIFFÉRÉE. Acheter trois parures d'affilée n'écrit
 *      qu'une fois, et l'écriture ne tombe jamais au milieu d'une image.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { sanitize, type Progression } from './progression';

/**
 * La clé, et son numéro de version.
 *
 * ⚠️ Le numéro fait partie de la clé, à dessein. Le jour où la forme de la
 * sauvegarde changera vraiment, passer à `v2` fait repartir les anciennes
 * installations d'une progression neuve **sans planter**, au lieu de tenter
 * de deviner un format disparu.
 */
const KEY = 'divine-city/progression/v1';

/** Délai avant écriture. Assez long pour grouper, assez court pour ne rien perdre. */
const WRITE_DELAY = 400;

let pending: ReturnType<typeof setTimeout> | null = null;

/** Lit la progression enregistrée. Renvoie l'état neuf s'il n'y a rien. */
export async function loadProgression(): Promise<Progression> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw === null) return sanitize(null);
    return sanitize(JSON.parse(raw) as Partial<Progression>);
  } catch {
    // Illisible ou corrompu : on repart d'une progression neuve plutôt que de
    // bloquer le joueur devant un écran vide.
    return sanitize(null);
  }
}

/** Enregistre la progression, un peu plus tard. */
export function saveProgression(state: Progression): void {
  if (pending !== null) clearTimeout(pending);
  pending = setTimeout(() => {
    pending = null;
    void AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {
      // Rien à faire de plus : la partie en cours n'en dépend pas.
    });
  }, WRITE_DELAY);
}

/** Efface la progression (bouton des paramètres). */
export async function clearProgression(): Promise<void> {
  if (pending !== null) {
    clearTimeout(pending);
    pending = null;
  }
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // Idem : l'écran repart de toute façon d'un état neuf.
  }
}
