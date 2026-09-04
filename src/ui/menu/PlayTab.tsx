/**
 * PlayTab.tsx — l'onglet « Jouer », et le seul chemin vers une partie.
 *
 * Il est bâti comme une pile de cartes, de la plus engageante à la plus
 * lointaine : le rang de la saison, les quartiers, la course elle-même, puis
 * ce qui viendra. Le joueur pressé n'a qu'un bouton à trouver, et il est au
 * milieu de l'écran, à hauteur de pouce.
 *
 * ⚠️ Deux cartes annoncent des modes QUI N'EXISTENT PAS ENCORE — l'arène et
 * le défi de la semaine. Elles sont ÉTEINTES et le disent : un bouton qui ne
 * répond pas passe pour un bug, une carte marquée « bientôt » passe pour une
 * promesse. Le jour où le mode existera, seule la ligne `disabled` bougera.
 */

import { useState, type ReactNode } from 'react';
import { Image, ImageBackground, ScrollView, StyleSheet, Text, View } from 'react-native';
import { godById } from '../../entities/gods/roster';
import { DISTRICTS, type DistrictId } from '../../world/districts';
import { flatColorOf, type Progression } from '../../meta/progression';
import { rankOf } from '../../meta/rank';
import { Bar, Banner, Button, Card, Coin, GodBadge, Plaque, Plate } from './parts';
import { ART, DISTRICT_ICONS, PLATES } from './icons';
import { COLORS, RADIUS, SPACE, TYPE } from './theme';

interface Props {
  state: Progression;
  onPlay: () => void;
}

/**
 * Les quartiers montrés en tête d'écran, et le niveau qui les ouvre.
 *
 * ⚠️ Ils sont TOUS traversés dès la première partie — la ville est déjà
 * entière (voir `world/districts.ts`). Le niveau n'ouvre donc pas une porte,
 * il marque une étape : le joueur voit la ville qu'il parcourt, et jusqu'où
 * il l'a menée.
 */
const CHAPTERS: { id: DistrictId; level: number }[] = [
  { id: 'agora', level: 1 },
  { id: 'port', level: 5 },
  { id: 'boisSacre', level: 15 },
  { id: 'acropole', level: 30 },
];

/** La largeur et la hauteur du bec qui relie la carte au quartier atteint. */
const BEAK = 26;
const BEAK_H = 14;

export function PlayTab({ state, onPlay }: Props) {
  const god = godById(state.selectedGod);
  const appearance = flatColorOf(state);
  const rank = rankOf(state.bestScore);

  // Le quartier que le bec désigne : celui où la course COMMENCE, et c'est
  // l'Agora — le pâté (0, 0), le départ de chaque partie (voir
  // `world/districts.ts`).
  //
  // ⚠️ Ce n'est volontairement PAS le dernier palier franchi. La ville est
  // entière dès la première course : les niveaux marquent une étape, ils
  // n'ouvrent pas un quartier, et une partie au rang 29 se court exactement
  // comme la première. Un bec sur le Bois sacré promettrait donc un lieu où
  // la course ne mène pas plus qu'ailleurs. Le jour où un palier ouvrira
  // vraiment un quartier, c'est ici, et ici seulement, que le bec suivra.
  const here = CHAPTERS[0];

  // L'abscisse du milieu du quartier courant, MESURÉE plutôt que calculée.
  // Les colonnes se partagent la largeur en `flex`, avec un écart entre
  // elles : la déduire d'une fraction de l'écran la décalerait de quelques
  // points, et un bec décalé se voit tout de suite.
  const [beakX, setBeakX] = useState<number | null>(null);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    >
      {/* Le rang. Il tient en une ligne parce qu'il ne se joue pas : il se
          constate, et il se compare à la partie d'hier.

          C'est le seul bloc à porter un CADRE dessiné plutôt que le parchemin
          commun : c'est la ligne d'état du joueur, et on doit la retrouver
          sans la lire. L'image est étirée, ce qu'elle supporte — elle n'a pas
          de sujet, juste des coins ferrés. */}
      {/* ⚠️ Le conteneur du cadre n'a AUCUNE marge intérieure : elle est
          descendue d'un cran, dans `leagueInner`. Le dessin de fond est un
          enfant en position absolue tiré aux quatre bords ; or une largeur
          « 100 % » ne se mesure pas sur la même boîte des deux côtés — le web
          la prend marge comprise, Yoga la prend marge déduite. Une marge sur
          ce conteneur-ci dessinait donc un cadre plein écran sur le web et un
          cadre rétréci, rentré vers la gauche, sur le téléphone : c'était le
          « cadre pas centré ». Sans marge ici, les deux mesurent pareil.
          `resizeMode` est en PROP autant qu'en style : le style seul ne
          traverse pas jusqu'à l'image sur la nouvelle architecture iOS. */}
      <ImageBackground
        source={ART.ligue}
        style={styles.league}
        imageStyle={styles.leagueFrame}
        resizeMode="stretch"
      >
        <View style={styles.leagueInner}>
          {/* ⚠️ Le blason est HORS FLUX (`position: absolute`) : posé sur le
              bord gauche plutôt que placé à côté du titre dans une ligne. Une
              ligne icône+titre centrée COMME UN BLOC ne centre que le bloc —
              le blason ancre le bloc à gauche, et un long titre en sort décalé
              vers la droite, ce qu'aucune largeur de compensation ne corrige
              de façon fiable (la police gravée n'a pas la même largeur sur le
              web, où on la mesure, et sur le téléphone, où on la lit). Hors
              flux, le blason ne dispute plus la largeur au titre : celui-ci se
              centre seul sur le cadre entier, et se retrouve juste centré. */}
          <View style={styles.leagueHead}>
            <Text
              style={styles.leagueCrest}
              accessible={false}
              importantForAccessibility="no"
              pointerEvents="none"
            >
              🦅
            </Text>
            {/* `numberOfLines={2}` : un niveau à trois chiffres ne tient plus
                sur une ligne, et le laisser passer plutôt que le tronquer. Le
                cadre n'a qu'un `minHeight` : une seconde ligne, rare, l'étire
                au lieu de déborder. */}
            <Text style={styles.leagueName} numberOfLines={2}>
              LIGUE OLYMPIENNE : NIVEAU {rank.level}
            </Text>
          </View>
          {/* ⚠️ Des TROPHÉES, pas des fidèles. Le rang se calcule bien sur le
              meilleur cortège (voir `rank.ts`), mais ce qui monte d'un palier à
              l'autre est une échelle de ligue : la ligne du dessous, elle, dit
              les fidèles, et les deux unités ne doivent pas se confondre. */}
          <Bar
            value={rank.progress}
            max={rank.needed}
            label={`${rank.progress} / ${rank.needed} trophées`}
          />
          {/* ⚠️ Une seule ligne, et donc une phrase COURTE pour l'état vide :
              la cadette du cadre tient sur un rang, et une phrase plus longue
              s'y coupait au milieu d'un mot. */}
          <Text style={styles.leagueSub} numberOfLines={1}>
            {state.bestScore > 0
              ? `Meilleur cortège : ${state.bestScore.toLocaleString('fr-FR')} fidèles`
              : 'Le premier cortège fixera le rang.'}
          </Text>
        </View>
      </ImageBackground>

      {/* Les quartiers de la course, dans l'ordre où on les traverse. */}
      <View style={styles.chapters}>
        {CHAPTERS.map((chapter) => {
          const reached = rank.level >= chapter.level;
          const current = chapter.id === here.id;
          return (
            <View
              key={chapter.id}
              style={styles.chapter}
              onLayout={
                current
                  ? (event) => {
                      const { x, width } = event.nativeEvent.layout;
                      setBeakX(x + width / 2);
                    }
                  : undefined
              }
              accessible
              accessibilityLabel={
                reached
                  ? `${DISTRICTS[chapter.id].label}${current ? ', départ de la course' : ''}`
                  : `${DISTRICTS[chapter.id].label}, à partir du niveau ${chapter.level}`
              }
            >
              <View style={[styles.chapterDisc, reached ? styles.chapterOn : styles.chapterOff]}>
                <Image
                  source={DISTRICT_ICONS[chapter.id]}
                  resizeMode="contain"
                  style={styles.chapterIcon}
                  accessible={false}
                  importantForAccessibility="no"
                />
              </View>
              <Text style={[styles.chapterName, !reached && styles.chapterNameOff]} numberOfLines={1}>
                {reached ? DISTRICTS[chapter.id].label : `🔒 Niv ${chapter.level}`}
              </Text>
            </View>
          );
        })}
      </View>

      {/* La course. C'est la carte la plus haute, la plus large, et la seule
          dont le bouton est doré : rien d'autre sur cet écran ne doit
          ressembler à ce bouton-là. */}
      <View style={styles.runWrap}>
        {/* Le bec « tu es ici ». Il appartient au CADRE de la carte, dont il
            reprend les deux teintes — le liseré d'or dehors, le parchemin
            dedans — et il déborde vers le haut jusque sous le médaillon du
            quartier atteint. C'est ce qui rattache la course au quartier :
            une flèche flottante, elle, n'aurait désigné personne. */}
        {beakX !== null && (
          <View pointerEvents="none" style={[styles.beak, { left: beakX - BEAK / 2 }]}>
            <View style={styles.beakEdge} />
            <View style={styles.beakFace} />
          </View>
        )}

        <Card style={styles.run} selected>
          <Plaque title="La course sacrée" tone="frame" />

          <Banner source={ART.course} height={82} />

          <View style={styles.runBody}>
            <GodBadge color={appearance.color} accent={appearance.accent} size={58} />
            <View style={styles.runText}>
              <Text style={styles.runGod} numberOfLines={1}>
                {god.label}
              </Text>
              <Text style={styles.runDomain} numberOfLines={1}>
                {god.domain}
              </Text>
            </View>
          </View>

          <View style={styles.rewards}>
            <Text style={styles.rewardsLabel}>RÉCOMPENSE</Text>
            <View style={styles.reward}>
              <Coin size={14} />
              <Text style={styles.rewardText}>1 or pour 3 fidèles</Text>
            </View>
          </View>

          {/* La plaque « CONTINUER » ne s'affiche qu'à qui a DÉJÀ couru : son
              mot est gravé dans l'image, et personne ne continue une course
              qu'il n'a pas commencée. La première partie garde donc le bouton
              d'or, qui dit « Jouer ». */}
          {state.bestScore > 0 ? (
            <Plate
              testID="play"
              source={PLATES.continuer}
              onPress={onPlay}
              hint={`Continuer avec ${god.label}`}
            />
          ) : (
            <Button
              testID="play"
              label="Jouer"
              variant="primary"
              size="big"
              onPress={onPlay}
              hint={`Lancer une course avec ${god.label}`}
            />
          )}
        </Card>
      </View>

      <Soon
        icon="⚔️"
        title="Arène en ligne"
        text="Affronter un autre joueur, en direct. Le mode n'est pas encore écrit."
      >
        <Banner source={ART.arene} height={104} />

        {/* La plaque de l'arène, ÉTEINTE. Elle annonce l'appel du mode sans
            le promettre : la pastille « bientôt » reste juste au-dessus, et
            le bouton refuse le doigt plutôt que de mener nulle part. */}
        <Plate
          testID="find-match"
          source={PLATES.match}
          onPress={() => undefined}
          disabled
          hint="L'arène en ligne n'est pas encore jouable"
        />
      </Soon>
      <Soon
        icon="⏳"
        title="Défi de la semaine"
        text="Un parcours imposé, un classement, une récompense. Bientôt."
      />
    </ScrollView>
  );
}

/** Une carte de mode annoncé mais pas encore jouable. Éteinte, et honnête. */
function Soon({
  icon,
  title,
  text,
  children,
}: {
  icon: string;
  title: string;
  text: string;
  /** L'appel du mode, s'il en a un — toujours éteint, comme la carte. */
  children?: ReactNode;
}) {
  return (
    <Card style={styles.soon}>
      <View style={styles.soonHead}>
        <Text style={styles.soonIcon}>{icon}</Text>
        <Text style={styles.soonTitle} numberOfLines={1}>
          {title.toUpperCase()}
        </Text>
        <Text style={styles.soonTag}>BIENTÔT</Text>
      </View>
      <Text style={styles.soonText}>{text}</Text>
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingVertical: SPACE.sm, gap: SPACE.md, paddingBottom: SPACE.xl },

  // Le cadre dessiné remplace le parchemin ET la bordure de la carte. Il est
  // assez HAUT pour porter les trois lignes du rang — l'aigle et le niveau,
  // la jauge, le meilleur cortège — sans que la dernière frôle le bord bas :
  // c'est le bloc d'état du joueur, et il se lit d'un regard ou pas du tout.
  //
  // Tout y est CENTRÉ, en colonne. Avec l'aigle à gauche et rien à droite, un
  // rang aurait penché ; c'est d'ailleurs ce que la caisse à outils tenait en
  // équilibre, et elle n'annonçait rien.
  // ⚠️ SANS marge intérieure — elle appartient à `leagueInner`, un cran plus
  // bas (voir le commentaire du rendu). Le dessin de fond se mesure sur ce
  // conteneur-ci : lui donner une marge le rétrécissait sur téléphone.
  league: { minHeight: 146, justifyContent: 'center' },
  // ⚠️ Ces marges ne sont pas décoratives, elles sont MESURÉES sur le
  // dessin. Les ferrures d'angle du cadre mordent sur un seizième de sa
  // largeur et sur un sixième de sa hauteur ; en deçà, la jauge passe
  // dessous et le meilleur cortège vient buter sur le bord bas. On garde
  // donc le double de leur emprise, pour que rien n'affleure jamais.
  leagueInner: {
    gap: SPACE.sm,
    paddingVertical: SPACE.xl + SPACE.sm,
    paddingHorizontal: SPACE.xxl + SPACE.sm,
    justifyContent: 'center',
  },
  // ⚠️ Les trois lignes comptent. Sans `width`/`height`, l'image de fond
  // garde sa taille NATIVE — 512 points de large — et sort du cadre par la
  // droite ; et `stretch` se pose ici EN PLUS de la prop `resizeMode` du
  // rendu : le style n'atteint pas l'image sur iOS, la prop ne l'atteint pas
  // sur le web. Étirer convient à ce dessin : il n'a pas de sujet, juste des
  // coins ferrés qu'un cinquième de largeur en moins ne déforme pas.
  leagueFrame: {
    width: '100%',
    height: '100%',
    resizeMode: 'stretch',
    borderRadius: RADIUS.sm,
  },
  // `position: relative` : le repère du blason, posé hors flux (voir
  // plus haut). Sans lui, son `absolute` se poserait sur la carte entière.
  leagueHead: { position: 'relative', minHeight: 22, justifyContent: 'center' },
  leagueCrest: { position: 'absolute', left: 0, top: 0, fontSize: 20, width: 20, textAlign: 'center' },
  // ⚠️ `letterSpacing` retombe à 0.6 : celui de `TYPE.label` (1,4) est taillé
  // pour un intitulé de section, court. Sur les vingt-sept lettres de ce
  // titre-ci, il ajoute à lui seul près de 40 points et pousse le rang à
  // deux chiffres hors de sa ligne.
  leagueName: {
    ...TYPE.label,
    fontSize: 12,
    letterSpacing: 0.6,
    color: COLORS.text,
    textAlign: 'center',
  },
  leagueSub: { ...TYPE.body, fontSize: 12, color: COLORS.muted, textAlign: 'center' },

  chapters: { flexDirection: 'row', justifyContent: 'space-between', gap: SPACE.sm },
  chapter: { flex: 1, alignItems: 'center', gap: SPACE.xs },
  chapterDisc: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  chapterOn: { backgroundColor: COLORS.panelRaised, borderColor: COLORS.gold },
  chapterOff: { backgroundColor: COLORS.panelSunken, borderColor: COLORS.frame, opacity: 0.7 },
  // Le médaillon remplit son disque, moins le liseré : il porte déjà son
  // propre cadre, et les deux se chevaucheraient.
  chapterIcon: { width: 44, height: 44 },
  chapterName: { ...TYPE.tiny, fontSize: 9, color: COLORS.text, textAlign: 'center' },
  chapterNameOff: { color: COLORS.locked },

  // Le bec sort de la carte : son enveloppe ne doit donc RIEN rogner, et
  // c'est elle qui donne au bec son repère horizontal.
  runWrap: { position: 'relative' },
  // Deux triangles, dessinés avec les bordures — la seule façon d'obtenir un
  // angle en React Native, qui ne connaît que des rectangles (même procédé
  // que le fronton du temple, dans `MenuScreen`). Le premier porte l'or du
  // liseré, le second le parchemin, et il descend assez bas pour recouvrir la
  // bordure du haut : le bec s'ouvre alors sur la carte au lieu d'être posé
  // dessus.
  beak: { position: 'absolute', top: -BEAK_H, width: BEAK, height: BEAK_H + 3 },
  beakEdge: {
    position: 'absolute',
    top: 0,
    width: 0,
    height: 0,
    borderLeftWidth: BEAK / 2,
    borderRightWidth: BEAK / 2,
    borderBottomWidth: BEAK_H,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: COLORS.borderStrong,
  },
  beakFace: {
    position: 'absolute',
    top: 5,
    left: 4,
    width: 0,
    height: 0,
    borderLeftWidth: BEAK / 2 - 4,
    borderRightWidth: BEAK / 2 - 4,
    borderBottomWidth: BEAK_H - 2,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: COLORS.panelRaised,
  },

  run: { gap: SPACE.md },
  runBody: { flexDirection: 'row', alignItems: 'center', gap: SPACE.md, marginTop: SPACE.md },
  runText: { flex: 1, minWidth: 0 },
  runGod: { ...TYPE.title, color: COLORS.text },
  runDomain: { ...TYPE.body, fontSize: 12, color: COLORS.muted },

  rewards: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.sm,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.panelSunken,
  },
  rewardsLabel: { ...TYPE.label, fontSize: 9, color: COLORS.muted },
  reward: { flexDirection: 'row', alignItems: 'center', gap: SPACE.xs },
  rewardText: { ...TYPE.body, fontSize: 12, color: COLORS.text },

  soon: { opacity: 0.85, gap: SPACE.xs },
  soonHead: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  soonIcon: { fontSize: 20 },
  soonTitle: { ...TYPE.label, fontSize: 11, color: COLORS.muted, flex: 1 },
  soonTag: {
    ...TYPE.tiny,
    fontSize: 9,
    color: COLORS.onDark,
    backgroundColor: COLORS.frameDark,
    paddingHorizontal: SPACE.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
  },
  soonText: { ...TYPE.body, fontSize: 12, color: COLORS.muted, lineHeight: 17 },
});
