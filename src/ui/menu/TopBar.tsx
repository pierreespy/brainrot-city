/**
 * TopBar.tsx — le bandeau qui ne quitte JAMAIS l'écran.
 *
 * Il porte quatre choses, et rien d'autre : qui l'on est (le portrait et le
 * niveau), ce que l'on possède (les deux monnaies), et l'accès aux réglages.
 *
 * ⚠️ Il est posé HORS du ruban d'onglets, au-dessus de lui. Le décor glisse
 * sous le doigt, les cartes changent, mais la bourse reste à la même place :
 * c'est ce qui permet d'appuyer sur « + » sans se demander sur quel onglet on
 * se trouve.
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { godById } from '../../entities/gods/roster';
import { appearanceOf, type Progression } from '../../meta/progression';
import { rankOf } from '../../meta/rank';
import { CurrencyPill, GodBadge } from './parts';
import { COLORS, RADIUS, SPACE, TEXT_SHADOW, TOUCH_MIN, TYPE } from './theme';

export function TopBar({
  state,
  onOpenSettings,
  onOpenShop,
}: {
  state: Progression;
  onOpenSettings: () => void;
  onOpenShop: () => void;
}) {
  const god = godById(state.selectedGod);
  const appearance = appearanceOf(state);
  const rank = rankOf(state.bestScore);

  return (
    <View style={styles.root}>
      {/* Le portrait, son cadre d'or et la plaque de niveau qui déborde en
          bas : la signature d'un profil de joueur dans ce genre de jeu. */}
      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <GodBadge color={appearance.color} accent={appearance.accent} size={40} />
        </View>
        <View style={styles.levelPlate}>
          <Text style={styles.levelText}>Niv {rank.level}</Text>
        </View>
      </View>

      <View style={styles.namePlate}>
        <Text style={styles.name} numberOfLines={1}>
          {god.label}
        </Text>
      </View>

      <View style={styles.purse}>
        <CurrencyPill
          testID="drachmas"
          tone="gold"
          value={state.drachmas}
          hint="Ouvrir la boutique, rayon drachmes"
          onAdd={onOpenShop}
        />
        <CurrencyPill
          testID="ambrosia"
          tone="laurel"
          value={state.ambrosia}
          hint="Ouvrir la boutique, rayon lauriers"
          onAdd={onOpenShop}
        />
      </View>

      <Pressable
        testID="settings"
        onPress={onOpenSettings}
        accessibilityRole="button"
        accessibilityLabel="Paramètres"
        hitSlop={6}
        style={({ pressed }) => [styles.burger, pressed && styles.burgerPressed]}
      >
        <Text style={styles.burgerLines}>≡</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    paddingHorizontal: SPACE.md,
    paddingBottom: SPACE.md,
  },

  avatarWrap: { alignItems: 'center' },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.panelRaised,
    borderWidth: 3,
    borderColor: COLORS.gold,
  },
  // La plaque de niveau chevauche le bas du portrait : elle appartient au
  // médaillon, elle ne se lit pas comme une deuxième information.
  levelPlate: {
    marginTop: -8,
    paddingHorizontal: SPACE.sm,
    paddingVertical: 1,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bar,
    borderWidth: 1.5,
    borderColor: COLORS.gold,
  },
  levelText: { ...TYPE.tiny, color: COLORS.onDark },

  namePlate: {
    flex: 1,
    minWidth: 0,
    paddingVertical: SPACE.xs,
    paddingHorizontal: SPACE.sm,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bar,
    borderWidth: 2,
    borderColor: COLORS.frame,
  },
  name: { ...TYPE.title, ...TEXT_SHADOW, fontSize: 15, color: COLORS.onDark },

  purse: { flexDirection: 'row', gap: SPACE.sm },

  burger: {
    width: TOUCH_MIN - 6,
    height: TOUCH_MIN - 6,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bar,
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  burgerPressed: { opacity: 0.8, transform: [{ scale: 0.94 }] },
  burgerLines: { ...TYPE.display, fontSize: 24, color: COLORS.onDark, lineHeight: 30 },
});
