/**
 * GodsTab.tsx — l'onglet « Dieux » : le panthéon du joueur.
 *
 * Il répond à deux questions, et à deux seulement : **qui ai-je ?** et **de
 * quoi ont-ils l'air ?** Choisir un dieu se fait ici, se le procurer se fait
 * au magasin. Un écran qui ferait les deux mélangerait ce que l'on possède et
 * ce que l'on convoite, et on ne saurait plus.
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GOD_ORDER, godById, type GodId } from '../../entities/gods/roster';
import { ownsSkin, type Progression } from '../../meta/progression';
import { skinsOf } from '../../meta/store';
import { Card, GodBadge, SectionTitle } from './parts';
import { COLORS, RADIUS, SPACE, TOUCH_MIN, TYPE, hex } from './theme';

interface Props {
  state: Progression;
  onSelectGod: (godId: GodId) => void;
  onEquipSkin: (skinId: string) => void;
  /** Le magasin, pour les divinités qui manquent. */
  onOpenShop: () => void;
}

export function GodsTab({ state, onSelectGod, onEquipSkin, onOpenShop }: Props) {
  const owned = GOD_ORDER.filter((id) => state.ownedGods.includes(id));
  const missing = GOD_ORDER.length - owned.length;

  return (
    <View style={styles.root}>
      <SectionTitle>Ton panthéon</SectionTitle>
      <Text style={styles.count}>
        {owned.length} divinité{owned.length > 1 ? 's' : ''} sur {GOD_ORDER.length}
      </Text>

      {owned.map((id) => {
        const god = godById(id);
        const selected = state.selectedGod === id;
        const equipped = state.equippedSkins[id];
        const skins = skinsOf(id);
        const worn = skins.find((skin) => skin.id === equipped) ?? skins[0];

        return (
          <Pressable
            key={id}
            testID={`god-${id}`}
            onPress={() => onSelectGod(id)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`${god.label}, ${god.domain}${selected ? ', divinité choisie' : ''}`}
            android_ripple={{ color: 'rgba(255, 255, 255, 0.12)' }}
            style={({ pressed }) => [styles.godPress, pressed && styles.pressed]}
          >
            <Card selected={selected} style={styles.godCard}>
              <View style={styles.godHead}>
                <GodBadge color={worn.color} accent={worn.accent} size={54} />
                <View style={styles.godText}>
                  <Text style={styles.godName}>{god.label}</Text>
                  <Text style={styles.godDomain}>{god.domain}</Text>
                </View>
                {selected && <Text style={styles.selectedTag}>CHOISI</Text>}
              </View>

              {/*
                Les parures du dieu, en ligne. Celles qu'il ne possède pas
                apparaissent éteintes : ici, contrairement au magasin, montrer
                ce qui manque a un sens — c'est sa collection.
              */}
              <View style={styles.skins}>
                {skins.map((skin) => {
                  const has = ownsSkin(state, skin.id);
                  const wearing = worn.id === skin.id;
                  return (
                    <Pressable
                      key={skin.id}
                      testID={`skin-${skin.id}`}
                      disabled={!has}
                      onPress={() => onEquipSkin(skin.id)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: wearing, disabled: !has }}
                      accessibilityLabel={
                        has
                          ? `Porter la parure ${skin.label}`
                          : `Parure ${skin.label}, à acquérir au magasin`
                      }
                      hitSlop={6}
                      style={({ pressed }) => [
                        styles.skin,
                        wearing && styles.skinWorn,
                        pressed && has && styles.pressed,
                      ]}
                    >
                      <View
                        style={[
                          styles.swatch,
                          { backgroundColor: hex(skin.color), borderColor: hex(skin.accent) },
                          !has && styles.swatchLocked,
                        ]}
                      />
                      <Text style={[styles.skinLabel, !has && styles.skinLabelLocked]}>
                        {skin.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Card>
          </Pressable>
        );
      })}

      {missing > 0 && (
        <Pressable
          testID="go-shop"
          onPress={onOpenShop}
          accessibilityRole="button"
          accessibilityLabel={`Voir au magasin les ${missing} divinités qui te manquent`}
          style={({ pressed }) => [styles.missing, pressed && styles.pressed]}
        >
          <Text style={styles.missingTitle}>
            {missing} divinité{missing > 1 ? 's' : ''} à découvrir
          </Text>
          <Text style={styles.missingText}>Elles t'attendent au magasin.</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingBottom: SPACE.xl },
  count: { ...TYPE.body, color: COLORS.muted, marginTop: -SPACE.sm, marginBottom: SPACE.md },

  godPress: { marginBottom: SPACE.md },
  pressed: { opacity: 0.85 },
  godCard: { gap: SPACE.lg },
  godHead: { flexDirection: 'row', alignItems: 'center', gap: SPACE.lg },
  godText: { flex: 1 },
  godName: { ...TYPE.title, color: COLORS.text },
  godDomain: { ...TYPE.body, fontSize: 12, color: COLORS.muted, marginTop: 2 },
  selectedTag: { ...TYPE.label, fontSize: 10, color: COLORS.gold },

  skins: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.sm },
  skin: {
    minHeight: TOUCH_MIN,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.md,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  skinWorn: { borderColor: COLORS.borderStrong, backgroundColor: 'rgba(216, 180, 106, 0.12)' },
  swatch: { width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
  swatchLocked: { opacity: 0.35 },
  skinLabel: { ...TYPE.body, fontSize: 13, color: COLORS.text },
  skinLabelLocked: { color: COLORS.locked },

  missing: {
    marginTop: SPACE.md,
    padding: SPACE.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
  },
  missingTitle: { ...TYPE.title, fontSize: 16, color: COLORS.gold },
  missingText: { ...TYPE.body, color: COLORS.muted, marginTop: SPACE.xs },
});
