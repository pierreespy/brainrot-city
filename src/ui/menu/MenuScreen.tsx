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
 *
 * ⚠️ Le fond (le temple) est DANS le ruban, pas fixé derrière : il glisse
 * avec le doigt, dans le même sens et à la même vitesse — le défilement
 * natif s'en charge, sans interpolation à la main.
 *
 * ⚠️ Et c'est UNE SEULE image, large de trois écrans, pas trois exemplaires
 * de la même : le magasin en montre le tiers gauche, « Jouer » le milieu,
 * les dieux le tiers droit. Le doigt fait donc voyager le regard le long
 * d'un même paysage — d'où `Backdrop` ci-dessous, posé une fois pour tout le
 * ruban. L'image attendue est panoramique (assets/wallpaper.jpg, cadrée en
 * 27:16) : c'est le seul fichier à remplacer pour changer le décor.
 *
 * Le voile en dégradé (haut et bas), lui, reste FIXE — c'est un habillage de
 * l'écran (les bourses, la barre d'onglets), pas une partie de la scène. Il
 * est posé APRÈS le ruban pour dessiner par-dessus l'image qui glisse.
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { GodId } from '../../entities/gods/roster';
import type { Progression } from '../../meta/progression';
import { GodsTab } from './GodsTab';
import { PlayTab } from './PlayTab';
import { SettingsSheet } from './SettingsSheet';
import { ShopTab } from './ShopTab';
import { CurrencyBar } from './parts';
import { COLORS, RADIUS, SPACE, TEXT_SHADOW, TOUCH_MIN, TYPE } from './theme';

export type MenuTab = 'shop' | 'play' | 'gods';

/** L'ordre à l'écran, de gauche à droite. « Jouer » au milieu. */
const TABS: { id: MenuTab; label: string }[] = [
  { id: 'shop', label: 'Magasin' },
  { id: 'play', label: 'Jouer' },
  { id: 'gods', label: 'Dieux' },
];

const indexOf = (id: MenuTab) => TABS.findIndex((t) => t.id === id);

/**
 * La marge, de chaque côté, entre le chip actif et le bord de son onglet.
 *
 * ⚠️ Le chip a remplacé le simple trait sous l'intitulé : une pastille
 * arrondie qui EMBRASSE tout l'onglet, à la façon dont un jeu mobile marque
 * l'onglet du bas qu'on a sous le doigt — pas juste un soulignement de site
 * web. Elle glisse par la même interpolation que l'ancien trait.
 */
const CHIP_INSET = 6;

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
        <CurrencyBar
          drachmas={state.drachmas}
          ambrosia={state.ambrosia}
          onOpenShop={() => goTo('shop')}
        />
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
        <Backdrop width={pageWidth * TABS.length} />

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
        {/* Le chip actif, pas seulement la couleur du texte : lisible aussi
            quand on distingue mal les nuances. Il est posé HORS des onglets
            pour pouvoir glisser entre eux, au rythme exact du doigt. */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.tabChip,
            {
              width: tabWidth - CHIP_INSET * 2,
              left: CHIP_INSET,
              transform: [
                {
                  // Une seule interpolation pour tout le ruban : le chip
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

      {/* Le voile de lisibilité, lui, ne bouge JAMAIS : c'est un habillage de
          l'écran (les bourses en haut, la barre d'onglets en bas), pas une
          partie de la scène. Il est posé EN DERNIER, donc AU-DESSUS du
          ruban : c'est ce qui lui permet d'assombrir le temple qui glisse
          dessous sans jamais bouger lui-même. */}
      <LinearGradient
        pointerEvents="none"
        colors={[COLORS.ground, COLORS.veil, COLORS.veil, COLORS.ground]}
        locations={[0, 0.24, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

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
 * Le décor : UNE image, large des trois onglets réunis.
 *
 * ⚠️ Elle vit DANS le ruban — c'est un enfant de la zone qui défile, pas un
 * calque posé derrière l'écran. C'est ce qui la fait bouger avec le doigt
 * sans une ligne d'animation : le défilement natif la déplace comme il
 * déplace les pages, donc exactement à leur vitesse. Une interpolation sur
 * `scrollX` ferait la même chose en moins fiable et en plus cher.
 *
 * ⚠️ Elle est en position absolue, donc HORS du rang des pages : sans cela
 * elle occuperait une quatrième place dans le ruban et décalerait les
 * onglets d'un écran. Posée en premier, elle est aussi dessinée dessous.
 *
 * `cover` sur une boîte de trois écrans de large garde l'image entière en
 * hauteur et ne rogne que ses bords gauche et droit — le sujet doit donc
 * vivre au centre du cadre, jamais collé à un bord.
 */
function Backdrop({ width }: { width: number }) {
  return (
    <Image
      source={require('../../../assets/wallpaper.jpg')}
      style={[styles.backdrop, { width }]}
      resizeMode="cover"
    />
  );
}

/**
 * Une page du ruban : une largeur d'écran, et son propre défilement vertical.
 *
 * ⚠️ Elle est TRANSPARENTE, et c'est ce qui laisse voir le décor commun posé
 * dessous. Lui donner un fond couperait l'image en trois.
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

  // Ancrée en haut, en bas et à gauche du ruban : sa hauteur suit celle de
  // l'écran, sa largeur est donnée à la main (trois pages).
  backdrop: { position: 'absolute', top: 0, bottom: 0, left: 0 },

  page: { flex: 1, backgroundColor: 'transparent' },
  pageContent: { paddingHorizontal: SPACE.xl },

  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    // Transparent, à dessein : le voile en dégradé posé sur le fond rejoint
    // déjà `COLORS.ground` à cette hauteur de l'écran, sans coupure.
    backgroundColor: 'transparent',
    paddingTop: SPACE.sm,
  },
  tab: {
    flex: 1,
    minHeight: TOUCH_MIN + 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACE.sm,
  },
  tabPressed: { opacity: 0.7 },
  tabChip: {
    position: 'absolute',
    top: SPACE.xs,
    bottom: SPACE.xs,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(216, 180, 106, 0.20)',
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },
  tabLabel: { ...TYPE.tab, ...TEXT_SHADOW, color: COLORS.text },
});
