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

import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { godById } from '../../entities/gods/roster';
import { flatColorOf, type Progression } from '../../meta/progression';
import { rankOf } from '../../meta/rank';
import { CurrencyPill, GodBadge } from './parts';
import { PORTRAITS } from './icons';
import { COLORS, RADIUS, SPACE, TOUCH_MIN, TYPE } from './theme';

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
  const appearance = flatColorOf(state);
  const rank = rankOf(state.bestScore);
  const portrait = PORTRAITS[state.selectedGod];

  return (
    <View style={styles.root}>
      {/* Le portrait, son cadre d'or et la plaque de niveau qui déborde en
          bas : la signature d'un profil de joueur dans ce genre de jeu. */}
      <View style={styles.avatarWrap}>
        {/* Le portrait porte SON PROPRE anneau d'or, dessiné dans l'image :
            posé dans le cadre du médaillon, il en ferait un second. D'où deux
            habillages, selon qu'un dieu a son visage ou seulement ses deux
            couleurs. */}
        {portrait === undefined ? (
          <View style={styles.avatar}>
            <GodBadge color={appearance.color} accent={appearance.accent} size={40} />
          </View>
        ) : (
          <Image
            source={portrait}
            resizeMode="contain"
            style={styles.portrait}
            accessible={false}
            importantForAccessibility="no"
          />
        )}
        <View style={styles.levelPlate}>
          <Text style={styles.levelText}>Niv {rank.level}</Text>
        </View>
        {/* Le nom appartient au portrait, et se lit SOUS lui. Posé dans le
            rang, il disputait sa largeur aux deux bourses, et se retrouvait
            coupé à la première lettre dès que les sommes s'allongeaient. */}
        <Text style={styles.name} numberOfLines={1}>
          {god.label}
        </Text>
      </View>

      <View style={styles.purse}>
        <CurrencyPill
          testID="gold"
          tone="gold"
          value={state.gold}
          hint="Ouvrir la boutique, rayon or"
          onAdd={onOpenShop}
        />
        <CurrencyPill
          testID="laurels"
          tone="laurel"
          value={state.laurels}
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

  avatarWrap: { alignItems: 'center', width: 88 },
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
  // Le portrait remplace le cadre, il ne s'y ajoute pas : même diamètre que
  // le médaillon de couleurs, pour que le bandeau garde sa hauteur quel que
  // soit le dieu choisi.
  portrait: { width: 54, height: 54 },

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

  name: { ...TYPE.title, fontSize: 13, color: COLORS.text, marginTop: 2 },

  purse: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: SPACE.sm },

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
