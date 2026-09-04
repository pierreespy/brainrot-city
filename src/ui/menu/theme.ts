/**
 * theme.ts — les quelques valeurs que TOUS les écrans de menu partagent.
 *
 * Un menu de jeu n'a pas besoin d'un système de design : il a besoin qu'une
 * carte de dieu, une vignette de parure et un bouton d'achat aient l'air
 * d'appartenir au même objet. Une palette, une échelle d'espacement, une
 * échelle de texte — et l'écran suivant s'écrit sans rien réinventer.
 *
 * ⚠️ Le menu est en PLEIN JOUR. Marbre, parchemin, or et bois : c'est un
 * temple sous le soleil, pas une interface sombre. Le JEU, lui, reste sur son
 * fond de nuit (`GROUND`) — le menu le recouvre entièrement, donc les deux
 * n'ont pas à s'accorder.
 *
 * ⚠️ Les couleurs des DIEUX ne sont pas ici : elles vivent dans le roster et
 * dans le catalogue des parures, parce que le jeu les affiche aussi en 3D.
 * Ce fichier ne décrit que le décor de l'interface.
 */

/** Le fond du JEU, derrière le menu. Le seul reste de l'ancienne nuit. */
export const GROUND = '#12141c';

/** Marbre, parchemin, or et bois. */
export const COLORS = {
  /** Le fond de l'écran, sous le décor : un ciel très pâle. */
  ground: '#e9dcc0',

  /**
   * Le parchemin : la matière de toutes les cartes. Deux tons, parce qu'une
   * carte posée sur une autre doit se détacher sans changer de nature.
   */
  panel: '#f6e7c8',
  panelRaised: '#fdf4e0',
  /** Le creux : un casier vide, une piste non gagnée, un fond de rangée. */
  panelSunken: '#e2cda4',

  /** Le bois du cadre, et son ombre. Tout encadrement en descend. */
  frame: '#c08b4b',
  frameDark: '#8a5a2b',
  frameDeep: '#5f3b18',

  /** L'or : la monnaie, la sélection, l'action principale. */
  gold: '#eec24a',
  goldLight: '#f8e08a',
  goldShadow: '#a9741f',
  /** Le texte posé SUR l'or. Sombre, sinon il ne se lit pas. */
  onGold: '#4a2f10',

  /**
   * Le laurier : la monnaie rare, celle des dieux. Un vert-olive antique,
   * pour qu'elle se distingue de l'or au premier coup d'œil.
   */
  laurel: '#5f8d4e',
  laurelLight: '#a7c98b',
  onLaurel: '#17280f',
  laurelBorder: 'rgba(95, 141, 78, 0.65)',

  /**
   * L'encre. Elle est SOMBRE : tout le texte du menu se lit sur du
   * parchemin, jamais sur du sombre. La hiérarchie se fait par la densité,
   * pas par la luminosité.
   */
  text: '#4a2f16',
  muted: '#8a6b47',
  /** Ce qui n'est pas encore acquis. */
  locked: '#a08a6c',
  /** Le texte posé sur une barre de bois foncé (bandeau du haut). */
  onDark: '#f7e9cd',

  border: 'rgba(95, 59, 24, 0.28)',
  borderStrong: '#c9a227',

  /** Le bois du bandeau supérieur et de la barre d'onglets. */
  bar: '#5b3f22',
  /** Le voile posé derrière une feuille de paramètres. */
  scrim: 'rgba(38, 24, 10, 0.62)',
  /**
   * Le voile posé sur le décor, derrière les cartes. Un brouillard CLAIR :
   * la photo du temple est trop contrastée pour porter du parchemin, et
   * l'éclaircir la fait passer au second plan sans la faire disparaître.
   */
  veil: 'rgba(248, 238, 214, 0.55)',
  /**
   * Le voile posé DANS le cadre du temple, entre ses colonnes. Plus opaque
   * que le précédent : le décor y est peint jusque dans le cadre — nuages,
   * colonnes, parvis — et un brouillard léger laissait les cartes se perdre
   * dedans.
   */
  veilFramed: 'rgba(248, 238, 214, 0.75)',

  /** Un acquis, une étape franchie. */
  done: '#4c8b3f',
  /** Une alerte, une pastille à lire. */
  alert: '#c0392b',
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
 * L'ombre portée des textes posés SUR le bois foncé du bandeau.
 *
 * ⚠️ Elle ne sert QUE là. Sur du parchemin, une ombre salit l'empattement du
 * Cinzel sans rien gagner : le contraste y est déjà maximal.
 */
export const TEXT_SHADOW = {
  textShadowColor: 'rgba(30, 17, 5, 0.55)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 3,
} as const;

/**
 * Les deux polices du menu, et rien d'autre.
 *
 * Le **Cinzel** est dessiné d'après les capitales gravées dans la pierre
 * antique : c'est la lettre du fronton du temple, celle qui donne son nom au
 * jeu, aux dieux, aux prix. Il ne sait pas faire un paragraphe — ses
 * capitales larges fatiguent dès la deuxième ligne — d'où le **Spectral**
 * pour tout ce qui se lit vraiment.
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
  display: { fontFamily: FONTS.titleBold, fontSize: 26, letterSpacing: 1 },
  /** Le titre d'un bandeau gravé, en capitales. */
  banner: { fontFamily: FONTS.titleBold, fontSize: 17, letterSpacing: 1 },
  title: { fontFamily: FONTS.titleSemi, fontSize: 17, letterSpacing: 0.3 },
  body: { fontFamily: FONTS.body, fontSize: 14 },
  /** Le corps de texte qui doit peser : intitulé, titre de réglage. */
  strong: { fontFamily: FONTS.bodySemi, fontSize: 14 },
  /** Les intitulés de section : petits, espacés, en capitales gravées. */
  label: { fontFamily: FONTS.titleBold, fontSize: 11, letterSpacing: 1.4 },
  price: { fontFamily: FONTS.titleBold, fontSize: 15 },
  /** Le nom d'un onglet, sous son icône. */
  tab: { fontFamily: FONTS.titleSemi, fontSize: 12, letterSpacing: 0.4 },
  /** Un chiffre minuscule : compteur de casier, niveau de piste. */
  tiny: { fontFamily: FONTS.titleBold, fontSize: 10, letterSpacing: 0.5 },
} as const;

/** `#rrggbb` à partir d'une couleur du jeu, qui les stocke en nombres. */
export function hex(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}
