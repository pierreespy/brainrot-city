/**
 * QuetesTab.tsx — les travaux : ce que le joueur a entrepris, et où il en est.
 *
 * ⚠️ Aucune quête n'est STOCKÉE, et c'est tout le principe. Chacune se déduit
 * de ce que la sauvegarde garde déjà — le meilleur cortège, l'or, les dieux
 * acquis — exactement comme le niveau se déduit du score (voir `rank.ts`). Un
 * joueur qui ouvre cet onglet pour la première fois y trouve donc l'avance
 * qu'il a réellement prise, et non quatre barres à zéro.
 *
 * ⚠️ Une quête ne se RÉCLAME pas encore. Rien ici ne promet une récompense :
 * il n'existe aucun moyen d'en accorder une, et une pastille « + 200 or » qui
 * ne donne rien vaut moins qu'un objectif franc. Le jour où les récompenses
 * existeront, elles s'ajouteront sous chaque ligne, et `done` dira quoi
 * verser. Même règle que l'arène et la voie divine : on affiche ce qui est
 * vrai, on annonce le reste.
 */

import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Progression } from '../../meta/progression';
import { rankOf } from '../../meta/rank';
import { Bar, Card, Coin, Laurel, Plaque, SectionTitle } from './parts';
import { COLORS, SPACE, TYPE } from './theme';

/** Une quête : un intitulé, un but, et de quoi lire l'avance dans l'état. */
interface Quest {
  id: string;
  label: string;
  /** Ce que la quête apprend du jeu — lu sous l'intitulé. */
  note: string;
  /** L'avance, et le but. Les deux se comptent dans la même unité. */
  done: number;
  goal: number;
  /** Le jeton posé à gauche, quand la quête parle d'une monnaie. */
  tone?: 'gold' | 'laurel';
}

/**
 * Les travaux, du plus proche au plus lointain.
 *
 * ⚠️ Ils sont ordonnés par ce qu'ils demandent, pas par thème : le premier
 * se termine en une course, le dernier en une saison. C'est ce qui donne
 * envie de lire la liste jusqu'en bas plutôt que de s'arrêter à la première.
 */
function questsOf(state: Progression): { near: Quest[]; far: Quest[] } {
  const rank = rankOf(state.bestScore);
  return {
    near: [
      {
        id: 'first-run',
        label: 'Mener un premier cortège',
        note: 'Convertis cinquante mortels dans une même course.',
        done: Math.min(state.bestScore, 50),
        goal: 50,
      },
      {
        id: 'purse',
        label: 'Emplir la bourse',
        note: 'Un fidèle sur trois laisse une pièce derrière lui.',
        done: Math.min(state.gold, 500),
        goal: 500,
        tone: 'gold',
      },
    ],
    far: [
      {
        id: 'rank',
        label: 'Monter au dixième rang',
        note: `Rang ${rank.level} pour l'instant — il suit le meilleur cortège.`,
        done: Math.min(rank.level, 10),
        goal: 10,
      },
      {
        id: 'pantheon',
        label: 'Réunir trois divinités',
        note: 'Les autres s’achètent au panthéon, en or.',
        done: Math.min(state.ownedGods.length, 3),
        goal: 3,
      },
      {
        id: 'laurels',
        label: 'Gagner un premier laurier',
        note: 'La monnaie des dieux ne se ramasse pas dans la rue.',
        done: Math.min(state.laurels, 1),
        goal: 1,
        tone: 'laurel',
      },
    ],
  };
}

export function QuetesTab({ state }: { state: Progression }) {
  const { near, far } = questsOf(state);
  const all = [...near, ...far];
  const finished = all.filter((q) => q.done >= q.goal).length;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    >
      <Plaque title="Quêtes" />

      <Card style={styles.tally}>
        <Text style={styles.tallyText}>
          {finished === all.length
            ? 'Toutes les quêtes sont accomplies. La suite viendra avec la saison.'
            : `${finished} quête${finished > 1 ? 's' : ''} accomplie${
                finished > 1 ? 's' : ''
              } sur ${all.length}.`}
        </Text>
      </Card>

      <SectionTitle>À portée</SectionTitle>
      {near.map((quest) => (
        <QuestRow key={quest.id} quest={quest} />
      ))}

      <SectionTitle>De longue haleine</SectionTitle>
      {far.map((quest) => (
        <QuestRow key={quest.id} quest={quest} />
      ))}

      <Text style={styles.footer}>
        Les quêtes se lisent sur ta progression : elles avancent toutes seules,
        au fil des courses. Les récompenses viendront avec le système qui saura
        les verser.
      </Text>
    </ScrollView>
  );
}

/**
 * Une ligne de quête : le but, l'avance, et la coche quand c'est fini.
 *
 * La jauge porte le compte EN TOUTES LETTRES par-dessus elle — un joueur veut
 * savoir combien il lui reste, pas estimer une longueur à l'œil.
 */
function QuestRow({ quest }: { quest: Quest }) {
  const done = quest.done >= quest.goal;
  return (
    <Card style={[styles.quest, done && styles.questDone]}>
      <View style={styles.questHead}>
        {quest.tone === 'gold' && <Coin size={20} />}
        {quest.tone === 'laurel' && <Laurel size={20} />}
        <Text style={[styles.questLabel, done && styles.questLabelDone]} numberOfLines={1}>
          {quest.label}
        </Text>
        {done && <Text style={styles.questCheck}>✓</Text>}
      </View>
      <Text style={styles.questNote}>{quest.note}</Text>
      <Bar
        value={quest.done}
        max={quest.goal}
        tone={quest.tone === 'laurel' ? 'laurel' : 'gold'}
        label={`${quest.done.toLocaleString('fr-FR')} / ${quest.goal.toLocaleString('fr-FR')}`}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingVertical: SPACE.sm, gap: SPACE.sm, paddingBottom: SPACE.xl },

  tally: { paddingVertical: SPACE.sm },
  tallyText: { ...TYPE.body, fontSize: 13, color: COLORS.text, textAlign: 'center' },

  quest: { gap: SPACE.xs },
  // Une quête finie s'éteint : elle a déjà été lue, et la place appartient
  // désormais à celles qui restent.
  questDone: { opacity: 0.75 },
  questHead: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  questLabel: { ...TYPE.title, fontSize: 15, color: COLORS.text, flex: 1, minWidth: 0 },
  questLabelDone: { color: COLORS.muted },
  questCheck: { ...TYPE.banner, fontSize: 16, color: COLORS.done },
  questNote: { ...TYPE.body, fontSize: 12, color: COLORS.muted, lineHeight: 16 },

  footer: {
    ...TYPE.body,
    fontSize: 12,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 17,
    marginTop: SPACE.sm,
  },
});
