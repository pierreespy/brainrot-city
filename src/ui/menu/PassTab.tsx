/**
 * PassTab.tsx — le passe de combat : deux voies, une seule échelle.
 *
 * L'écran est un TABLEAU couché : une colonne par palier, la voie gratuite
 * au-dessus de la règle des niveaux, la voie payante en dessous. On le lit
 * de gauche à droite comme une frise, et le doigt le fait défiler
 * horizontalement — le palier courant est amené en vue à l'ouverture.
 *
 * ⚠️ Les récompenses ne sont PAS tirées au hasard : elles se déduisent du
 * numéro de palier (voir `rewardAt`). C'est ce qui permet d'afficher la même
 * frise à chaque ouverture, sans rien stocker, et de la faire grandir en
 * changeant une seule fonction.
 *
 * ⚠️ La voie divine s'achète, donc elle est INERTE tant que la monétisation
 * n'existe pas (M46) — comme les paquets de la boutique. Le bouton le dit
 * plutôt que de faire semblant.
 */

import { useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Progression } from '../../meta/progression';
import { rankOf } from '../../meta/rank';
import { Bar, Button, Card, Coin, Tile } from './parts';
import { COLORS, SPACE, TYPE } from './theme';

/** Le nombre de paliers d'une saison. */
const STEPS = 50;

/** La largeur d'une colonne de la frise, casiers compris. */
const COLUMN = 66;

/** Les chiffres romains, pour numéroter les paliers comme une stèle. */
function roman(value: number): string {
  const table: [number, string][] = [
    [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let rest = value;
  let out = '';
  for (const [n, sign] of table) {
    while (rest >= n) {
      out += sign;
      rest -= n;
    }
  }
  return out;
}

/**
 * Ce que rapporte un palier, sur chaque voie.
 *
 * Un rythme fixe et lisible : la voie divine donne toujours mieux, et les
 * paliers ronds (5, 10, 15…) portent la pièce montée — c'est ce qui donne
 * envie d'aller « jusqu'au prochain dizainier » plutôt que d'abandonner.
 */
function rewardAt(step: number, divine: boolean): { icon: string; count: number } {
  const milestone = step % 5 === 0;
  if (divine) {
    if (step % 25 === 0) return { icon: '👑', count: 1 };
    if (milestone) return { icon: '🗝️', count: 2 };
    if (step % 3 === 0) return { icon: '🏺', count: 1 };
    return { icon: '💰', count: 3 };
  }
  if (milestone) return { icon: '🧰', count: 1 };
  if (step % 3 === 0) return { icon: '🧪', count: 1 };
  return { icon: '💰', count: 1 };
}

/** Les jours qui restent avant la fin du mois — la saison suit le calendrier. */
function daysLeftInSeason(now: Date): number {
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86_400_000));
}

export function PassTab({ state }: { state: Progression }) {
  const rank = rankOf(state.bestScore);
  const step = Math.min(STEPS, rank.level);
  const days = daysLeftInSeason(new Date());

  // La frise s'ouvre SUR le palier courant, pas au début : sans cela, un
  // joueur au palier 14 verrait toujours des cases déjà prises.
  const friseRef = useRef<ScrollView | null>(null);
  const startX = Math.max(0, (step - 2) * COLUMN);

  return (
    <View style={styles.root}>
      <Card style={styles.board}>
        <View style={styles.tracks}>
          <View style={styles.spine}>
            <Text style={styles.spineText}>VOIE DES MORTELS</Text>
            <Text style={styles.spineText}>VOIE DIVINE</Text>
          </View>

          <ScrollView
            ref={friseRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: startX, y: 0 }}
            onContentSizeChange={() => friseRef.current?.scrollTo({ x: startX, animated: false })}
            nestedScrollEnabled
          >
            <View>
              <View style={styles.line}>
                {Array.from({ length: STEPS }, (_, i) => i + 1).map((n) => {
                  const reward = rewardAt(n, false);
                  return (
                    <View key={n} style={styles.slot}>
                      <Tile icon={reward.icon} count={reward.count} state={n <= step ? 'taken' : 'locked'} size={44} />
                    </View>
                  );
                })}
              </View>

              {/* La règle des paliers, entre les deux voies : c'est elle qui
                  dit où l'on en est, et les deux voies s'y accrochent. */}
              <View style={styles.ruler}>
                {Array.from({ length: STEPS }, (_, i) => i + 1).map((n) => (
                  <View key={n} style={[styles.notch, n === step && styles.notchNow]}>
                    <Text style={[styles.notchText, n === step && styles.notchTextNow]}>{roman(n)}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.line}>
                {Array.from({ length: STEPS }, (_, i) => i + 1).map((n) => {
                  const reward = rewardAt(n, true);
                  return (
                    <View key={n} style={styles.slot}>
                      {/* Tout est verrouillé sur la voie divine : elle n'est
                          pas achetée, et elle ne peut pas encore l'être. */}
                      <Tile icon={reward.icon} count={reward.count} state="locked" size={44} />
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </View>
      </Card>

      <View style={styles.footer}>
        <Bar value={rank.progress} max={rank.needed} label={`Palier ${step} — ${rank.progress} / ${rank.needed}`} />

        <Button
          label="Activer la voie divine"
          variant="primary"
          size="big"
          disabled
          price={
            <>
              <Coin size={14} />
              <Text style={styles.price}>1 000</Text>
            </>
          }
          onPress={() => undefined}
          hint="La voie divine n'est pas encore achetable"
        />

        <Text style={styles.season}>
          La saison se termine dans {days} {days > 1 ? 'jours' : 'jour'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: SPACE.sm, gap: SPACE.md },

  board: { flex: 1, paddingHorizontal: SPACE.xs },
  tracks: { flex: 1, flexDirection: 'row', gap: SPACE.xs },

  // L'intitulé des deux voies, écrit une seule fois à gauche : le répéter à
  // chaque colonne mangerait la moitié de la frise.
  spine: { width: 20, justifyContent: 'space-around', alignItems: 'center' },
  spineText: {
    ...TYPE.tiny,
    fontSize: 8,
    color: COLORS.frameDeep,
    width: 120,
    textAlign: 'center',
    transform: [{ rotate: '-90deg' }],
  },

  line: { flexDirection: 'row', paddingVertical: SPACE.sm },
  slot: { width: COLUMN, alignItems: 'center' },

  ruler: {
    flexDirection: 'row',
    backgroundColor: COLORS.panelSunken,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: COLORS.frameDark,
  },
  notch: { width: COLUMN, alignItems: 'center', paddingVertical: 5 },
  notchNow: { backgroundColor: COLORS.gold },
  notchText: { ...TYPE.tiny, color: COLORS.muted },
  notchTextNow: { color: COLORS.onGold },

  footer: { gap: SPACE.sm, paddingBottom: SPACE.md },
  price: { ...TYPE.price, fontSize: 13, color: COLORS.onGold },
  season: { ...TYPE.body, fontSize: 12, color: COLORS.text, textAlign: 'center' },
});
