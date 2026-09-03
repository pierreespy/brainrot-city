/**
 * PlayTab.tsx — l'onglet « Jouer ».
 *
 * Un seul but : lancer une partie. Tout ce qu'il montre d'autre — le dieu
 * choisi, sa capacité, le record — sert à rendre ce bouton attirant, pas à
 * occuper l'écran. C'est le seul onglet que le joueur pressé regarde.
 */

import { StyleSheet, Text, View } from 'react-native';
import { godById } from '../../entities/gods/roster';
import { appearanceOf, type Progression } from '../../meta/progression';
import { Button, Card, GodBadge, SectionTitle } from './parts';
import { COLORS, SPACE, TEXT_SHADOW, TYPE } from './theme';

interface Props {
  state: Progression;
  onPlay: () => void;
  onOpenSettings: () => void;
  /** Emmène au panthéon : changer de dieu se fait là-bas, pas ici. */
  onChangeGod: () => void;
}

export function PlayTab({ state, onPlay, onOpenSettings, onChangeGod }: Props) {
  const god = godById(state.selectedGod);
  const appearance = appearanceOf(state);

  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>LA CITÉ T'ATTEND</Text>
        <Text style={styles.title}>Divine City</Text>
        <Text style={styles.pitch}>
          Traverse la cité, convertis les mortels, et fais grossir ton cortège.
        </Text>
      </View>

      <SectionTitle>Divinité choisie</SectionTitle>

      <Card selected>
        <View style={styles.godRow}>
          <GodBadge color={appearance.color} accent={appearance.accent} size={58} />
          <View style={styles.godText}>
            <Text style={styles.godName}>{god.label}</Text>
            <Text style={styles.godDomain}>{god.domain}</Text>
          </View>
        </View>

        {/*
          La capacité est annoncée alors qu'aucune ligne ne l'exécute encore
          (M19 à M27). Ce n'est pas un mensonge : c'est ce qui distingue les
          dieux, et le joueur choisit déjà en fonction. Le jour où elle
          fonctionnera, cet écran n'aura pas à changer.
        */}
        <View style={styles.ability}>
          <Text style={styles.abilityLabel}>{god.ability.label.toUpperCase()}</Text>
          <Text style={styles.abilityText}>{god.ability.description}</Text>
          <Text style={styles.abilitySoon}>Disponible dans une prochaine version</Text>
        </View>

        <Button label="Changer de divinité" onPress={onChangeGod} style={styles.change} />
      </Card>

      <View style={styles.actions}>
        <Button
          testID="play"
          label="Jouer"
          variant="primary"
          onPress={onPlay}
          hint={`Lancer une partie avec ${god.label}`}
          style={styles.play}
        />
        <Button testID="settings" label="Paramètres" onPress={onOpenSettings} />
      </View>

      {state.bestScore > 0 && (
        <Text style={styles.best}>
          Meilleur cortège : {state.bestScore.toLocaleString('fr-FR')} fidèles
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingBottom: SPACE.xl },

  hero: { marginTop: SPACE.lg },
  // Le bandeau d'accueil tombe pile sur la partie claire du décor — le ciel
  // et la mer. Les trois lignes portent donc l'ombre.
  eyebrow: { ...TYPE.label, ...TEXT_SHADOW, color: COLORS.gold },
  title: { ...TYPE.display, ...TEXT_SHADOW, color: COLORS.text, marginTop: SPACE.sm },
  pitch: { ...TYPE.body, ...TEXT_SHADOW, color: COLORS.text, marginTop: SPACE.sm, lineHeight: 22 },

  godRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.lg },
  godText: { flex: 1 },
  godName: { ...TYPE.title, color: COLORS.text },
  godDomain: { ...TYPE.body, color: COLORS.muted, marginTop: 2 },

  ability: {
    marginTop: SPACE.lg,
    paddingTop: SPACE.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  abilityLabel: { ...TYPE.label, color: COLORS.gold },
  abilityText: { ...TYPE.body, color: COLORS.text, marginTop: SPACE.sm, lineHeight: 20 },
  abilitySoon: { ...TYPE.body, fontSize: 12, color: COLORS.locked, marginTop: SPACE.sm },

  change: { marginTop: SPACE.lg },

  actions: { marginTop: SPACE.xl, gap: SPACE.md },
  play: { minHeight: 58 },

  best: {
    ...TYPE.body,
    ...TEXT_SHADOW,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: SPACE.lg,
  },
});
