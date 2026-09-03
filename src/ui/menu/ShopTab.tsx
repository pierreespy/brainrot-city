/**
 * ShopTab.tsx — la boutique.
 *
 * Quatre rayons, dans cet ordre : l'offre du jour (celle qui rapporte), les
 * lauriers, les divinités et leurs parures, et enfin la conversion des
 * drachmes en lauriers — la seule opération que le joueur peut réellement
 * faire aujourd'hui.
 *
 * ⚠️ Un rayon n'affiche jamais ce que le joueur possède déjà. Un magasin qui
 * montre des cases barrées ne donne pas envie d'acheter, il donne envie de
 * partir — et le joueur retrouve tout ce qu'il possède à l'Olympe.
 *
 * ⚠️ Tout ce qui se paie en argent réel est INERTE (M46) : un achat intégré
 * demande un compte marchand et une vérification côté serveur. Les cartes
 * sont affichées quand même, pour que la place qu'elles occupent soit
 * décidée maintenant, et le bouton dit franchement qu'il ne marche pas
 * encore plutôt que de rester muet au premier appui.
 */

import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { GOD_ORDER, godById, type GodId } from '../../entities/gods/roster';
import { godPrice, ownsGod, ownsSkin, type Progression } from '../../meta/progression';
import { AMBROSIA_PACKS, COIN_PACKS, purchasableSkins } from '../../meta/store';
import { Button, Card, Coin, GodBadge, Laurel, Plaque, SectionTitle } from './parts';
import { COLORS, RADIUS, SPACE, TYPE, hex } from './theme';

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
  const featured = COIN_PACKS.find((pack) => pack.featured) ?? COIN_PACKS[0];

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    >
      <Plaque title="Boutique" />

      <SectionTitle>Offre du jour</SectionTitle>
      <Card style={styles.offer} selected>
        <View style={styles.offerBody}>
          <Text style={styles.offerIcon}>⚡</Text>
          <View style={styles.offerText}>
            <Text style={styles.offerName}>PACK STARTER OLYMPIEN</Text>
            <Text style={styles.offerDetail}>
              {featured.drachmas.toLocaleString('fr-FR')} drachmes, une parure au choix et un
              coffre rare.
            </Text>
          </View>
        </View>
        <Button label={featured.price} onPress={() => undefined} disabled variant="primary" />
      </Card>

      <SectionTitle>Acheter des lauriers</SectionTitle>
      <View style={styles.packRow}>
        {AMBROSIA_PACKS.map((pack) => (
          <View key={pack.id} style={[styles.pack, pack.featured && styles.packOn]}>
            <Laurel size={26} />
            <Text style={styles.packAmount}>{pack.ambrosia.toLocaleString('fr-FR')}</Text>
            <Text style={styles.packLabel}>lauriers</Text>
            <Button label={pack.price} onPress={() => undefined} disabled style={styles.packButton} />
          </View>
        ))}
      </View>

      {gods.length > 0 && (
        <>
          <SectionTitle>Divinités</SectionTitle>
          {gods.map((id) => {
            const god = godById(id);
            const price = godPrice(id);
            return (
              <Card key={id} style={styles.row}>
                <GodBadge color={god.appearance.color} accent={god.appearance.accent} size={44} />
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {god.label}
                  </Text>
                  <Text style={styles.rowSub} numberOfLines={1}>
                    {god.domain}
                  </Text>
                </View>
                <Button
                  testID={`buy-${id}`}
                  label={price.toLocaleString('fr-FR')}
                  variant="primary"
                  disabled={state.drachmas < price}
                  onPress={() => onBuyGod(id)}
                  hint={`Acheter ${god.label} pour ${price} drachmes`}
                  style={styles.rowButton}
                />
              </Card>
            );
          })}
        </>
      )}

      {skins.length > 0 && (
        <>
          <SectionTitle>Parures</SectionTitle>
          <View style={styles.skinRow}>
            {skins.map((skin) => (
              <Card key={skin.id} style={styles.skin}>
                <View style={[styles.skinDot, { backgroundColor: hex(skin.color), borderColor: hex(skin.accent) }]} />
                <Text style={styles.skinLabel} numberOfLines={1}>
                  {skin.label}
                </Text>
                <Text style={styles.skinGod} numberOfLines={1}>
                  {godById(skin.godId).label}
                </Text>
                <Button
                  testID={`buy-${skin.id}`}
                  label={skin.price.toLocaleString('fr-FR')}
                  variant="primary"
                  disabled={state.drachmas < skin.price}
                  onPress={() => onBuySkin(skin.id)}
                  hint={`Acheter la parure ${skin.label}`}
                  style={styles.skinButton}
                />
              </Card>
            ))}
          </View>
        </>
      )}

      {gods.length === 0 && skins.length === 0 && (
        <Text style={styles.empty}>
          Tout le panthéon est à toi, et toutes ses parures. Il ne reste qu'à courir.
        </Text>
      )}

      <SectionTitle>Conversion</SectionTitle>
      <Card style={styles.convert}>
        <Text style={styles.convertText}>
          Changer des drachmes contre des lauriers ouvrira avec les achats.
        </Text>
        <View style={styles.convertRow}>
          <View style={styles.convertFrom}>
            <Coin size={16} />
            <Text style={styles.convertValue}>1 000</Text>
          </View>
          <Text style={styles.convertArrow}>➜</Text>
          <View style={styles.convertFrom}>
            <Laurel size={16} />
            <Text style={styles.convertValue}>50</Text>
          </View>
        </View>
      </Card>

      <Text style={styles.note}>
        Les drachmes se gagnent en jouant : une pour trois fidèles convertis.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingVertical: SPACE.sm, paddingBottom: SPACE.xl, gap: SPACE.sm },

  offer: { gap: SPACE.md },
  offerBody: { flexDirection: 'row', alignItems: 'center', gap: SPACE.md },
  offerIcon: { fontSize: 34 },
  offerText: { flex: 1, minWidth: 0 },
  offerName: { ...TYPE.label, fontSize: 11, color: COLORS.text },
  offerDetail: { ...TYPE.body, fontSize: 12, color: COLORS.muted, marginTop: 2, lineHeight: 17 },

  packRow: { flexDirection: 'row', gap: SPACE.sm },
  pack: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: SPACE.md,
    paddingHorizontal: SPACE.xs,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: COLORS.frame,
    borderBottomColor: COLORS.frameDark,
    backgroundColor: COLORS.panel,
  },
  packOn: { borderColor: COLORS.borderStrong, backgroundColor: COLORS.panelRaised },
  packAmount: { ...TYPE.price, color: COLORS.text, marginTop: SPACE.xs },
  packLabel: { ...TYPE.body, fontSize: 11, color: COLORS.muted },
  packButton: { alignSelf: 'stretch', marginTop: SPACE.sm, minHeight: 36 },

  row: { flexDirection: 'row', alignItems: 'center', gap: SPACE.md },
  rowText: { flex: 1, minWidth: 0 },
  rowTitle: { ...TYPE.title, fontSize: 16, color: COLORS.text },
  rowSub: { ...TYPE.body, fontSize: 12, color: COLORS.muted },
  rowButton: { minWidth: 92 },

  skinRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.sm },
  skin: { width: '31%', minWidth: 96, alignItems: 'center', gap: 2 },
  skinDot: { width: 30, height: 30, borderRadius: 15, borderWidth: 3 },
  skinLabel: { ...TYPE.strong, fontSize: 13, color: COLORS.text },
  skinGod: { ...TYPE.body, fontSize: 11, color: COLORS.muted },
  skinButton: { alignSelf: 'stretch', marginTop: SPACE.xs, minHeight: 34 },

  empty: { ...TYPE.body, color: COLORS.text, textAlign: 'center', lineHeight: 20 },

  convert: { gap: SPACE.sm },
  convertText: { ...TYPE.body, fontSize: 12, color: COLORS.muted, lineHeight: 17 },
  convertRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACE.lg },
  convertFrom: { flexDirection: 'row', alignItems: 'center', gap: SPACE.xs },
  convertValue: { ...TYPE.price, fontSize: 14, color: COLORS.text },
  convertArrow: { fontSize: 16, color: COLORS.frameDark },

  note: { ...TYPE.body, fontSize: 12, color: COLORS.muted, textAlign: 'center', lineHeight: 17 },
});
