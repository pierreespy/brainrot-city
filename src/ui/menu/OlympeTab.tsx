/**
 * OlympeTab.tsx — le panthéon : qui l'on peut incarner, et ce qu'il vaut.
 *
 * L'écran tient en deux moitiés qui ne bougent pas l'une par rapport à
 * l'autre : la GRILLE des divinités en haut, la FICHE de celle qu'on regarde
 * en bas. Toucher une vignette change la fiche, jamais l'écran — c'est ce qui
 * permet de comparer trois dieux sans jamais perdre le fil.
 *
 * ⚠️ Un dieu verrouillé reste À SA PLACE dans la grille, en silhouette. Le
 * masquer donnerait un panthéon qui grandit tout seul, et le joueur ne saurait
 * jamais ce qu'il lui manque.
 */

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GOD_ORDER, GODS, godById, type GodId } from '../../entities/gods/roster';
import { godPrice, ownsGod, ownsSkin, type Progression } from '../../meta/progression';
import { skinsOf } from '../../meta/store';
import { Button, Card, Coin, GodBadge, Plaque } from './parts';
import { COLORS, RADIUS, SPACE, TYPE, hex } from './theme';

interface Props {
  state: Progression;
  onSelectGod: (godId: GodId) => void;
  onBuyGod: (godId: GodId) => void;
  onBuySkin: (skinId: string) => void;
  onEquipSkin: (skinId: string) => void;
}

export function OlympeTab({ state, onSelectGod, onBuyGod, onBuySkin, onEquipSkin }: Props) {
  // La vignette REGARDÉE, qui n'est pas la divinité CHOISIE : on consulte la
  // fiche d'Arès sans pour autant partir jouer avec lui.
  const [looking, setLooking] = useState<GodId>(state.selectedGod);
  const god = godById(looking);
  const owned = ownsGod(state, looking);
  const price = godPrice(looking);
  const skins = skinsOf(looking);
  const equipped = state.equippedSkins[looking];

  return (
    <View style={styles.root}>
      <Plaque title="Olympe" />

      <ScrollView style={styles.grid} contentContainerStyle={styles.gridContent} nestedScrollEnabled>
        <View style={styles.row}>
          {GOD_ORDER.map((id) => (
            <GodCell
              key={id}
              id={id}
              state={state}
              looking={looking === id}
              onPress={() => setLooking(id)}
            />
          ))}
        </View>
      </ScrollView>

      {/* La fiche. Elle est TOUJOURS là, même pour un dieu verrouillé : c'est
          en la lisant qu'on décide de payer. */}
      <Card style={styles.sheet} selected>
        <Plaque title={`${god.label}, ${god.domain}`} tone="gold" />

        <View style={styles.sheetBody}>
          <View style={styles.portrait}>
            <GodBadge
              color={god.appearance.color}
              accent={god.appearance.accent}
              size={72}
              dimmed={!owned}
            />
            <Text style={styles.portraitName} numberOfLines={2}>
              {god.label.toUpperCase()}
            </Text>
          </View>

          <View style={styles.stats}>
            <Stat label="Effet" value={god.ability.duration === 0 ? 'Instantané' : `${god.ability.duration} s`} />
            <Stat label="Recharge" value={`${god.ability.cooldown} s`} />

            <View style={styles.ability}>
              <Text style={styles.abilityIcon}>⚡</Text>
              <View style={styles.abilityText}>
                <Text style={styles.abilityName} numberOfLines={1}>
                  {god.ability.label.toUpperCase()}
                </Text>
                <Text style={styles.abilityKind}>(Compétence active)</Text>
              </View>
            </View>
            {/*
              La capacité est annoncée alors qu'aucune ligne ne l'exécute
              encore (M19 à M27). Ce n'est pas un mensonge : c'est ce qui
              distingue les dieux, et le joueur choisit déjà en fonction.
            */}
            <Text style={styles.abilityDesc}>{god.ability.description}</Text>
          </View>
        </View>

        {/* Les parures du dieu regardé : la seule chose qu'on puisse encore
            lui acheter une fois qu'il est acquis. */}
        {owned && (
          <View style={styles.skins}>
            {skins.map((skin) => {
              const has = ownsSkin(state, skin.id);
              return (
                <Pressable
                  key={skin.id}
                  onPress={() => (has ? onEquipSkin(skin.id) : onBuySkin(skin.id))}
                  accessibilityRole="button"
                  accessibilityLabel={has ? `Porter ${skin.label}` : `Acheter ${skin.label}`}
                  style={({ pressed }) => [
                    styles.skin,
                    equipped === skin.id && styles.skinOn,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={[styles.skinDot, { backgroundColor: hex(skin.color), borderColor: hex(skin.accent) }]} />
                  <Text style={styles.skinLabel} numberOfLines={1}>
                    {skin.label}
                  </Text>
                  {!has && (
                    <View style={styles.skinPrice}>
                      <Coin size={12} />
                      <Text style={styles.skinPriceText}>{skin.price}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={styles.actions}>
          {owned ? (
            <Button
              testID="select-god"
              label={state.selectedGod === looking ? 'Divinité choisie' : 'Incarner'}
              variant="primary"
              disabled={state.selectedGod === looking}
              onPress={() => onSelectGod(looking)}
              hint={`Partir jouer avec ${god.label}`}
              style={styles.action}
            />
          ) : (
            <Button
              testID="buy-god"
              label="Débloquer"
              variant="primary"
              disabled={state.drachmas < price}
              price={
                <>
                  <Coin size={14} />
                  <Text style={styles.buyPrice}>{price.toLocaleString('fr-FR')}</Text>
                </>
              }
              onPress={() => onBuyGod(looking)}
              hint={`Débloquer ${god.label} pour ${price} drachmes`}
              style={styles.action}
            />
          )}
        </View>
      </Card>
    </View>
  );
}

/** Une vignette de la grille : le dieu, ou sa silhouette s'il est verrouillé. */
function GodCell({
  id,
  state,
  looking,
  onPress,
}: {
  id: GodId;
  state: Progression;
  looking: boolean;
  onPress: () => void;
}) {
  const god = GODS[id];
  const owned = ownsGod(state, id);
  const chosen = state.selectedGod === id;

  return (
    <Pressable
      testID={`god-${id}`}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: looking }}
      accessibilityLabel={owned ? god.label : `${god.label}, verrouillé`}
      style={({ pressed }) => [
        styles.cell,
        looking && styles.cellLooking,
        !owned && styles.cellLocked,
        pressed && styles.pressed,
      ]}
    >
      {/* L'étoile marque la divinité avec laquelle on partira jouer — une
          information différente de « celle que je regarde ». */}
      {chosen && <Text style={styles.star}>★</Text>}
      <GodBadge color={god.appearance.color} accent={god.appearance.accent} size={40} dimmed={!owned} />
      <Text style={[styles.cellName, !owned && styles.cellNameLocked]} numberOfLines={1}>
        {owned ? god.label : '🔒'}
      </Text>
      {!owned && <Text style={styles.cellLockedText}>VERROUILLÉ</Text>}
    </Pressable>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label.toUpperCase()}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: SPACE.sm, gap: SPACE.md },

  grid: { flex: 1 },
  gridContent: { paddingVertical: SPACE.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.sm, justifyContent: 'center' },

  cell: {
    width: '22%',
    minWidth: 74,
    alignItems: 'center',
    paddingVertical: SPACE.sm,
    gap: 4,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: COLORS.frame,
    borderBottomColor: COLORS.frameDark,
    backgroundColor: COLORS.panel,
  },
  cellLooking: { borderColor: COLORS.borderStrong, backgroundColor: COLORS.panelRaised },
  cellLocked: { backgroundColor: COLORS.panelSunken },
  cellName: { ...TYPE.tab, fontSize: 11, color: COLORS.text },
  cellNameLocked: { color: COLORS.locked },
  cellLockedText: { ...TYPE.tiny, fontSize: 8, color: COLORS.locked },
  star: { position: 'absolute', top: 2, left: 4, fontSize: 12, color: COLORS.gold },

  pressed: { opacity: 0.85 },

  sheet: { gap: SPACE.md },
  sheetBody: { flexDirection: 'row', gap: SPACE.md, marginTop: SPACE.md },
  portrait: { alignItems: 'center', width: 84, gap: SPACE.xs },
  portraitName: { ...TYPE.label, fontSize: 10, color: COLORS.text, textAlign: 'center' },

  stats: { flex: 1, gap: SPACE.xs },
  stat: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  statLabel: { ...TYPE.label, fontSize: 10, color: COLORS.muted },
  statValue: { ...TYPE.price, fontSize: 13, color: COLORS.text },

  ability: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    marginTop: SPACE.xs,
    padding: SPACE.sm,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.panelSunken,
  },
  abilityIcon: { fontSize: 18 },
  abilityText: { flex: 1, minWidth: 0 },
  abilityName: { ...TYPE.label, fontSize: 10, color: COLORS.text },
  abilityKind: { ...TYPE.body, fontSize: 11, color: COLORS.muted },
  abilityDesc: { ...TYPE.body, fontSize: 12, color: COLORS.muted, lineHeight: 17 },

  skins: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.sm },
  skin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
    paddingVertical: 4,
    paddingHorizontal: SPACE.sm,
    borderRadius: RADIUS.pill,
    borderWidth: 2,
    borderColor: COLORS.frame,
    backgroundColor: COLORS.panelRaised,
  },
  skinOn: { borderColor: COLORS.borderStrong, backgroundColor: COLORS.gold },
  skinDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  skinLabel: { ...TYPE.body, fontSize: 12, color: COLORS.text },
  skinPrice: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  skinPriceText: { ...TYPE.tiny, color: COLORS.text },

  actions: { flexDirection: 'row', gap: SPACE.sm },
  action: { flex: 1 },
  buyPrice: { ...TYPE.price, fontSize: 13, color: COLORS.onGold },
});
