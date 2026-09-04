/**
 * SettingsSheet.tsx — les paramètres, en feuille par-dessus le menu.
 *
 * ⚠️ On n'y met que des réglages qui font QUELQUE CHOSE. Le son, les
 * vibrations et la qualité graphique n'existent pas encore (M35 à M39) : les
 * afficher éteints donnerait l'impression d'un jeu cassé plutôt que d'un jeu
 * en cours d'écriture. Ils viendront avec le code qui les honore.
 */

import { Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from './parts';
import { COLORS, RADIUS, SPACE, TOUCH_MIN, TYPE } from './theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  showStats: boolean;
  onToggleStats: (value: boolean) => void;
  /** Efface la progression. Demande confirmation ici même. */
  onReset: () => void;
  confirmingReset: boolean;
  onAskReset: () => void;
  onCancelReset: () => void;
}

export function SettingsSheet({
  visible,
  onClose,
  showStats,
  onToggleStats,
  onReset,
  confirmingReset,
  onAskReset,
  onCancelReset,
}: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      // Le bouton retour d'Android ferme la feuille, comme le geste attendu.
      onRequestClose={onClose}
    >
      <View style={styles.scrim}>
        {/* Toucher le voile ferme : le geste que tout le monde essaie. */}
        <Pressable style={styles.scrimTouch} onPress={onClose} accessibilityLabel="Fermer" />

        <SafeAreaView edges={['bottom']} style={styles.sheet}>
          <View style={styles.grip} />
          <Text style={styles.title}>Paramètres</Text>

          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Mesures de performance</Text>
              <Text style={styles.rowSub}>
                Affiche en jeu le coût de chaque image. Utile pour signaler un ralentissement.
              </Text>
            </View>
            <Switch
              testID="toggle-stats"
              value={showStats}
              onValueChange={onToggleStats}
              trackColor={{ false: COLORS.panelSunken, true: COLORS.gold }}
              thumbColor={COLORS.panelRaised}
            />
          </View>

          <View style={styles.separator} />

          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Progression</Text>
            <Text style={styles.rowSub}>
              L'or, les divinités et les parures sont enregistrés sur cet appareil.
            </Text>
          </View>

          {confirmingReset ? (
            <View style={styles.confirm}>
              <Text style={styles.confirmText}>
                Tout effacer ? Les divinités acquises et l'or seront perdus, sans
                retour possible.
              </Text>
              <View style={styles.confirmRow}>
                <Button label="Annuler" onPress={onCancelReset} style={styles.confirmButton} />
                <Button
                  testID="confirm-reset"
                  label="Effacer"
                  variant="primary"
                  onPress={onReset}
                  style={styles.confirmButton}
                />
              </View>
            </View>
          ) : (
            <Button
              testID="ask-reset"
              label="Réinitialiser la progression"
              onPress={onAskReset}
              style={styles.reset}
            />
          )}

          <Button label="Fermer" onPress={onClose} style={styles.close} />
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: COLORS.scrim, justifyContent: 'flex-end' },
  scrimTouch: { flex: 1 },

  // La feuille est du parchemin, comme les cartes : elle sort du même
  // atelier que le reste du menu, pas d'un panneau système.
  sheet: {
    backgroundColor: COLORS.panelRaised,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    paddingHorizontal: SPACE.xl,
    paddingTop: SPACE.md,
    paddingBottom: SPACE.xl,
    borderTopWidth: 3,
    borderColor: COLORS.frame,
  },
  grip: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.frame,
    marginBottom: SPACE.lg,
  },
  title: { ...TYPE.banner, color: COLORS.text, marginBottom: SPACE.lg, textAlign: 'center' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.lg,
    minHeight: TOUCH_MIN,
  },
  rowText: { flex: 1 },
  rowTitle: { ...TYPE.strong, color: COLORS.text },
  rowSub: { ...TYPE.body, fontSize: 12, color: COLORS.muted, marginTop: SPACE.xs, lineHeight: 17 },

  separator: {
    height: 2,
    backgroundColor: COLORS.border,
    marginVertical: SPACE.lg,
  },

  reset: { marginTop: SPACE.lg },
  confirm: { marginTop: SPACE.lg },
  confirmText: { ...TYPE.body, color: COLORS.text, lineHeight: 20 },
  confirmRow: { flexDirection: 'row', gap: SPACE.md, marginTop: SPACE.md },
  confirmButton: { flex: 1 },

  close: { marginTop: SPACE.md },
});
