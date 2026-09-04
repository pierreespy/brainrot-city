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
