/**
 * parts.tsx — les briques que les quatre onglets se partagent.
 *
 * Elles existent pour une raison précise : un bandeau gravé, un bouton d'or
 * et un casier de récompense apparaissent dans plusieurs onglets. Écrits
 * quatre fois, ils auraient divergé dès la première retouche.
 *
 * ⚠️ Tout ce dossier imite un objet MATÉRIEL : du parchemin encadré de bois
 * doré, posé sur du marbre. D'où, partout, le même trio — une face claire,
 * une bordure de bois, et un CHANT plus sombre en bas. C'est ce chant, et
 * lui seul, qui fait qu'un bouton a l'air taillé plutôt que dessiné ; il
 * disparaît quand on presse, et le bouton s'enfonce.
 */

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, RADIUS, SPACE, TOUCH_MIN, TYPE, hex } from './theme';

/* ------------------------------------------------------------------ cadres */

/**
 * Le bandeau gravé : le titre d'un écran ou d'une section, sur sa tablette
 * de marbre encadrée d'or. C'est le seul titre visible d'un onglet — il n'y
 * a pas de barre de navigation par-dessus.
 */
export function Plaque({ title, tone = 'marble' }: { title: string; tone?: 'marble' | 'gold' }) {
  const gold = tone === 'gold';
  return (
    <View style={[styles.plaque, gold ? styles.plaqueGold : styles.plaqueMarble]}>
      <Text style={[styles.plaqueText, gold && styles.plaqueTextGold]} numberOfLines={2}>
        {title.toUpperCase()}
      </Text>
    </View>
  );
}

/** Un intitulé de section : petites capitales espacées, sans tablette. */
export function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children.toUpperCase()}</Text>;
}

/**
 * La carte : le parchemin encadré, conteneur de toute chose achetable,
 * sélectionnable ou racontée.
 *
 * `selected` ne change pas la teinte du fond mais l'ÉPAISSEUR et la couleur
 * du cadre : sur du parchemin, une bordure d'or se voit de loin, là où un
 * fond légèrement différent passerait inaperçu en plein soleil.
 */
export function Card({
  children,
  selected = false,
  style,
}: {
  children: ReactNode;
  selected?: boolean;
  style?: ViewStyle;
}) {
  return <View style={[styles.card, selected && styles.cardSelected, style]}>{children}</View>;
}

/** La colonne cannelée qui borde le grand cadre d'un onglet. */
export function Column({ side }: { side: 'left' | 'right' }) {
  return (
    <LinearGradient
      pointerEvents="none"
      colors={['#fdf6e6', '#e4d2ae', '#fdf6e6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.column, side === 'left' ? styles.columnLeft : styles.columnRight]}
    />
  );
}

/* ----------------------------------------------------------------- boutons */

interface ButtonProps {
  label: string;
  onPress: () => void;
  /** `primary` : l'action de l'écran. `ghost` : tout le reste. */
  variant?: 'primary' | 'ghost';
  /** Une seconde ligne, sous l'intitulé — un prix, le plus souvent. */
  price?: ReactNode;
  disabled?: boolean;
  /** Lu par les lecteurs d'écran quand l'intitulé ne suffit pas. */
  hint?: string;
  testID?: string;
  style?: ViewStyle;
  /** `big` : le bouton d'appel de l'écran, pleine largeur. */
  size?: 'normal' | 'big';
}

export function Button({
  label,
  onPress,
  variant = 'ghost',
  price,
  disabled = false,
  hint,
  testID,
  style,
  size = 'normal',
}: ButtonProps) {
  const primary = variant === 'primary';
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={hint ?? label}
      accessibilityState={{ disabled }}
      // Le retour au toucher n'est pas cosmétique : sans lui, on ne sait pas
      // si l'appui a été pris en compte, et on appuie deux fois.
      android_ripple={{ color: 'rgba(255, 255, 255, 0.22)' }}
      style={({ pressed }) => [
        styles.button,
        primary ? styles.buttonPrimary : styles.buttonGhost,
        size === 'big' && styles.buttonBig,
        pressed && !disabled && styles.buttonPressed,
        disabled && styles.buttonDisabled,
        style,
      ]}
    >
      {/* Le dégradé fait le bombé : clair en haut, doré en bas. Une couleur
          plate donnerait un rectangle, pas un objet qu'on presse. */}
      <LinearGradient
        pointerEvents="none"
        colors={primary ? [COLORS.goldLight, COLORS.gold] : [COLORS.panelRaised, COLORS.panelSunken]}
        style={StyleSheet.absoluteFill}
      />
      <Text style={[styles.buttonLabel, size === 'big' && styles.buttonLabelBig]} numberOfLines={1}>
        {label.toUpperCase()}
      </Text>
      {price !== undefined && <View style={styles.buttonPrice}>{price}</View>}
    </Pressable>
  );
}

/* --------------------------------------------------------------- monnaies */

/**
 * La pièce d'or : un disque, avec le reflet qui le distingue d'un pion plat.
 * La même pièce partout — bourse, prix, récompense — pour qu'on reconnaisse
 * ce qu'on est en train de gagner sans lire un mot.
 */
export function Coin({ size = 18 }: { size?: number }) {
  return (
    <View style={[styles.coin, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.coinFace, { fontSize: size * 0.62 }]}>⚡</Text>
    </View>
  );
}

/**
 * La couronne de laurier : la monnaie rare, celle des dieux. Volontairement
 * d'une autre SILHOUETTE que le disque de la drachme, pour se reconnaître
 * d'un coup d'œil même daltonien.
 */
export function Laurel({ size = 18 }: { size?: number }) {
  return (
    <View style={[styles.laurel, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.laurelFace, { fontSize: size * 0.66 }]}>🌿</Text>
    </View>
  );
}

/**
 * La bourse d'une monnaie : la pastille de bois cerclée d'or du bandeau
 * supérieur, et son bouton « + » qui mène au rayon correspondant.
 */
export function CurrencyPill({
  testID,
  tone,
  value,
  hint,
  onAdd,
}: {
  testID: string;
  tone: 'gold' | 'laurel';
  value: number;
  hint: string;
  onAdd: () => void;
}) {
  const gold = tone === 'gold';
  return (
    <View style={[styles.pill, gold ? styles.pillGold : styles.pillLaurel]}>
      {gold ? <Coin /> : <Laurel />}
      <Text style={styles.pillValue} testID={testID} numberOfLines={1}>
        {value.toLocaleString('fr-FR')}
      </Text>
      <Pressable
        onPress={onAdd}
        accessibilityRole="button"
        accessibilityLabel={hint}
        hitSlop={8}
        style={({ pressed }) => [styles.add, pressed && styles.addPressed]}
      >
        <Text style={styles.addLabel}>+</Text>
      </Pressable>
    </View>
  );
}

/* ---------------------------------------------------------------- casiers */

/**
 * Un casier de récompense : l'icône de ce qu'on gagne, son nombre, et son
 * état. Trois états, et pas un de plus — c'est ce qui rend une piste de
 * passe lisible d'un seul regard :
 *
 *   `taken`   déjà pris     — coche verte
 *   `ready`   à portée      — cadre d'or, fond clair
 *   `locked`  hors d'atteinte — cadenas, tout est éteint
 */
export function Tile({
  icon,
  count,
  state,
  size = 52,
}: {
  icon: string;
  count?: number;
  state: 'taken' | 'ready' | 'locked';
  size?: number;
}) {
  return (
    <View style={styles.tileWrap}>
      <View
        style={[
          styles.tile,
          { width: size, height: size },
          state === 'ready' && styles.tileReady,
          state === 'locked' && styles.tileLocked,
        ]}
      >
        <Text style={{ fontSize: size * 0.5 }}>{icon}</Text>
        {state === 'locked' && <Text style={styles.tileLock}>🔒</Text>}
        {state === 'taken' && <Text style={styles.tileCheck}>✓</Text>}
      </View>
      {count !== undefined && <Text style={styles.tileCount}>{count}</Text>}
    </View>
  );
}

/**
 * La jauge : une gouttière de bois, une coulée d'or, et le compte écrit
 * PAR-DESSUS. Le chiffre au centre est ce que le joueur cherche vraiment ;
 * le remplissage ne fait que le rendre immédiat.
 */
export function Bar({
  value,
  max,
  label,
  tone = 'gold',
}: {
  value: number;
  max: number;
  label?: string;
  tone?: 'gold' | 'laurel';
}) {
  const ratio = max <= 0 ? 0 : Math.max(0, Math.min(1, value / max));
  return (
    <View style={styles.bar}>
      <LinearGradient
        colors={tone === 'gold' ? [COLORS.goldLight, COLORS.gold] : [COLORS.laurelLight, COLORS.laurel]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.barFill, { width: `${ratio * 100}%` }]}
      />
      <Text style={styles.barLabel} numberOfLines={1}>
        {label ?? `${value} / ${max}`}
      </Text>
    </View>
  );
}

/**
 * La pastille d'un dieu : ses deux couleurs, celles-là mêmes qu'il portera
 * en jeu. C'est tout l'aperçu dont dispose le joueur avant la M14 — et il est
 * exact, puisqu'il lit la parure équipée.
 */
export function GodBadge({
  color,
  accent,
  size = 52,
  dimmed = false,
}: {
  color: number;
  accent: number;
  size?: number;
  dimmed?: boolean;
}) {
  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: hex(color),
          borderColor: hex(accent),
          opacity: dimmed ? 0.4 : 1,
        },
      ]}
    >
      {/* Le halo intérieur montre la teinte d'accent, celle du cortège. */}
      <View
        style={{
          width: size * 0.34,
          height: size * 0.34,
          borderRadius: size,
          backgroundColor: hex(accent),
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  /* cadres */
  plaque: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.sm,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderBottomWidth: 4,
  },
  plaqueMarble: {
    backgroundColor: COLORS.panelRaised,
    borderColor: COLORS.frame,
    borderBottomColor: COLORS.frameDark,
  },
  plaqueGold: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.goldShadow,
    borderBottomColor: COLORS.frameDeep,
  },
  plaqueText: { ...TYPE.banner, color: COLORS.text, textAlign: 'center' },
  plaqueTextGold: { color: COLORS.onGold },

  sectionTitle: {
    ...TYPE.label,
    color: COLORS.frameDeep,
    textAlign: 'center',
    marginBottom: SPACE.sm,
    marginTop: SPACE.lg,
  },

  card: {
    backgroundColor: COLORS.panel,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: COLORS.frame,
    borderBottomColor: COLORS.frameDark,
    padding: SPACE.md,
  },
  cardSelected: { borderColor: COLORS.borderStrong, borderWidth: 3, backgroundColor: COLORS.panelRaised },

  column: { position: 'absolute', top: 0, bottom: 0, width: 12 },
  columnLeft: { left: -2 },
  columnRight: { right: -2 },

  /* boutons */
  button: {
    minHeight: TOUCH_MIN,
    paddingHorizontal: SPACE.lg,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: COLORS.goldShadow,
    borderBottomColor: COLORS.frameDeep,
    overflow: 'hidden',
  },
  buttonBig: { minHeight: 62 },
  buttonPrimary: {},
  buttonGhost: { borderColor: COLORS.frame, borderBottomColor: COLORS.frameDark },
  buttonPressed: { borderBottomWidth: 1, transform: [{ translateY: 3 }] },
  buttonDisabled: { opacity: 0.45 },
  buttonLabel: { ...TYPE.banner, fontSize: 14, color: COLORS.onGold, textAlign: 'center' },
  buttonLabelBig: { fontSize: 19 },
  buttonPrice: { flexDirection: 'row', alignItems: 'center', gap: SPACE.xs, marginTop: 2 },

  /* monnaies */
  coin: {
    backgroundColor: COLORS.gold,
    borderWidth: 1.5,
    borderColor: COLORS.goldShadow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinFace: { color: COLORS.onGold, lineHeight: undefined },
  laurel: {
    backgroundColor: COLORS.panelRaised,
    borderWidth: 1.5,
    borderColor: COLORS.laurel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  laurelFace: { color: COLORS.laurel },

  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    paddingLeft: SPACE.sm,
    paddingRight: SPACE.xs,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bar,
    borderWidth: 2,
  },
  pillGold: { borderColor: COLORS.gold },
  pillLaurel: { borderColor: COLORS.laurel },
  pillValue: { ...TYPE.price, color: COLORS.onDark, minWidth: 34, textAlign: 'right' },
  add: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.gold,
    borderWidth: 1.5,
    borderColor: COLORS.goldShadow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPressed: { opacity: 0.8, transform: [{ scale: 0.92 }] },
  addLabel: { fontFamily: FONTS.bodySemi, fontSize: 16, lineHeight: 19, color: COLORS.onGold },

  /* casiers */
  tileWrap: { alignItems: 'center' },
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.sm,
    borderWidth: 2,
    borderColor: COLORS.frame,
    backgroundColor: COLORS.panel,
  },
  tileReady: { borderColor: COLORS.borderStrong, backgroundColor: COLORS.panelRaised, borderWidth: 3 },
  tileLocked: { backgroundColor: COLORS.panelSunken, opacity: 0.75 },
  tileLock: { position: 'absolute', top: 1, left: 2, fontSize: 11 },
  tileCheck: {
    position: 'absolute',
    top: -8,
    right: -6,
    fontSize: 15,
    color: COLORS.done,
    fontFamily: FONTS.bodySemi,
  },
  tileCount: { ...TYPE.tiny, color: COLORS.text, marginTop: 2 },

  /* jauge */
  bar: {
    height: 22,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.panelSunken,
    borderWidth: 2,
    borderColor: COLORS.frameDark,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  barFill: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  barLabel: { ...TYPE.tiny, fontSize: 11, color: COLORS.text, textAlign: 'center' },

  badge: { alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
});
