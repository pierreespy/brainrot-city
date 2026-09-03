/**
 * Hud.tsx — l'interface posée par-dessus la 3D.
 *
 * Elle ne connaît RIEN du jeu : elle reçoit un nombre et une fonction à
 * appeler. C'est ce qui permet de la redessiner sans jamais toucher au moteur,
 * et de la tester sans lancer de partie.
 *
 * Elle est en React Native, pas en 3D : du texte net à la résolution de
 * l'écran, et un coût quasi nul tant qu'on ne la redessine pas à chaque image
 * (voir `hud.scorePublishInterval` dans `config.ts`).
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  /** Le nombre de fidèles du cortège. */
  faithful: number;
  /** Le quartier traversé — vide tant que le jeu n'a rien annoncé. */
  district: string;
  onRestart: () => void;
  /**
   * Toucher le compteur affiche les mesures de performance (Milestone 9).
   *
   * Il n'y a pas de bouton dédié : l'écran d'un téléphone est petit, et une
   * commande de debug n'a pas à occuper une place que le jeu utilisera.
   */
  onToggleStats: () => void;
}

export function Hud({ faithful, district, onRestart, onToggleStats }: Props) {
  return (
    // `box-none` : cette couche laisse passer les doigts vers le joystick,
    // sauf sur ses propres boutons. Sans cela, l'interface avalerait tout
    // l'écran et le jeu deviendrait injouable.
    <SafeAreaView style={styles.root} pointerEvents="box-none">
      <View style={styles.topRow} pointerEvents="box-none">
        <Pressable testID="score-toggle" onPress={onToggleStats} style={styles.score}>
          <Text style={styles.scoreValue} testID="score">
            {faithful}
          </Text>
          <Text style={styles.scoreLabel}>
            {faithful > 1 ? 'fidèles' : 'fidèle'}
          </Text>
        </Pressable>

        <Pressable
          testID="restart"
          onPress={onRestart}
          style={({ pressed }) => [styles.restart, pressed && styles.restartPressed]}
          hitSlop={12}
        >
          <Text style={styles.restartIcon}>↻</Text>
        </Pressable>
      </View>

      {/*
        Le quartier traversé (Milestone 11). Il s'affiche sous le compteur,
        discrètement : c'est un repère, pas une information à surveiller.
      */}
      {district !== '' && (
        <View style={styles.district} pointerEvents="none">
          <Text style={styles.districtText} testID="district">
            {district}
          </Text>
        </View>
      )}

      {/*
        Emplacement RÉSERVÉ à la capacité divine (Milestone 19).
        Il est affiché éteint dès maintenant, à dessein : décider de sa place
        après coup obligerait à redessiner tout le HUD, et le pouce du joueur
        a déjà pris ses habitudes. Il n'est pas cliquable tant qu'aucune
        capacité n'existe.
      */}
      <View style={styles.abilitySlot} pointerEvents="none">
        <Text style={styles.abilityIcon}>⚡</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject },

  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  score: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  scoreValue: { color: '#fff', fontSize: 30, fontWeight: '800' },
  scoreLabel: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 13, fontWeight: '600' },

  restart: {
    width: 44, // 44 points : la taille minimale confortable pour un pouce.
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  restartPressed: { backgroundColor: 'rgba(125, 211, 252, 0.35)' },
  restartIcon: { color: '#fff', fontSize: 22, lineHeight: 26 },

  abilitySlot: {
    position: 'absolute',
    right: 20,
    bottom: 36,
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  abilityIcon: { fontSize: 26, opacity: 0.25 },

  district: {
    alignSelf: 'center',
    marginTop: 10,
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  districtText: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
});
