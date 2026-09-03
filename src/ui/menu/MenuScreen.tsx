/**
 * MenuScreen.tsx — l'écran d'accueil et ses trois onglets.
 *
 * C'est le seul fichier qui sait qu'il existe trois onglets. Chacun d'eux
 * ignore les autres, et aucun ne connaît le jeu : le menu reçoit des
 * fonctions (« jouer », « acheter ») et les appelle. La 3D peut être en train
 * de tourner derrière, ou pas du tout, cela ne le regarde pas.
 *
 * ⚠️ Les onglets sont EN BAS, et il y en a trois. Le pouce n'atteint pas le
 * haut d'un téléphone moderne, et une barre d'onglets cesse d'être lisible
 * au-delà de cinq entrées — c'est la place qui reste pour l'écran de fin de
 * partie (M38) et les modes de jeu (M45) si un jour ils la demandent.
 */

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { GodId } from '../../entities/gods/roster';
import type { Progression } from '../../meta/progression';
import { GodsTab } from './GodsTab';
import { PlayTab } from './PlayTab';
import { SettingsSheet } from './SettingsSheet';
import { ShopTab } from './ShopTab';
import { Purse } from './parts';
import { COLORS, RADIUS, SPACE, TOUCH_MIN, TYPE } from './theme';

export type MenuTab = 'play' | 'shop' | 'gods';

const TABS: { id: MenuTab; label: string }[] = [
  { id: 'play', label: 'Jouer' },
  { id: 'shop', label: 'Magasin' },
  { id: 'gods', label: 'Dieux' },
];

interface Props {
  state: Progression;
  onPlay: () => void;
  onBuyGod: (godId: GodId) => void;
  onBuySkin: (skinId: string) => void;
  onSelectGod: (godId: GodId) => void;
  onEquipSkin: (skinId: string) => void;
  onResetProgression: () => void;
  showStats: boolean;
  onToggleStats: (value: boolean) => void;
}

export function MenuScreen({
  state,
  onPlay,
  onBuyGod,
  onBuySkin,
  onSelectGod,
  onEquipSkin,
  onResetProgression,
  showStats,
  onToggleStats,
}: Props) {
  const [tab, setTab] = useState<MenuTab>('play');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const closeSettings = () => {
    setSettingsOpen(false);
    // La demande de confirmation ne survit pas à la fermeture : rouvrir les
    // paramètres ne doit jamais présenter un bouton « Effacer » armé.
    setConfirmingReset(false);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Purse drachmas={state.drachmas} />
      </View>

      {/*
        Un ScrollView par onglet plutôt qu'un seul commun : chacun garde sa
        position de défilement quand on revient dessus.
      */}
      <ScrollView
        key={tab}
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {tab === 'play' && (
          <PlayTab
            state={state}
            onPlay={onPlay}
            onOpenSettings={() => setSettingsOpen(true)}
            onChangeGod={() => setTab('gods')}
          />
        )}
        {tab === 'shop' && <ShopTab state={state} onBuyGod={onBuyGod} onBuySkin={onBuySkin} />}
        {tab === 'gods' && (
          <GodsTab
            state={state}
            onSelectGod={onSelectGod}
            onEquipSkin={onEquipSkin}
            onOpenShop={() => setTab('shop')}
          />
        )}
      </ScrollView>

      <View style={styles.tabBar}>
        {TABS.map(({ id, label }) => {
          const active = tab === id;
          return (
            <Pressable
              key={id}
              testID={`tab-${id}`}
              onPress={() => setTab(id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={label}
              android_ripple={{ color: 'rgba(255, 255, 255, 0.12)' }}
              style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
            >
              {/* Le trait actif, pas seulement la couleur : lisible aussi
                  quand on distingue mal les nuances. */}
              <View style={[styles.tabMark, active && styles.tabMarkActive]} />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      <SettingsSheet
        visible={settingsOpen}
        onClose={closeSettings}
        showStats={showStats}
        onToggleStats={onToggleStats}
        confirmingReset={confirmingReset}
        onAskReset={() => setConfirmingReset(true)}
        onCancelReset={() => setConfirmingReset(false)}
        onReset={() => {
          onResetProgression();
          closeSettings();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.ground },

  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACE.xl,
    paddingTop: SPACE.sm,
  },

  body: { flex: 1 },
  bodyContent: { paddingHorizontal: SPACE.xl },

  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.ground,
    paddingTop: SPACE.sm,
  },
  tab: {
    flex: 1,
    minHeight: TOUCH_MIN + 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.sm,
    paddingBottom: SPACE.sm,
  },
  tabPressed: { opacity: 0.7 },
  tabMark: {
    width: 22,
    height: 3,
    borderRadius: RADIUS.pill,
    backgroundColor: 'transparent',
  },
  tabMarkActive: { backgroundColor: COLORS.gold },
  tabLabel: { ...TYPE.body, fontWeight: '700', color: COLORS.muted },
  tabLabelActive: { color: COLORS.text },
});
