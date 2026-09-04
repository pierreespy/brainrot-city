/**
 * MenuScreen.tsx — l'écran d'accueil et ses cinq onglets.
 *
 * C'est le seul fichier qui sait combien il y a d'onglets. Chacun d'eux
 * ignore les autres, et aucun ne connaît le jeu : le menu reçoit des
 * fonctions (« jouer », « acheter ») et les appelle. La 3D peut être en train
 * de tourner derrière, ou pas du tout, cela ne le regarde pas.
 *
 * ⚠️ Les onglets sont EN BAS, et il y en a CINQ. Le pouce n'atteint pas le
 * haut d'un téléphone moderne, et une barre d'onglets cesse d'être lisible
 * au-delà de cinq entrées : la barre est donc pleine. Un sixième onglet
 * demanderait d'en fusionner deux, pas d'en serrer un de plus.
 *
 * ⚠️ « Jouer » est au MILIEU, et c'est ce qui décide du reste. Il est ouvert
 * au démarrage, et deux dalles le bordent de chaque côté : aucun onglet n'est
 * à plus de deux glissements de pouce, et la barre est symétrique.
 *
 * ⚠️ « Jouer » n'est pas une dalle comme les autres : c'est un MÉDAILLON
 * posé à cheval sur la barre, au centre, deux fois plus grand. Il occupe la
 * place qu'aurait eue son onglet — l'ordre du ruban ne change pas — mais il
 * annonce l'action du menu, là où les quatre autres n'annoncent qu'un lieu.
 *
 * ⚠️ Les onglets ne sont pas cinq écrans qui se remplacent : ils sont
 * COUSUS côte à côte dans un même ruban horizontal que le doigt fait
 * glisser. Le contenu suit le doigt image par image, et le trait de la barre
 * d'onglets avance avec lui — d'où le `Animated.ScrollView` et la valeur
 * `scrollX` ci-dessous, plutôt qu'un simple `useState` d'onglet actif.
 *
 * ⚠️ Le décor est posé DANS le ruban (voir `Backdrop`), en tranches d'une
 * page chacune : « Jouer » montre `wallpaper1.png`, les quatre autres
 * onglets partagent `wallpaper2.png`. Le doigt fait glisser ces tranches
 * sans interpolation à la main — le défilement natif s'en charge.
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
import type { ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ICONS } from './icons';
import type { GodId } from '../../entities/gods/roster';
import type { Progression } from '../../meta/progression';
import { OlympeTab } from './OlympeTab';
import { PassTab } from './PassTab';
import { PlayTab } from './PlayTab';
import { QuetesTab } from './QuetesTab';
import { SettingsSheet } from './SettingsSheet';
import { ShopTab } from './ShopTab';
import { TopBar } from './TopBar';
import { Column } from './parts';
import { COLORS, RADIUS, SPACE, TEXT_SHADOW, TOUCH_MIN, TYPE } from './theme';

export type MenuTab = 'olympe' | 'quetes' | 'play' | 'pass' | 'shop';

/** Le décor de « Jouer », et celui, partagé, de tous les autres onglets. */
const WALLPAPER_PLAY = require('../../../assets/wallpaper1.png');
const WALLPAPER_OTHER = require('../../../assets/wallpaper2.png');

/** Le médaillon « Jouer », et la place qu'il creuse au milieu de la barre. */
const MEDALLION = 86;

/**
 * L'ordre à l'écran, de gauche à droite. « Jouer » au milieu, encadré par
 * deux dalles de chaque côté.
 *
 * ⚠️ Les quatre dalles portent une IMAGE, le médaillon central un caractère.
 * Ce n'est pas un oubli : un onglet nomme un LIEU ou un OBJET — le temple, le
 * rouleau des quêtes, le casque du passe, l'amphore de la boutique — et une
 * image dessinée le montre mieux qu'un émoji, dont le tracé change d'un
 * téléphone à l'autre. « Jouer », lui, ne nomme pas un lieu mais un geste, et
 * il est déjà dit par la taille du médaillon et par son intitulé gravé.
 */
const TABS: { id: MenuTab; label: string; icon: ImageSourcePropType | null }[] = [
  { id: 'quetes', label: 'Quêtes', icon: ICONS.quetes },
  { id: 'olympe', label: 'Olympe', icon: ICONS.olympe },
  { id: 'play', label: 'Jouer', icon: null },
  { id: 'pass', label: 'Passe', icon: ICONS.passe },
  { id: 'shop', label: 'Boutique', icon: ICONS.boutique },
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

        <TempleCrown />

        <View style={styles.nave}>
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
            <Backdrop pageWidth={pageWidth} />

            <Page width={pageWidth}>
              <QuetesTab state={state} />
            </Page>

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
              <PlayTab state={state} onPlay={onPlay} />
            </Page>

            <Page width={pageWidth}>
              <PassTab state={state} />
            </Page>

            <Page width={pageWidth}>
              <ShopTab state={state} onBuyGod={onBuyGod} onBuySkin={onBuySkin} />
            </Page>
          </Animated.ScrollView>

          {/* Les deux colonnes du temple. Elles sont posées APRÈS le ruban,
              donc par-dessus l'image qui glisse, et ne prennent jamais le
              doigt : le glissement horizontal part aussi depuis le bord. */}
          <Column side="left" />
          <Column side="right" />
        </View>

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
 * La barre d'onglets : quatre dalles de marbre, et le médaillon « Jouer » qui
 * flotte au centre, à cheval sur la barre.
 *
 * ⚠️ L'onglet actif ne change pas seulement de couleur : il MONTE et
 * s'éclaire, et son intitulé passe à l'or. Distinguer un onglet par sa seule
 * teinte le rend illisible pour qui distingue mal les nuances.
 *
 * ⚠️ Le médaillon n'est pas dans le rang : il est en position absolue, au
 * milieu exact de la barre. C'est pourquoi les quatre dalles sont réparties
 * en DEUX groupes de largeur égale, séparés par un vide (`dock`) : sans cette
 * symétrie, le centre de la barre ne tomberait pas dans le vide, et le
 * médaillon recouvrirait une dalle.
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
  const playing = index === indexOf('play');

  const slab = (id: MenuTab) => {
    const { label, icon } = TABS[indexOf(id)];
    const i = indexOf(id);
    const active = index === i;
    return (
      <Pressable
        testID={`tab-${id}`}
        onPress={() => onGo(id)}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        accessibilityLabel={label}
        android_ripple={{ color: 'rgba(255, 255, 255, 0.18)' }}
        style={({ pressed }) => [styles.tab, active && styles.tabActive, pressed && styles.tabPressed]}
      >
        {icon !== null && (
          <Animated.Image
            source={icon}
            // `contain` : le fronton est large, le casque plus encore, et
            // l'amphore haute. Ils partagent la même BOÎTE, pas le même
            // cadrage — les étirer à un carré les déformerait.
            resizeMode="contain"
            // L'intitulé sous l'icône dit déjà l'onglet, et la dalle porte
            // son propre `accessibilityLabel` : annoncée, l'image ferait
            // entendre le nom deux fois.
            accessible={false}
            importantForAccessibility="no"
            style={[
              styles.tabIcon,
              {
                // L'icône grandit à mesure que l'onglet arrive sous le doigt :
                // le passage d'un onglet à l'autre n'a pas d'à-coup.
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
          />
        )}
        <Text style={[styles.tabLabel, active && styles.tabLabelActive]} numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.tabBar}>
      <View style={styles.side}>
        {slab('quetes')}
        {slab('olympe')}
      </View>

      <View style={styles.dock} />

      <View style={styles.side}>
        {slab('pass')}
        {slab('shop')}
      </View>

      <Pressable
        testID="tab-play"
        onPress={() => onGo('play')}
        accessibilityRole="tab"
        accessibilityState={{ selected: playing }}
        accessibilityLabel="Jouer"
        style={({ pressed }) => [styles.medallion, pressed && styles.medallionPressed]}
      >
        <LinearGradient
          colors={playing ? [COLORS.goldLight, COLORS.gold] : [COLORS.panelRaised, COLORS.panelSunken]}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.medallionIcon}>⚔️</Text>
        <Text style={styles.medallionLabel}>JOUER</Text>
      </Pressable>
    </View>
  );
}

/**
 * Le haut du temple : le fronton et sa frise, entre le bandeau et le ruban.
 *
 * Il ne porte aucune information — c'est le linteau qui referme le cadre que
 * les deux colonnes ouvrent sur les côtés. Sans lui, elles auraient l'air de
 * deux barres posées au hasard des bords.
 */
function TempleCrown() {
  return (
    <View pointerEvents="none" style={styles.crown}>
      <View style={styles.pediment} />
      <View style={styles.frieze}>
        {Array.from({ length: 16 }, (_, i) => (
          <View key={i} style={styles.friezeNotch} />
        ))}
      </View>
    </View>
  );
}

/**
 * Le décor : DEUX images, une par onglet selon ce qu'il montre — « Jouer »
 * a la sienne (`wallpaper1.png`), les quatre autres partagent la même
 * (`wallpaper2.png`).
 *
 * ⚠️ Il vit DANS le ruban — c'est un enfant de la zone qui défile, pas un
 * calque posé derrière l'écran. C'est ce qui le fait bouger avec le doigt
 * sans une ligne d'animation : chaque tranche est simplement la largeur
 * d'une page, rangée dans le même ordre que les onglets.
 *
 * ⚠️ Il est en position absolue, donc HORS du rang des pages : sans cela
 * il occuperait une sixième place dans le ruban et décalerait les onglets
 * d'un écran. Posé en premier, il est aussi dessiné dessous.
 *
 * Le brouillard clair par-dessus n'est pas décoratif : le parchemin des
 * cartes se perdrait sur une photo aussi contrastée.
 */
function Backdrop({ pageWidth }: { pageWidth: number }) {
  return (
    <View pointerEvents="none" style={[styles.backdrop, { width: pageWidth * TABS.length }]}>
      {TABS.map((tab) => (
        <Image
          key={tab.id}
          source={tab.id === 'play' ? WALLPAPER_PLAY : WALLPAPER_OTHER}
          style={{ width: pageWidth, height: '100%' }}
          resizeMode="cover"
        />
      ))}
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

  backdrop: { position: 'absolute', top: 0, bottom: 0, left: 0, flexDirection: 'row' },

  // La nef : le ruban, et les deux colonnes qui le bordent.
  nave: { flex: 1 },
  pager: { flex: 1 },
  // Les cartes s'arrêtent en deçà des colonnes, et au-dessus du médaillon.
  page: { paddingHorizontal: SPACE.md + SPACE.sm, paddingBottom: MEDALLION / 3 },

  crown: { backgroundColor: 'transparent' },
  // Le fronton : un triangle, dessiné avec les bordures — la seule façon
  // d'obtenir un angle en React Native, qui ne connaît que des rectangles.
  pediment: {
    alignSelf: 'center',
    width: 0,
    height: 0,
    borderLeftWidth: 110,
    borderRightWidth: 110,
    borderBottomWidth: 18,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: COLORS.frame,
  },
  frieze: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 12,
    backgroundColor: COLORS.frameDark,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: COLORS.frameDeep,
  },
  friezeNotch: { width: 6, height: 6, backgroundColor: COLORS.goldLight, opacity: 0.7 },

  tabBar: {
    flexDirection: 'row',
    gap: 2,
    paddingHorizontal: SPACE.sm,
    paddingTop: SPACE.xs,
    backgroundColor: COLORS.bar,
    borderTopWidth: 3,
    borderTopColor: COLORS.frame,
  },
  // Les deux moitiés de la barre, de part et d'autre du médaillon.
  side: { flex: 1, flexDirection: 'row', gap: 2 },
  dock: { width: MEDALLION + SPACE.sm },
  // Le médaillon déborde en haut de la barre : il chevauche le ruban, et
  // c'est ce débordement qui le fait lire comme un bouton posé dessus.
  medallion: {
    position: 'absolute',
    // ⚠️ `alignSelf` ne centrerait QUE sur l'axe vertical dans une barre en
    // rang : le centrage horizontal se fait à la main.
    left: '50%',
    marginLeft: -MEDALLION / 2,
    top: -MEDALLION / 3,
    width: MEDALLION,
    height: MEDALLION,
    borderRadius: MEDALLION / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: COLORS.frameDeep,
    overflow: 'hidden',
  },
  medallionPressed: { transform: [{ scale: 0.94 }] },
  medallionIcon: { fontSize: 30 },
  medallionLabel: { ...TYPE.banner, fontSize: 13, color: COLORS.onGold },
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
  // La boîte de l'icône, la même pour les trois : sans hauteur fixe, une
  // amphore haute pousserait son intitulé plus bas que celui du fronton, et
  // la barre cesserait d'être alignée.
  // Elle est plus LARGE que haute : le casque du passe porte deux ailes
  // déployées, et dans une boîte carrée ce sont elles qui prennent la place,
  // laissant le casque lui-même illisible.
  tabIcon: { width: 38, height: 28 },
  tabLabel: { ...TYPE.tab, ...TEXT_SHADOW, fontSize: 11, color: COLORS.onDark, opacity: 0.75 },
  tabLabelActive: { color: COLORS.gold, opacity: 1 },
});
