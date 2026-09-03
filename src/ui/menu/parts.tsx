/**
 * parts.tsx — les quelques briques que les trois onglets se partagent.
 *
 * Elles existent pour une raison précise : un bouton d'achat, une pastille de
 * dieu et un intitulé de section apparaissent dans les trois onglets. Écrits
 * trois fois, ils auraient divergé dès la première retouche.
 */

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { COLORS, FONTS, RADIUS, SPACE, TEXT_SHADOW, TOUCH_MIN, TYPE, hex } from './theme';

/** Un intitulé de section : petites capitales espacées. */
export function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children.toUpperCase()}</Text>;
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

/**
 * Les deux bourses, affichées en permanence en haut de l'écran : les
 * drachmes puis l'ambroisie, dans l'ordre où on les gagne — la monnaie
 * commune d'abord, la monnaie rare ensuite.
 *
 * Chacune est une pastille surmontée d'un bouton rond « + », posé à cheval
 * sur son bord — la façon dont un jeu mobile affiche une monnaie qu'on peut
 * recharger sans quitter l'écran où l'on est. Toucher le « + » ouvre le
 * magasin, au rayon qui correspond.
 */
export function CurrencyBar({
  drachmas,
  ambrosia,
  onOpenShop,
}: {
  drachmas: number;
  ambrosia: number;
  onOpenShop: () => void;
}) {
  return (
    <View style={styles.currencyBar}>
      <CurrencyPill
        testID="drachmas"
        tone="gold"
        value={drachmas}
        icon={<Coin />}
        hint="Ouvrir le magasin pour acheter des drachmes"
        onAdd={onOpenShop}
      />
      <CurrencyPill
        testID="ambrosia"
        tone="ambrosia"
        value={ambrosia}
        icon={<Gem />}
        hint="Ouvrir le magasin pour acheter de l'ambroisie"
        onAdd={onOpenShop}
      />
    </View>
  );
}

function CurrencyPill({
  testID,
  tone,
  value,
  icon,
  hint,
  onAdd,
}: {
  testID: string;
  tone: 'gold' | 'ambrosia';
  value: number;
  icon: ReactNode;
  hint: string;
  onAdd: () => void;
}) {
  const gold = tone === 'gold';
  return (
    <View style={styles.pillWrap}>
      <View style={[styles.pill, gold ? styles.pillGold : styles.pillAmbrosia]}>
        {icon}
        <Text style={styles.pillValue} testID={testID}>
          {value.toLocaleString('fr-FR')}
        </Text>
      </View>
      {/* Le bouton déborde exprès du bord de la pastille : c'est ce qui le
          distingue d'un simple chiffre, et qui dit « on peut en ajouter »
          sans un mot de texte. */}
      <Pressable
        onPress={onAdd}
        accessibilityRole="button"
        accessibilityLabel={hint}
        hitSlop={8}
        style={({ pressed }) => [
          styles.addButton,
          gold ? styles.addButtonGold : styles.addButtonAmbrosia,
          pressed && styles.addButtonPressed,
        ]}
      >
        <Text style={[styles.addButtonLabel, gold ? styles.addButtonLabelGold : styles.addButtonLabelAmbrosia]}>
          +
        </Text>
      </Pressable>
    </View>
  );
}

/**
 * La pièce d'or : un disque, avec le reflet qui le distingue d'un pion plat.
 * Exportée : le rayon « Drachmes » du magasin en affiche une, plus grande,
 * sur chaque paquet — la même pièce que dans la bourse, pour qu'on
 * reconnaisse ce qu'on est en train d'acheter.
 */
export function Coin({ size = 16 }: { size?: number }) {
  return (
    <View style={[styles.coin, { width: size, height: size, borderRadius: size / 2 }]}>
      <View style={[styles.coinShine, { width: size * 0.38, height: size * 0.38, borderRadius: size }]} />
    </View>
  );
}

/**
 * La goutte d'ambroisie : un losange, la silhouette universelle du joyau —
 * volontairement différente du disque de la drachme, pour se reconnaître
 * d'un coup d'œil même daltonien. Exportée pour la même raison que `Coin`.
 */
export function Gem({ size = 13 }: { size?: number }) {
  return <View style={[styles.gem, { width: size, height: size }]} />;
}

interface ButtonProps {
  label: string;
  onPress: () => void;
  /** `primary` : l'action de l'écran. `ghost` : tout le reste. */
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
  /** Lu par les lecteurs d'écran quand l'intitulé ne suffit pas. */
  hint?: string;
  testID?: string;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = 'ghost',
  disabled = false,
  hint,
  testID,
  style,
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
      android_ripple={{ color: 'rgba(255, 255, 255, 0.16)' }}
      style={({ pressed }) => [
        styles.button,
        primary ? styles.buttonPrimary : styles.buttonGhost,
        pressed && !disabled && styles.buttonPressed,
        disabled && styles.buttonDisabled,
        style,
      ]}
    >
      <Text style={[styles.buttonLabel, primary && styles.buttonLabelPrimary]}>{label}</Text>
    </Pressable>
  );
}

/** Une carte : le conteneur de toute chose achetable ou sélectionnable. */
export function Card({
  children,
  selected = false,
  style,
}: {
  children: ReactNode;
  selected?: boolean;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.card, selected && styles.cardSelected, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  // Un intitulé de section est posé À MÊME le décor, entre deux cartes :
  // c'est le texte le plus exposé du menu, d'où l'ombre.
  sectionTitle: {
    ...TYPE.label,
    ...TEXT_SHADOW,
    color: COLORS.text,
    marginBottom: SPACE.md,
    marginTop: SPACE.xl,
  },

  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },

  currencyBar: { flexDirection: 'row', gap: SPACE.lg },

  // Le `marginRight`/`marginTop` fait de la place au bouton « + » qui
  // déborde du coin de la pastille sans être rogné par ses voisins.
  pillWrap: { marginRight: SPACE.xs, marginTop: SPACE.xs },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.md,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
  },
  pillGold: { borderColor: COLORS.borderStrong },
  pillAmbrosia: { borderColor: COLORS.ambrosiaBorder },
  pillValue: { ...TYPE.price, color: COLORS.text },

  coin: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.gold,
    borderWidth: 1,
    borderColor: COLORS.goldShadow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinShine: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  gem: {
    width: 13,
    height: 13,
    backgroundColor: COLORS.ambrosia,
    borderWidth: 1,
    borderColor: '#7c4bab',
    transform: [{ rotate: '45deg' }],
  },

  // Le bouton « + » : rond, à cheval sur le coin bas-droit de la pastille —
  // c'est lui, pas la pastille, que le doigt vient chercher pour recharger.
  addButton: {
    position: 'absolute',
    right: -SPACE.xs,
    bottom: -SPACE.xs,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.ground,
  },
  addButtonGold: { backgroundColor: COLORS.gold },
  addButtonAmbrosia: { backgroundColor: COLORS.ambrosia },
  addButtonPressed: { opacity: 0.8, transform: [{ scale: 0.9 }] },
  addButtonLabel: { fontFamily: FONTS.bodySemi, fontSize: 15, lineHeight: 17 },
  addButtonLabelGold: { color: COLORS.onGold },
  addButtonLabelAmbrosia: { color: COLORS.onAmbrosia },

  /**
   * Le bouton, dans son ensemble : une face, et un CHANT en dessous, plus
   * sombre — la bordure basse épaisse simule l'épaisseur d'un bonbon qu'on
   * presse. `buttonPressed` réduit cette épaisseur en même temps qu'il tasse
   * le bouton : c'est ce qui vend l'illusion qu'on vient de l'enfoncer.
   */
  button: {
    minHeight: TOUCH_MIN,
    paddingHorizontal: SPACE.lg,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderBottomWidth: 4,
  },
  buttonPrimary: { backgroundColor: COLORS.gold, borderColor: COLORS.gold, borderBottomColor: COLORS.goldShadow },
  buttonGhost: {
    backgroundColor: COLORS.panelRaised,
    borderColor: COLORS.border,
    borderBottomColor: COLORS.panelShadow,
  },
  buttonPressed: { opacity: 0.92, borderBottomWidth: 1, transform: [{ translateY: 3 }] },
  buttonDisabled: { opacity: 0.4 },
  buttonLabel: { ...TYPE.strong, color: COLORS.text },
  // Pas d'ombre ici : le texte est SOMBRE sur de l'or, un halo noir l'empâte.
  buttonLabelPrimary: { color: COLORS.onGold },

  card: {
    backgroundColor: COLORS.panel,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACE.lg,
  },
  // Le cadre s'épaissit plutôt que de changer de couleur seul : une carte
  // choisie a l'air d'un objet qu'on a sorti du lot, pas d'un survol.
  cardSelected: {
    backgroundColor: COLORS.panelRaised,
    borderColor: COLORS.borderStrong,
    borderWidth: 2,
  },
});
