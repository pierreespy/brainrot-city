/**
 * ShopTab.tsx — l'onglet « Magasin ».
 *
 * Trois rayons, dans cet ordre : les drachmes (ce qui rapporte de l'argent
 * réel), les dieux (le gros achat), les parures (le petit achat répété).
 *
 * ⚠️ Un rayon n'affiche jamais ce que le joueur possède déjà. Un magasin qui
 * montre des cases barrées ne donne pas envie d'acheter, il donne envie de
 * partir — et le joueur retrouve tout ce qu'il possède dans l'onglet Dieux.
 */

import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { GOD_ORDER, godById, type GodId } from '../../entities/gods/roster';
import { godPrice, ownsGod, ownsSkin, type Progression } from '../../meta/progression';
import { COIN_PACKS, purchasableSkins } from '../../meta/store';
import { Button, Card, GodBadge, SectionTitle } from './parts';
import { COLORS, RADIUS, SPACE, TYPE } from './theme';

interface Props {
  state: Progression;
  onBuyGod: (godId: GodId) => void;
  onBuySkin: (skinId: string) => void;
}

export function ShopTab({ state, onBuyGod, onBuySkin }: Props) {
  const gods = GOD_ORDER.filter((id) => !ownsGod(state, id));
  const skins = purchasableSkins().filter(
    (skin) => ownsGod(state, skin.godId) && !ownsSkin(state, skin.id),
  );

  return (
    <View style={styles.root}>
      <SectionTitle>Drachmes</SectionTitle>
      {/*
        Les paquets sont INERTES : un achat intégré demande un compte marchand
        et une vérification côté serveur (M46). Ils sont affichés quand même,
        pour que la place qu'ils occupent soit décidée maintenant — et le
        bouton dit franchement qu'ils ne marchent pas encore, plutôt que de
        rester muet au premier appui.
      */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.packRow}
      >
        {COIN_PACKS.map((pack) => (
          <View key={pack.id} style={[styles.pack, pack.featured && styles.packFeatured]}>
            {pack.featured && <Text style={styles.packTag}>LE PLUS PRIS</Text>}
            <View style={styles.coin} />
            <Text style={styles.packAmount}>{pack.drachmas.toLocaleString('fr-FR')}</Text>
            <Text style={styles.packLabel}>drachmes</Text>
            <Button label={pack.price} onPress={() => undefined} disabled style={styles.packButton} />
          </View>
        ))}
      </ScrollView>
      <Text style={styles.note}>
        Les achats ouvriront à la sortie du jeu. En attendant, les drachmes se gagnent en
        jouant : un tiers de ton cortège à chaque partie.
      </Text>

      <SectionTitle>Divinités</SectionTitle>
      {gods.length === 0 ? (
        <Text style={styles.empty}>Le panthéon est complet. Rien à ajouter.</Text>
      ) : (
        gods.map((id) => {
          const god = godById(id);
          const price = godPrice(id);
          const affordable = state.drachmas >= price;
          return (
            <Card key={id} style={styles.row}>
              <View style={styles.rowMain}>
                <GodBadge
                  color={god.appearance.color}
                  accent={god.appearance.accent}
                  dimmed={!affordable}
                />
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{god.label}</Text>
                  <Text style={styles.rowSub}>{god.domain}</Text>
                  <Text style={styles.rowAbility}>{god.ability.label}</Text>
                </View>
              </View>
              <Button
                testID={`buy-${id}`}
                label={`${price.toLocaleString('fr-FR')} dr.`}
                variant={affordable ? 'primary' : 'ghost'}
                disabled={!affordable}
                hint={
                  affordable
                    ? `Acheter ${god.label} pour ${price} drachmes`
                    : `${god.label} coûte ${price} drachmes, il t'en manque ${price - state.drachmas}`
                }
                onPress={() => onBuyGod(id)}
              />
            </Card>
          );
        })
      )}

      <SectionTitle>Parures</SectionTitle>
      {skins.length === 0 ? (
        <Text style={styles.empty}>
          Toutes les parures de tes divinités sont à toi. Acquiers un dieu pour en découvrir
          d'autres.
        </Text>
      ) : (
        skins.map((skin) => {
          const affordable = state.drachmas >= skin.price;
          return (
            <Card key={skin.id} style={styles.row}>
              <View style={styles.rowMain}>
                <GodBadge color={skin.color} accent={skin.accent} dimmed={!affordable} />
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{skin.label}</Text>
                  <Text style={styles.rowSub}>{godById(skin.godId).label}</Text>
                </View>
              </View>
              <Button
                testID={`buy-${skin.id}`}
                label={`${skin.price.toLocaleString('fr-FR')} dr.`}
                variant={affordable ? 'primary' : 'ghost'}
                disabled={!affordable}
                hint={`Acheter la parure ${skin.label} de ${godById(skin.godId).label} pour ${skin.price} drachmes`}
                onPress={() => onBuySkin(skin.id)}
              />
            </Card>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingBottom: SPACE.xl },

  packRow: { gap: SPACE.md, paddingRight: SPACE.lg },
  pack: {
    width: 132,
    alignItems: 'center',
    padding: SPACE.lg,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  packFeatured: { backgroundColor: COLORS.panelRaised, borderColor: COLORS.borderStrong },
  packTag: { ...TYPE.label, fontSize: 9, color: COLORS.gold, marginBottom: SPACE.sm },
  coin: { width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.gold },
  packAmount: { ...TYPE.title, color: COLORS.text, marginTop: SPACE.md },
  packLabel: { ...TYPE.body, fontSize: 12, color: COLORS.muted },
  packButton: { marginTop: SPACE.md, alignSelf: 'stretch' },

  note: { ...TYPE.body, fontSize: 12, color: COLORS.muted, marginTop: SPACE.md, lineHeight: 18 },
  empty: { ...TYPE.body, color: COLORS.muted, lineHeight: 20 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE.md,
    marginBottom: SPACE.md,
  },
  rowMain: { flexDirection: 'row', alignItems: 'center', gap: SPACE.md, flex: 1 },
  rowText: { flex: 1 },
  rowTitle: { ...TYPE.title, fontSize: 17, color: COLORS.text },
  rowSub: { ...TYPE.body, fontSize: 12, color: COLORS.muted, marginTop: 2 },
  rowAbility: { ...TYPE.label, fontSize: 10, color: COLORS.gold, marginTop: SPACE.xs },
});
