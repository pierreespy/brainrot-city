/**
 * Stats.tsx — l'affichage de debug : ce que coûte une image, sur l'appareil.
 *
 * Le banc de mesure (`npm run bench`) dit ce que coûte le jeu sur une machine
 * de développement. Il ne dit RIEN de ce qu'il coûte sur le téléphone du
 * joueur — or c'est la seule mesure qui compte, et on ne peut pas brancher un
 * profileur sur Expo Go. D'où ce panneau : **touche le compteur de fidèles
 * pour l'afficher**, sur le téléphone comme sur le banc web.
 *
 * Il se lit de haut en bas :
 *
 *   - **fps** — ce que voit le joueur ;
 *   - **image** — la durée réelle d'une image, attente de l'écran comprise ;
 *   - **calcul** — ce que NOTRE code consomme là-dedans. Si « calcul » est
 *     petit et « image » grand, le goulot est l'affichage, pas la logique :
 *     c'est exactement ce qui s'est passé au banc de test web, dont les 17 fps
 *     venaient de son GPU logiciel et non du jeu.
 *   - **le détail par étape**, puis les silhouettes réellement envoyées au
 *     GPU sur le nombre existant, et les **triangles** comptés par Three.js
 *     lui-même — la mesure de la Milestone 9.
 *
 * Comme le HUD, ce panneau n'est PAS redessiné à chaque image : il est
 * rafraîchi deux fois par seconde (`profiler.publishInterval`).
 */

import { StyleSheet, Text, View } from 'react-native';
import type { GameStats } from '../core/Game';

interface Props {
  stats: GameStats | null;
}

export function Stats({ stats }: Props) {
  if (stats === null) return null;

  const { profile } = stats;

  return (
    <View style={styles.root} pointerEvents="none">
      <Row label="fps" value={profile.fps.toFixed(0)} strong />
      <Row label="image" value={`${profile.frameMs.toFixed(1)} ms`} />
      <Row label="calcul" value={`${profile.cpuMs.toFixed(2)} ms`} strong />

      <View style={styles.separator} />

      {profile.steps.map((step) => (
        <Row key={step.name} label={step.name} value={step.ms.toFixed(2)} dim />
      ))}

      <View style={styles.separator} />

      <Row label="mortels" value={`${stats.drawnMortals} / ${stats.mortals}`} dim />
      <Row label="fidèles" value={`${stats.drawnFollowers} / ${stats.followers}`} dim />
      <Row label="triangles" value={`${(stats.triangles / 1000).toFixed(1)}k`} dim />
      {/* Le dieu joué (M12). Tant qu'il n'y a pas d'écran de sélection (M13)
          ni d'apparence propre (M14), c'est le seul endroit où il se voit. */}
      <Row label="dieu" value={stats.god} dim />
    </View>
  );
}

function Row({
  label,
  value,
  strong,
  dim,
}: {
  label: string;
  value: string;
  strong?: boolean;
  dim?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.label, dim === true && styles.dim]}>{label}</Text>
      <Text style={[styles.value, strong === true && styles.strong, dim === true && styles.dim]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 16,
    top: 76,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    minWidth: 148,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  label: { color: 'rgba(255, 255, 255, 0.75)', fontSize: 12 },
  // `textAlign: right` plutôt qu'une police à chasse fixe : les chiffres
  // restent alignés sans dépendre des polices installées sur l'appareil.
  value: { color: '#fff', fontSize: 12, textAlign: 'right' },
  strong: { color: '#7dd3fc', fontWeight: '700' },
  dim: { color: 'rgba(255, 255, 255, 0.55)' },
  separator: {
    height: 1,
    marginVertical: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
});
