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

import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { godById } from '../../entities/gods/roster';
import { DISTRICTS } from '../../world/districts';
import { appearanceOf, type Progression } from '../../meta/progression';
import { rankOf } from '../../meta/rank';
import { Bar, Button, Card, Coin, GodBadge, Plaque } from './parts';
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
const CHAPTERS = [
  { id: 'agora', icon: '🏛️', level: 1 },
  { id: 'port', icon: '⚓', level: 5 },
  { id: 'boisSacre', icon: '🌲', level: 15 },
  { id: 'acropole', icon: '🔥', level: 30 },
] as const;

export function PlayTab({ state, onPlay, onChangeGod }: Props) {
  const god = godById(state.selectedGod);
  const appearance = appearanceOf(state);
  const rank = rankOf(state.bestScore);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    >
      {/* Le rang. Il tient en une ligne parce qu'il ne se joue pas : il se
          constate, et il se compare à la partie d'hier. */}
      <Card style={styles.league}>
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
      </Card>

      {/* Les quartiers de la course, dans l'ordre où on les traverse. */}
      <View style={styles.chapters}>
        {CHAPTERS.map((chapter) => {
          const reached = rank.level >= chapter.level;
          return (
            <View key={chapter.id} style={styles.chapter}>
              <View style={[styles.chapterDisc, reached ? styles.chapterOn : styles.chapterOff]}>
                <Text style={styles.chapterIcon}>{chapter.icon}</Text>
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
      <Card style={styles.run} selected>
        <Plaque title="La course sacrée" tone="gold" />

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
            <Text style={styles.rewardText}>1 drachme pour 3 fidèles</Text>
          </View>
        </View>

        <Button testID="play" label="Jouer" variant="primary" size="big" onPress={onPlay} hint={`Lancer une course avec ${god.label}`} />
        <Button label="Changer de divinité" onPress={onChangeGod} style={styles.change} />
      </Card>

      <Soon
        icon="⚔️"
        title="Arène en ligne"
        text="Affronter un autre joueur, en direct. Le mode n'est pas encore écrit."
      />
      <Soon
        icon="⏳"
        title="Défi de la semaine"
        text="Un parcours imposé, un classement, une récompense. Bientôt."
      />
    </ScrollView>
  );
}

/** Une carte de mode annoncé mais pas encore jouable. Éteinte, et honnête. */
function Soon({ icon, title, text }: { icon: string; title: string; text: string }) {
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
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingVertical: SPACE.sm, gap: SPACE.md, paddingBottom: SPACE.xl },

  league: { gap: SPACE.sm },
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
  chapterIcon: { fontSize: 24 },
  chapterName: { ...TYPE.tiny, fontSize: 9, color: COLORS.text, textAlign: 'center' },
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
