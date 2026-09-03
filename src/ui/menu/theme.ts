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
  gold: '#e8c47a',
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
  /**
   * Le texte courant. Un blanc chaud, pas un blanc pur : il descend du
   * marbre, comme l'or.
   *
   * ⚠️ Les trois teintes de texte sont posées sur DEUX fonds très
   * différents — une carte sombre, et la photo du temple, qui monte jusqu'au
   * ciel clair. C'est le second qui commande : un gris de texte secondaire
   * calibré pour du #1b1f2b disparaît sur un nuage. D'où des nuances plus
   * claires qu'on ne l'attendrait, et l'ombre portée ci-dessous pour tout ce
   * qui touche l'image.
   */
  text: '#fdf7ea',
  /** Texte secondaire : un ivoire tiède, et non plus un gris bleuté. */
  muted: '#e0d5bf',
  /** Ce qui n'est pas encore acquis. */
  locked: '#b0a794',
  border: 'rgba(255, 255, 255, 0.10)',
  borderStrong: 'rgba(216, 180, 106, 0.55)',
  /** Le voile posé derrière une feuille de paramètres. */
  scrim: 'rgba(6, 7, 11, 0.72)',
  /**
   * Le voile posé sur le MILIEU du décor. Le dégradé du menu rejoignait
   * `ground` en haut et en bas et laissait le centre nu — or c'est
   * exactement là que se lisent le titre et l'accroche, par-dessus un ciel
   * clair. Assez dense pour asseoir le texte, assez transparent pour qu'on
   * voie encore la ville.
   */
  veil: 'rgba(11, 13, 19, 0.42)',
} as const;

/**
 * L'ombre portée des textes posés SUR le décor.
 *
 * ⚠️ Elle ne remplace pas le choix des couleurs, elle le sauve dans le cas
 * limite : une lettre claire qui tombe pile sur un nuage blanc. L'ombre est
 * large et peu marquée — un halo sombre, pas un relief — pour ne pas salir
 * les empattements du Cinzel.
 *
 * ⚠️ À ne PAS poser sur du texte sombre sur fond d'or (`onGold`) : là, une
 * ombre foncée empâte le tracé au lieu de le détacher.
 */
export const TEXT_SHADOW = {
  textShadowColor: 'rgba(6, 7, 11, 0.9)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 7,
} as const;

export const SPACE = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const RADIUS = { sm: 8, md: 14, lg: 20, pill: 999 } as const;

/**
 * ⚠️ 44 points : la plus petite cible confortable pour un pouce. Aucun bouton
 * de ce dossier ne descend en dessous — la même règle que le bouton de
 * relance du HUD.
 */
export const TOUCH_MIN = 44;

/**
 * Les deux polices du menu, et rien d'autre.
 *
 * Le **Cinzel** est dessiné d'après les capitales gravées dans la pierre
 * antique : c'est la lettre du fronton du temple, celle qui donne son nom au
 * jeu, aux dieux, aux prix. Il ne sait pas faire un paragraphe — ses
 * capitales larges fatiguent dès la deuxième ligne — d'où le **Spectral**
 * pour tout ce qui se lit vraiment : accroches, descriptions, réglages.
 *
 * ⚠️ Chaque graisse est une police SÉPARÉE, avec son propre nom. C'est ainsi
 * que fonctionnent les polices chargées à la main : `fontWeight` n'a plus
 * aucun effet une fois `fontFamily` posé, et le préciser quand même fait
 * retomber Android sur la police système. Les styles de ce dossier ne
 * doivent donc JAMAIS porter de `fontWeight` — on change de famille.
 *
 * ⚠️ Elles sont chargées au démarrage par App.tsx. Ajouter une graisse ici
 * sans l'y déclarer donne un texte invisible sur iOS.
 */
export const FONTS = {
  /** La pierre gravée : titres, intitulés, prix. */
  titleBold: 'Cinzel_700Bold',
  titleSemi: 'Cinzel_600SemiBold',
  /** L'encre : tout ce qui se lit en lignes. */
  body: 'Spectral_400Regular',
  bodyMedium: 'Spectral_500Medium',
  bodySemi: 'Spectral_600SemiBold',
} as const;

export const TYPE = {
  display: { fontFamily: FONTS.titleBold, fontSize: 30, letterSpacing: 1.2 },
  title: { fontFamily: FONTS.titleSemi, fontSize: 19, letterSpacing: 0.4 },
  /** Le corps de texte : un peu plus grand que le sans-serif qu'il remplace,
      parce qu'un empattement demande de la place pour rester net. */
  body: { fontFamily: FONTS.body, fontSize: 15 },
  /** Le corps de texte qui doit peser : intitulé de bouton, titre de réglage. */
  strong: { fontFamily: FONTS.bodySemi, fontSize: 15 },
  /** Les intitulés de section : petits, espacés, en capitales gravées. */
  label: { fontFamily: FONTS.titleBold, fontSize: 11, letterSpacing: 1.6 },
  price: { fontFamily: FONTS.titleBold, fontSize: 15 },
  /** Le nom d'un onglet, dans la barre du bas. */
  tab: { fontFamily: FONTS.titleSemi, fontSize: 15, letterSpacing: 0.6 },
} as const;

/** `#rrggbb` à partir d'une couleur du jeu, qui les stocke en nombres. */
export function hex(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}
