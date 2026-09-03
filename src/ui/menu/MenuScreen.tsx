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
 *
 * ⚠️ « Jouer » est AU MILIEU, entre le magasin et les dieux. C'est l'onglet
 * ouvert au démarrage, et depuis le milieu les deux autres sont à un seul
 * glissement de pouce — dans un sens ou dans l'autre.
 *
 * ⚠️ Les trois onglets ne sont pas trois écrans qui se remplacent : ils sont
 * COUSUS côte à côte dans un même ruban horizontal que le doigt fait
 * glisser. Le contenu suit le doigt image par image, et le trait de la barre
 * d'onglets avance avec lui — d'où le `Animated.ScrollView` et la valeur
 * `scrollX` ci-dessous, plutôt qu'un simple `useState` d'onglet actif.
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { GodId } from '../../entities/gods/roster';
import type { Progression } from '../../meta/progression';
import { GodsTab } from './GodsTab';
import { PlayTab } from './PlayTab';
import { SettingsSheet } from './SettingsSheet';
import { ShopTab } from './ShopTab';
import { Purse } from './parts';
import { COLORS, RADIUS, SPACE, TOUCH_MIN, TYPE } from './theme';

export type MenuTab = 'shop' | 'play' | 'gods';

/** L'ordre à l'écran, de gauche à droite. « Jouer » au milieu. */
const TABS: { id: MenuTab; label: string }[] = [
  { id: 'shop', label: 'Magasin' },
  { id: 'play', label: 'Jouer' },
  { id: 'gods', label: 'Dieux' },
];

const indexOf = (id: MenuTab) => TABS.findIndex((t) => t.id === id);

/** La largeur du trait actif, sous l'intitulé. */
const MARK_WIDTH = 22;

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
  const { width } = useWindowDimensions();
  const pageWidth = Math.max(1, Math.round(width));

  /** L'onglet « arrêté ». Sert à l'accessibilité, pas au dessin du ruban. */
  const [index, setIndex] = useState(indexOf('play'));
  const indexRef = useRef(index);
  indexRef.current = index;

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const pagerRef = useRef<ScrollView | null>(null);

  // ⚠️ `contentOffset` ne place le ruban qu'à l'ouverture, et SEULEMENT sur
  // iOS. Ailleurs (Android, web), on le recadre nous-mêmes dès que le ruban
  // connaît sa taille — sinon le menu s'ouvrirait sur le magasin.
  const placed = useRef(false);

  // La position du ruban, en pixels. Elle est pilotée par le pilote natif :
  // le trait de la barre d'onglets suit donc le doigt sans passer par React,
  // même si le fil JavaScript est occupé ailleurs.
  const scrollX = useRef(new Animated.Value(indexOf('play') * pageWidth)).current;

  const goTo = useCallback(
    (id: MenuTab) => {
      const target = indexOf(id);
      setIndex(target);
      pagerRef.current?.scrollTo({ x: target * pageWidth, y: 0, animated: true });
    },
    [pageWidth],
  );

  // Une rotation d'écran change la largeur d'une page : sans ce recadrage, le
  // ruban resterait immobile et montrerait deux onglets à moitié.
  useEffect(() => {
    scrollX.setValue(indexRef.current * pageWidth);
    pagerRef.current?.scrollTo({ x: indexRef.current * pageWidth, y: 0, animated: false });
  }, [pageWidth, scrollX]);

  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
    useNativeDriver: true,
    // Le glissement, lui, est continu : on ne retient que l'onglet le plus
    // proche, et seulement quand il change — inutile de réveiller React à
    // chaque image.
    listener: (event: { nativeEvent: { contentOffset: { x: number } } }) => {
      const next = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
      if (next !== indexRef.current && next >= 0 && next < TABS.length) {
        indexRef.current = next;
        setIndex(next);
      }
    },
  });

  const closeSettings = () => {
    setSettingsOpen(false);
    // La demande de confirmation ne survit pas à la fermeture : rouvrir les
    // paramètres ne doit jamais présenter un bouton « Effacer » armé.
    setConfirmingReset(false);
  };

  const tabWidth = pageWidth / TABS.length;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Purse drachmas={state.drachmas} />
      </View>

      {/*
        Le ruban. Chaque onglet garde son propre défilement vertical, donc sa
        position quand on revient dessus, et les trois restent montés : passer
        de l'un à l'autre ne reconstruit rien.
      */}
      <Animated.ScrollView
        ref={pagerRef as never}
        style={styles.pager}
        horizontal
        pagingEnabled
        directionalLockEnabled
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentOffset={{ x: indexOf('play') * pageWidth, y: 0 }}
        scrollEventThrottle={16}
        onScroll={onScroll}
        onContentSizeChange={() => {
          if (placed.current) return;
          placed.current = true;
          pagerRef.current?.scrollTo({ x: indexOf('play') * pageWidth, y: 0, animated: false });
        }}
      >
        <Page width={pageWidth}>
          <ShopTab state={state} onBuyGod={onBuyGod} onBuySkin={onBuySkin} />
        </Page>

        <Page width={pageWidth}>
          <PlayTab
            state={state}
            onPlay={onPlay}
            onOpenSettings={() => setSettingsOpen(true)}
            onChangeGod={() => goTo('gods')}
          />
        </Page>

        <Page width={pageWidth}>
          <GodsTab
            state={state}
            onSelectGod={onSelectGod}
            onEquipSkin={onEquipSkin}
            onOpenShop={() => goTo('shop')}
          />
        </Page>
      </Animated.ScrollView>

      <View style={styles.tabBar}>
        {/* Le trait actif, pas seulement la couleur : lisible aussi quand on
            distingue mal les nuances. Il est posé HORS des onglets pour
            pouvoir glisser entre eux, au rythme exact du doigt. */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.mark,
            {
              width: MARK_WIDTH,
              left: (tabWidth - MARK_WIDTH) / 2,
              transform: [
                {
                  // Une seule interpolation pour tout le ruban : le trait
                  // parcourt une largeur d'onglet pendant qu'une page défile.
                  translateX: scrollX.interpolate({
                    inputRange: [0, (TABS.length - 1) * pageWidth],
                    outputRange: [0, (TABS.length - 1) * tabWidth],
                    extrapolate: 'clamp',
                  }),
                },
              ],
            },
          ]}
        />

        {TABS.map(({ id, label }, i) => {
          const active = index === i;
          return (
            <Pressable
              key={id}
              testID={`tab-${id}`}
              onPress={() => goTo(id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={label}
              android_ripple={{ color: 'rgba(255, 255, 255, 0.12)' }}
              style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
            >
              <Animated.Text
                style={[
                  styles.tabLabel,
                  {
                    // L'intitulé s'allume en même temps que le trait arrive :
                    // le passage d'un onglet à l'autre n'a pas d'à-coup.
                    opacity: scrollX.interpolate({
                      inputRange: [(i - 1) * pageWidth, i * pageWidth, (i + 1) * pageWidth],
                      outputRange: [0.6, 1, 0.6],
                      extrapolate: 'clamp',
                    }),
                  },
                ]}
              >
                {label}
              </Animated.Text>
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

/**
 * Une page du ruban : une largeur d'écran, et son propre défilement vertical.
 *
 * ⚠️ `nestedScrollEnabled` est ce qui permet, sur Android, de faire défiler le
 * magasin vers le bas alors qu'on est déjà dans un défilement horizontal.
 */
function Page({ width, children }: { width: number; children: ReactNode }) {
  return (
    <View style={{ width }}>
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.pageContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {children}
      </ScrollView>
    </View>
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

  pager: { flex: 1 },
  page: { flex: 1 },
  pageContent: { paddingHorizontal: SPACE.xl },

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
    paddingTop: 3 + SPACE.sm,
    paddingBottom: SPACE.sm,
  },
  tabPressed: { opacity: 0.7 },
  mark: {
    position: 'absolute',
    top: SPACE.sm,
    height: 3,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.gold,
  },
  tabLabel: { ...TYPE.body, fontWeight: '700', color: COLORS.text },
});
