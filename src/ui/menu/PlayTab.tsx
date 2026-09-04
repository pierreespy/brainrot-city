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

import type { ReactNode } from 'react';
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
  /** Emmène au panthéon : changer de divinité se fait là-bas, pas ici. */
  onChangeGod: () => void;
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

export function PlayTab({ state, onPlay, onChangeGod }: Props) {
  const god = godById(state.selectedGod);
  const appearance = flatColorOf(state);
  const rank = rankOf(state.bestScore);

  // Le quartier où l'on en est : le DERNIER dont le niveau est franchi. Les
  // chapitres sont rangés par niveau croissant, donc c'est le plus avancé des
  // atteints — jamais celui d'après, qui n'est pas encore une étape.
  const here = [...CHAPTERS].reverse().find((c) => rank.level >= c.level) ?? CHAPTERS[0];

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
      <ImageBackground source={ART.ligue} style={styles.league} imageStyle={styles.leagueFrame}>
        <View style={styles.leagueHead}>
          <Text style={styles.leagueCrest}>🦅</Text>
          <View style={styles.leagueText}>
            <Text style={styles.leagueName} numberOfLines={1}>
              LIGUE OLYMPIENNE : NIVEAU {rank.level}
            </Text>
            <Bar value={rank.progress} max={rank.needed} label={`${rank.progress} / ${rank.needed} fidèles`} />
          </View>
          <Text style={styles.leagueChest}>🧰</Text>
        </View>
        <Text style={styles.leagueSub}>
          {state.bestScore > 0
            ? `Meilleur cortège : ${state.bestScore.toLocaleString('fr-FR')} fidèles`
            : "Aucune course encore : le premier cortège fixera le rang."}
        </Text>
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
              accessible
              accessibilityLabel={
                reached
                  ? `${DISTRICTS[chapter.id].label}${current ? ', quartier en cours' : ''}`
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
              {/* La flèche « tu es ici ». Elle pointe VERS LE HAUT, vers le
                  médaillon : posée sous l'intitulé, elle désigne la colonne
                  entière sans se glisser entre le disque et son nom. Un seul
                  quartier la porte, sinon elle ne désigne plus rien. */}
              {current && <View style={styles.hereArrow} />}
            </View>
          );
        })}
      </View>

      {/* La course. C'est la carte la plus haute, la plus large, et la seule
          dont le bouton est doré : rien d'autre sur cet écran ne doit
          ressembler à ce bouton-là. */}
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
            <Text style={styles.runPitch}>
              Traverse la cité, convertis les mortels, fais grossir ton cortège.
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
        <Plate
          source={PLATES.divinite}
          onPress={onChangeGod}
          hint="Changer de divinité"
          style={styles.change}
        />
      </Card>

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

  // Le cadre dessiné remplace le parchemin ET la bordure de la carte : les
  // marges tiennent compte des coins ferrés, qui mordent sur l'intérieur.
  league: { gap: SPACE.sm, paddingVertical: SPACE.md, paddingHorizontal: SPACE.lg },
  // ⚠️ Les trois lignes comptent. Sans `width`/`height`, l'image de fond
  // garde sa taille NATIVE — 512 points de large — et sort du cadre par la
  // droite ; et `stretch` se pose ici, pas en `resizeMode` sur la balise, où
  // il n'atteint pas l'image sur le web. Étirer convient à ce dessin : il n'a
  // pas de sujet, juste des coins ferrés qu'un cinquième de largeur en moins
  // ne déforme pas.
  leagueFrame: {
    width: '100%',
    height: '100%',
    resizeMode: 'stretch',
    borderRadius: RADIUS.sm,
  },
  leagueHead: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  leagueCrest: { fontSize: 30 },
  leagueChest: { fontSize: 24 },
  leagueText: { flex: 1, minWidth: 0, gap: SPACE.xs },
  leagueName: { ...TYPE.label, fontSize: 11, color: COLORS.text },
  leagueSub: { ...TYPE.body, fontSize: 12, color: COLORS.muted },

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
  // Un triangle, dessiné avec les bordures — la seule façon d'obtenir un
  // angle en React Native, qui ne connaît que des rectangles (même procédé
  // que le fronton du temple, dans `MenuScreen`).
  hereArrow: {
    marginTop: 3,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: COLORS.frameDeep,
  },
  chapterNameOff: { color: COLORS.locked },

  run: { gap: SPACE.md },
  runBody: { flexDirection: 'row', alignItems: 'center', gap: SPACE.md, marginTop: SPACE.md },
  runText: { flex: 1, minWidth: 0 },
  runGod: { ...TYPE.title, color: COLORS.text },
  runDomain: { ...TYPE.body, fontSize: 12, color: COLORS.muted },
  runPitch: { ...TYPE.body, fontSize: 13, color: COLORS.text, marginTop: SPACE.xs, lineHeight: 18 },

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
  change: { marginTop: -SPACE.xs },

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
