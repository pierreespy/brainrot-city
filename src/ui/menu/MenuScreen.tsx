/**
 * MenuScreen.tsx — l'écran d'accueil et ses quatre onglets.
 *
 * C'est le seul fichier qui sait qu'il existe quatre onglets. Chacun d'eux
 * ignore les autres, et aucun ne connaît le jeu : le menu reçoit des
 * fonctions (« jouer », « acheter ») et les appelle. La 3D peut être en train
 * de tourner derrière, ou pas du tout, cela ne le regarde pas.
 *
 * ⚠️ Les onglets sont EN BAS, et il y en a quatre. Le pouce n'atteint pas le
 * haut d'un téléphone moderne, et une barre d'onglets cesse d'être lisible
 * au-delà de cinq entrées : la place restante vaut pour un cinquième onglet,
 * pas pour un sixième.
 *
 * ⚠️ « Jouer » est en DEUXIÈME position, pas au bord. C'est l'onglet ouvert
 * au démarrage, et depuis là aucun des trois autres n'est à plus de deux
 * glissements de pouce.
 *
 * ⚠️ Les onglets ne sont pas quatre écrans qui se remplacent : ils sont
 * COUSUS côte à côte dans un même ruban horizontal que le doigt fait
 * glisser. Le contenu suit le doigt image par image, et le trait de la barre
 * d'onglets avance avec lui — d'où le `Animated.ScrollView` et la valeur
 * `scrollX` ci-dessous, plutôt qu'un simple `useState` d'onglet actif.
 *
 * ⚠️ Le décor est UNE SEULE image, large de quatre écrans, posée DANS le
 * ruban (voir `Backdrop`). Le magasin en montre un quart, « Jouer » le
 * suivant, et ainsi de suite : le doigt fait voyager le regard le long d'un
 * même paysage, sans interpolation à la main — le défilement natif s'en
 * charge.
 *
 * ⚠️ Le bandeau du haut et la barre d'onglets, eux, ne bougent JAMAIS : ce
 * sont des habillages de l'écran, pas des morceaux de la scène. Ils sont
 * posés APRÈS le ruban, donc par-dessus l'image qui glisse.
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { GodId } from '../../entities/gods/roster';
import type { Progression } from '../../meta/progression';
import { OlympeTab } from './OlympeTab';
import { PassTab } from './PassTab';
import { PlayTab } from './PlayTab';
import { SettingsSheet } from './SettingsSheet';
import { ShopTab } from './ShopTab';
import { TopBar } from './TopBar';
import { COLORS, RADIUS, SPACE, TEXT_SHADOW, TOUCH_MIN, TYPE } from './theme';

export type MenuTab = 'olympe' | 'play' | 'pass' | 'shop';

/** L'ordre à l'écran, de gauche à droite. « Jouer » en deuxième. */
const TABS: { id: MenuTab; label: string; icon: string }[] = [
  { id: 'olympe', label: 'Olympe', icon: '🏛️' },
  { id: 'play', label: 'Jouer', icon: '⚔️' },
  { id: 'pass', label: 'Passe', icon: '🛡️' },
  { id: 'shop', label: 'Boutique', icon: '🏺' },
];

const indexOf = (id: MenuTab) => TABS.findIndex((t) => t.id === id);

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
  // connaît sa taille — sinon le menu s'ouvrirait sur l'Olympe.
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

  return (
    <View style={styles.root}>
      {/* Le décor, et le brouillard clair qui le fait passer derrière le
          parchemin. Les deux sont FIXES : seule l'image du ruban glisse. */}
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <TopBar
          state={state}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenShop={() => goTo('shop')}
        />

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
            <OlympeTab
              state={state}
              onSelectGod={onSelectGod}
              onBuyGod={onBuyGod}
              onBuySkin={onBuySkin}
              onEquipSkin={onEquipSkin}
            />
          </Page>

          <Page width={pageWidth}>
            <PlayTab state={state} onPlay={onPlay} onChangeGod={() => goTo('olympe')} />
          </Page>

          <Page width={pageWidth}>
            <PassTab state={state} />
          </Page>

          <Page width={pageWidth}>
            <ShopTab state={state} onBuyGod={onBuyGod} onBuySkin={onBuySkin} />
          </Page>
        </Animated.ScrollView>

        <TabBar index={index} pageWidth={pageWidth} scrollX={scrollX} onGo={goTo} />
      </SafeAreaView>

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
    </View>
  );
}

/**
 * La barre d'onglets : quatre dalles de marbre, et celle du milieu s'allume.
 *
 * ⚠️ L'onglet actif ne change pas seulement de couleur : il MONTE et
 * s'éclaire, et son intitulé passe à l'or. Distinguer un onglet par sa seule
 * teinte le rend illisible pour qui distingue mal les nuances.
 */
function TabBar({
  index,
  pageWidth,
  scrollX,
  onGo,
}: {
  index: number;
  pageWidth: number;
  scrollX: Animated.Value;
  onGo: (id: MenuTab) => void;
}) {
  return (
    <View style={styles.tabBar}>
      {TABS.map(({ id, label, icon }, i) => {
        const active = index === i;
        return (
          <Pressable
            key={id}
            testID={`tab-${id}`}
            onPress={() => onGo(id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={label}
            android_ripple={{ color: 'rgba(255, 255, 255, 0.18)' }}
            style={({ pressed }) => [styles.tab, active && styles.tabActive, pressed && styles.tabPressed]}
          >
            <Animated.Text
              style={[
                styles.tabIcon,
                {
                  // L'icône grandit à mesure que l'onglet arrive sous le
                  // doigt : le passage d'un onglet à l'autre n'a pas d'à-coup.
                  transform: [
                    {
                      scale: scrollX.interpolate({
                        inputRange: [(i - 1) * pageWidth, i * pageWidth, (i + 1) * pageWidth],
                        outputRange: [0.85, 1.15, 0.85],
                        extrapolate: 'clamp',
                      }),
                    },
                  ],
                },
              ]}
            >
              {icon}
            </Animated.Text>
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * Le décor : UNE image, large des quatre onglets réunis.
 *
 * ⚠️ Elle vit DANS le ruban — c'est un enfant de la zone qui défile, pas un
 * calque posé derrière l'écran. C'est ce qui la fait bouger avec le doigt
 * sans une ligne d'animation.
 *
 * ⚠️ Elle est en position absolue, donc HORS du rang des pages : sans cela
 * elle occuperait une cinquième place dans le ruban et décalerait les
 * onglets d'un écran. Posée en premier, elle est aussi dessinée dessous.
 *
 * Le brouillard clair par-dessus n'est pas décoratif : le parchemin des
 * cartes se perdrait sur une photo aussi contrastée.
 */
function Backdrop({ width }: { width: number }) {
  return (
    <View pointerEvents="none" style={[styles.backdrop, { width }]}>
      <Image
        source={require('../../../assets/wallpaper.jpg')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      <LinearGradient
        colors={[COLORS.veil, 'rgba(248, 238, 214, 0.35)', COLORS.veil]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

/**
 * Une page du ruban : une largeur d'écran, et son propre défilement.
 *
 * ⚠️ Elle est TRANSPARENTE, et c'est ce qui laisse voir le décor commun posé
 * dessous. Lui donner un fond couperait l'image en quatre.
 */
function Page({ width, children }: { width: number; children: ReactNode }) {
  return <View style={[styles.page, { width }]}>{children}</View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.ground },
  safe: { flex: 1 },

  backdrop: { position: 'absolute', top: 0, bottom: 0, left: 0 },

  pager: { flex: 1 },
  page: { paddingHorizontal: SPACE.md },

  tabBar: {
    flexDirection: 'row',
    gap: 2,
    paddingHorizontal: SPACE.xs,
    paddingTop: SPACE.xs,
    backgroundColor: COLORS.bar,
    borderTopWidth: 3,
    borderTopColor: COLORS.frame,
  },
  tab: {
    flex: 1,
    minHeight: TOUCH_MIN + 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: SPACE.sm,
    borderTopLeftRadius: RADIUS.sm,
    borderTopRightRadius: RADIUS.sm,
  },
  // L'onglet actif est une dalle éclairée, posée sur la barre sombre.
  tabActive: { backgroundColor: COLORS.frameDark, borderBottomWidth: 3, borderBottomColor: COLORS.gold },
  tabPressed: { opacity: 0.75 },
  tabIcon: { fontSize: 22 },
  tabLabel: { ...TYPE.tab, ...TEXT_SHADOW, color: COLORS.onDark, opacity: 0.75 },
  tabLabelActive: { color: COLORS.gold, opacity: 1 },
});
