/**
 * icons.ts — la table des images de l'interface, et la seule.
 *
 * ⚠️ Metro doit VOIR le chemin : un `require()` est résolu à la compilation,
 * pas à l'exécution. Construire le chemin (`require('../../../assets/ui/' +
 * nom)`) rendrait l'image introuvable sur téléphone alors qu'elle
 * s'afficherait très bien sur le banc web. D'où cette table écrite à la main,
 * une ligne par fichier — c'est le prix, et il est payé une fois.
 *
 * ⚠️ Ce sont des PNG, pas des JPEG : chacun est DÉTOURÉ, et c'est tout
 * l'intérêt. Une amphore posée sur la barre de bois doit laisser voir le bois
 * autour d'elle. Les sources de travail restent dans `images/` (voir son
 * README) ; ici ne vivent que les fichiers empaquetés avec l'app.
 */

import type { ImageSourcePropType } from 'react-native';
import type { GodId } from '../../entities/gods/roster';
import type { DistrictId } from '../../world/districts';

export const ICONS = {
  /** Le fronton du temple — l'onglet du panthéon. */
  olympe: require('../../../assets/ui/olympe.png') as ImageSourcePropType,
  /** Le casque ailé sur sa couronne — l'onglet du passe de combat. */
  passe: require('../../../assets/ui/passe.png') as ImageSourcePropType,
  /** L'amphore et ses pièces — l'onglet de la boutique. */
  boutique: require('../../../assets/ui/boutique.png') as ImageSourcePropType,
  /** La pièce d'or : la monnaie des mortels, partout où un prix s'affiche. */
  or: require('../../../assets/ui/piece-or.png') as ImageSourcePropType,
  /** La couronne de laurier : la monnaie rare, celle des dieux. */
  laurier: require('../../../assets/ui/laurier.png') as ImageSourcePropType,
} as const;

/**
 * Les médaillons des quartiers, sur la frise de l'onglet « Jouer ».
 *
 * ⚠️ Ils sont appariés par SUJET, pas par position : le port porte la vague,
 * le bois sacré les pins, l'acropole le volcan, et l'agora les colonnes —
 * c'est un quartier à colonnade (voir `districts.ts`). Le rang à l'écran, lui,
 * suit le niveau qui ouvre chaque étape, et peut changer sans que ces couples
 * bougent.
 *
 * ⚠️ La table est PARTIELLE : la Céramique et le Théâtre n'ont pas d'image, et
 * n'apparaissent pas encore dans la frise. Un quartier sans médaillon retombe
 * sur son émoji, il ne casse rien.
 */
export const DISTRICT_ICONS: Partial<Record<DistrictId, ImageSourcePropType>> = {
  agora: require('../../../assets/ui/desert.png') as ImageSourcePropType,
  port: require('../../../assets/ui/vague.png') as ImageSourcePropType,
  boisSacre: require('../../../assets/ui/foret.png') as ImageSourcePropType,
  acropole: require('../../../assets/ui/volcan.png') as ImageSourcePropType,
};

/**
 * Le portrait d'une divinité, pour le médaillon du bandeau supérieur.
 *
 * ⚠️ La table est PARTIELLE, et c'est voulu : seul Zeus est dessiné. Les six
 * autres gardent la pastille de leurs deux couleurs, qui a l'avantage d'être
 * EXACTE — elle lit la parure équipée, donc elle montre ce que le joueur
 * verra en jeu. Un portrait par dieu la remplacera quand les six existeront ;
 * en attendant, mieux vaut un seul portrait vrai que sept pastilles pour un
 * dieu qui, lui, a son visage.
 */
export const PORTRAITS: Partial<Record<GodId, ImageSourcePropType>> = {
  zeus: require('../../../assets/ui/zeus.png') as ImageSourcePropType,
};

/**
 * Les plaques gravées : des boutons ENTIERS, intitulé compris.
 *
 * ⚠️ Le texte est dans les pixels. Une plaque ne peut donc porter que
 * l'action qu'elle annonce — la reprendre pour un autre libellé mentirait au
 * joueur, et aucun `label` ne viendrait corriger l'image. C'est pourquoi
 * elles sont séparées des icônes ci-dessus, qui, elles, vont partout.
 */
export const PLATES = {
  /** « TROUVER MATCH » — l'appel de l'arène en ligne. */
  match: require('../../../assets/ui/bouton-match.png') as ImageSourcePropType,
  /** « CONTINUER » — la reprise d'une course déjà commencée. */
  continuer: require('../../../assets/ui/bouton-continuer.png') as ImageSourcePropType,
} as const;
