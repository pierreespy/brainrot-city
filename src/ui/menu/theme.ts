/**
 * theme.ts — les quelques valeurs que TOUS les écrans de menu partagent.
 *
 * Un menu de jeu n'a pas besoin d'un système de design : il a besoin qu'une
 * carte de dieu, une vignette de parure et un bouton d'achat aient l'air
 * d'appartenir au même objet. Trois palettes, une échelle d'espacement, une
 * échelle de texte — et l'écran suivant s'écrit sans rien réinventer.
 *
 * ⚠️ Les couleurs des DIEUX ne sont pas ici : elles vivent dans le roster et
 * dans le catalogue des parures, parce que le jeu les affiche aussi en 3D.
 * Ce fichier ne décrit que le décor de l'interface.
 */

/** Le marbre veiné d'or : sombre, chaud, jamais gris neutre. */
export const COLORS = {
  /** Le fond de l'écran. Identique au fond du jeu, pour un passage sans à-coup. */
  ground: '#12141c',
  /** Une carte posée sur le fond. */
  panel: '#1b1f2b',
  /** Une carte mise en avant (sélectionnée, ou vedette du magasin). */
  panelRaised: '#252b3a',
  /** L'or : la monnaie, la sélection, l'action principale. */
  gold: '#d8b46a',
  /** Le texte posé SUR l'or. Sombre, sinon il ne se lit pas. */
  onGold: '#1a1508',
  /**
   * L'ambroisie : la monnaie rare, celle des dieux — plus précieuse que
   * l'or des mortels. Un violet-améthyste, pour qu'elle se distingue de la
   * chaleur du reste de la palette au premier coup d'œil, comme un joyau
   * posé sur du marbre.
   */
  ambrosia: '#c99bf0',
  /** Le texte posé SUR l'ambroisie. Même logique que `onGold`. */
  onAmbrosia: '#241236',
  ambrosiaBorder: 'rgba(201, 155, 240, 0.55)',
  /**
   * Les teintes « d'épaisseur » : posées en bordure basse d'un bouton, plus
   * sombres que sa face, elles font croire à un bouton **taillé**, avec un
   * chant — pas un simple rectangle plat. Une bordure basse, épaisse, dans
   * une nuance foncée de la même couleur, c'est ce qui donne aux boutons
   * d'un jeu mobile leur air de bonbon qu'on presse, plutôt que de lien web.
   */
  goldShadow: '#96742f',
  panelShadow: '#0d0f16',
  text: '#f3f0e8',
  /** Texte secondaire — 5,9:1 sur le fond, au-delà du minimum. */
  muted: '#a8adbd',
  /** Ce qui n'est pas encore acquis. */
  locked: '#767c8c',
  border: 'rgba(255, 255, 255, 0.10)',
  borderStrong: 'rgba(216, 180, 106, 0.55)',
  /** Le voile posé derrière une feuille de paramètres. */
  scrim: 'rgba(6, 7, 11, 0.72)',
} as const;

export const SPACE = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const RADIUS = { sm: 8, md: 14, lg: 20, pill: 999 } as const;

/**
 * ⚠️ 44 points : la plus petite cible confortable pour un pouce. Aucun bouton
 * de ce dossier ne descend en dessous — la même règle que le bouton de
 * relance du HUD.
 */
export const TOUCH_MIN = 44;

export const TYPE = {
  display: { fontSize: 32, fontWeight: '800', letterSpacing: 0.5 },
  title: { fontSize: 19, fontWeight: '700' },
  body: { fontSize: 14, fontWeight: '500' },
  /** Les intitulés de section : petits, espacés, en capitales. */
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  price: { fontSize: 15, fontWeight: '800' },
} as const;

/** `#rrggbb` à partir d'une couleur du jeu, qui les stocke en nombres. */
export function hex(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}
