/**
 * parts.tsx — les quelques briques que les trois onglets se partagent.
 *
 * Elles existent pour une raison précise : un bouton d'achat, une pastille de
 * dieu et un intitulé de section apparaissent dans les trois onglets. Écrits
 * trois fois, ils auraient divergé dès la première retouche.
 */

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { COLORS, RADIUS, SPACE, TOUCH_MIN, TYPE, hex } from './theme';

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

/** Le solde de drachmes, affiché en permanence en haut de l'écran. */
export function Purse({ drachmas }: { drachmas: number }) {
  return (
    <View style={styles.purse}>
      <View style={styles.coin} />
      <Text style={styles.purseValue} testID="drachmas">
        {drachmas.toLocaleString('fr-FR')}
      </Text>
      <Text style={styles.purseLabel}>drachmes</Text>
    </View>
  );
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
  sectionTitle: {
    ...TYPE.label,
    color: COLORS.muted,
    marginBottom: SPACE.md,
    marginTop: SPACE.xl,
  },

  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },

  purse: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.md,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  coin: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.gold,
  },
  purseValue: { ...TYPE.price, color: COLORS.text },
  purseLabel: { ...TYPE.body, color: COLORS.muted, fontSize: 12 },

  button: {
    minHeight: TOUCH_MIN,
    paddingHorizontal: SPACE.lg,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  buttonPrimary: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  buttonGhost: { backgroundColor: COLORS.panelRaised, borderColor: COLORS.border },
  buttonPressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  buttonDisabled: { opacity: 0.4 },
  buttonLabel: { ...TYPE.body, fontWeight: '700', color: COLORS.text },
  buttonLabelPrimary: { color: COLORS.onGold, fontWeight: '800' },

  card: {
    backgroundColor: COLORS.panel,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACE.lg,
  },
  cardSelected: {
    backgroundColor: COLORS.panelRaised,
    borderColor: COLORS.borderStrong,
  },
});
