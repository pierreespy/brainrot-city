/**
 * TopBar.tsx — le bandeau qui ne quitte JAMAIS l'écran.
 *
 * Il porte quatre choses, et rien d'autre : qui l'on est (le portrait, son
 * nom et son niveau), ce que l'on possède (les deux monnaies), et l'accès aux
 * réglages.
 *
 * ⚠️ Il est posé HORS du ruban d'onglets, au-dessus de lui. Le décor glisse
 * sous le doigt, les cartes changent, mais la bourse reste à la même place :
 * c'est ce qui permet d'appuyer sur « + » sans se demander sur quel onglet on
 * se trouve.
 *
 * ⚠️ Il occupe TOUT le haut de l'écran, de son bord supérieur au décor : il
 * porte lui-même la marge de la barre d'état (l'écran ne la réserve plus, voir
 * `MenuScreen`), et il ne laisse RIEN sous lui. C'est ce qui colle le bas du
 * cadre au haut du papier peint, sans bande claire entre les deux.
 *
 * ⚠️ TOUT tient sur UNE SEULE ligne, et c'est ce qui garde la bande basse :
 * le nom se lit À CÔTÉ du portrait, pas dessous, et la plaque de niveau
 * DÉBORDE sur le décor au lieu d'épaissir la bande.
 */

import { useState } from 'react';
import { Image, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { godById } from '../../entities/gods/roster';
import { flatColorOf, type Progression } from '../../meta/progression';
import { rankOf } from '../../meta/rank';
import { CurrencyPill, GodBadge } from './parts';
import { ART, PORTRAITS } from './icons';
import { COLORS, RADIUS, SPACE, TOUCH_MIN, TYPE } from './theme';

/** Le diamètre du médaillon du dieu. Il est plus haut que la bande. */
const AVATAR = 56;

/**
 * La place réservée au médaillon dans la ligne, en points.
 *
 * Le médaillon est HORS FLUX : il ne pousse donc rien devant lui, et sans
 * cette réserve le nom du dieu viendrait se lire par-dessus son visage.
 */
const AVATAR_SLOT = SPACE.md + AVATAR + SPACE.sm;

/**
 * La hauteur de la ligne tant qu'elle n'est pas mesurée, en points.
 *
 * Elle ne sert qu'à la première image, avant que `onLayout` ne réponde : sans
 * elle, le cadre se poserait entier le temps d'une image, et l'on verrait son
 * haut sauter.
 */
const BAR_GUESS = 58;

export function TopBar({
  state,
  onOpenSettings,
  onOpenShop,
}: {
  state: Progression;
  onOpenSettings: () => void;
  onOpenShop: () => void;
}) {
  const god = godById(state.selectedGod);
  const appearance = flatColorOf(state);
  const rank = rankOf(state.bestScore);
  const portrait = PORTRAITS[state.selectedGod];

  // Le bandeau monte SOUS la barre d'état : c'est lui qui en porte la marge,
  // et le cadre couvre donc le haut de l'écran jusqu'à son bord.
  const insets = useSafeAreaInsets();

  // La hauteur de la ligne, MESURÉE : elle dépend de la police et de la
  // taille de texte du système, et le rognage se calcule dessus.
  const [barHeight, setBarHeight] = useState(0);

  /**
   * La hauteur du cadre qui passe AU-DESSUS de l'écran, en points.
   *
   * Le dessin est un cadre fermé, avec un haut et un bas ; posé entier, il
   * ferait une bande bien trop haute pour ce qu'elle porte. On le monte donc
   * et on rogne ce qui dépasse : il ne reste que le bas et les deux montants.
   *
   * ⚠️ Le facteur est MESURÉ sur le dessin, pas choisi : la ferrure haute de
   * `ligue.png` (512 × 119) occupe un SIXIÈME de sa hauteur, et le cadre est
   * étiré sur la partie visible PLUS ce rognage. Rogner exactement ce
   * sixième-là — soit un cinquième du visible — fait disparaître le haut du
   * cadre et RIEN de plus : au-delà, on entame l'intérieur et les
   * informations du joueur se retrouvent hors du cadre.
   */
  const visible = insets.top + (barHeight || BAR_GUESS);
  const crop = Math.round(visible / 5);

  return (
    <View style={styles.root}>
      {/* ⚠️ Le MÊME cadre dessiné que la carte de la course sacrée et que le
          bandeau de ligue (`ART.ligue`) : les deux bourses, le nom du dieu et
          le bouton des réglages tiennent DEDANS. Il est étiré, ce que ce
          dessin supporte — il n'a pas de sujet, juste des coins ferrés.

          ⚠️ Il est ROGNÉ PAR LE HAUT : une marge haute négative le fait sortir
          de l'écran, et l'enveloppe qui coupe (`overflow: 'hidden'`) en efface
          la partie qui dépasse. La marge intérieure haute rend à la ligne la
          place que la marge négative lui prend — sans elle, c'est le contenu
          qui serait coupé, pas le dessin — et elle y ajoute la barre d'état,
          que le cadre recouvre.

          ⚠️ C'est cette enveloppe-ci qui coupe, PAS le bandeau entier : le
          médaillon, lui, doit pouvoir déborder dessous.

          ⚠️ Le conteneur du cadre n'a aucune marge intérieure horizontale :
          elle est descendue dans `bar`. Le dessin de fond est un enfant hors
          flux tiré aux quatre bords, et sa largeur « 100 % » ne se mesure pas
          sur la même boîte partout — le web la prend marge comprise, Yoga la
          prend marge déduite. Une marge ici donnerait un cadre plein écran
          sur le web et un cadre rentré vers la gauche sur le téléphone. Et
          `resizeMode` est en PROP autant qu'en style : le style seul
          n'atteint pas l'image sur iOS. */}
      <View style={styles.clip}>
        <ImageBackground
          source={ART.ligue}
          style={[styles.frame, { marginTop: -crop, paddingTop: crop + insets.top }]}
          imageStyle={styles.frameSkin}
          resizeMode="stretch"
        >
          <View
            style={styles.bar}
            onLayout={(event) => setBarHeight(event.nativeEvent.layout.height)}
          >
            {/* Le nom sur sa languette, à hauteur des bourses : c'est la
                première chose que l'on lit, et elle appartient au portrait
                posé juste à sa gauche. */}
            <View style={styles.nameTab}>
              <Text style={styles.name} numberOfLines={1}>
                {god.label}
              </Text>
            </View>

            <View style={styles.purse}>
              <CurrencyPill
                testID="gold"
                tone="gold"
                value={state.gold}
                hint="Ouvrir la boutique, rayon or"
                onAdd={onOpenShop}
              />
              <CurrencyPill
                testID="laurels"
                tone="laurel"
                value={state.laurels}
                hint="Ouvrir la boutique, rayon lauriers"
                onAdd={onOpenShop}
              />
            </View>

            <Pressable
              testID="settings"
              onPress={onOpenSettings}
              accessibilityRole="button"
              accessibilityLabel="Paramètres"
              hitSlop={6}
              style={({ pressed }) => [styles.burger, pressed && styles.burgerPressed]}
            >
              <Text style={styles.burgerLines}>≡</Text>
            </Pressable>
          </View>
        </ImageBackground>
      </View>

      {/* ⚠️ Le médaillon est HORS FLUX, et posé APRÈS le cadre : il se dessine
          donc par-dessus, et il déborde sur le décor — c'est ce débordement
          qui fait lire le portrait comme épinglé sur le bandeau plutôt que
          rangé dedans. La ligne, elle, lui garde sa place avec `AVATAR_SLOT`. */}
      <View style={[styles.avatarWrap, { top: insets.top }]} pointerEvents="none">
        {/* Le portrait porte SON PROPRE anneau d'or, dessiné dans l'image :
            posé dans le cadre du médaillon, il en ferait un second. D'où deux
            habillages, selon qu'un dieu a son visage ou seulement ses deux
            couleurs. */}
        {portrait === undefined ? (
          <View style={styles.avatar}>
            <GodBadge color={appearance.color} accent={appearance.accent} size={42} />
          </View>
        ) : (
          <Image
            source={portrait}
            resizeMode="contain"
            style={styles.portrait}
            accessible={false}
            importantForAccessibility="no"
          />
        )}
        {/* La plaque de niveau chevauche le bas du portrait : elle appartient
            au médaillon, elle ne se lit pas comme une deuxième information. */}
        <View style={styles.levelPlate}>
          <Text style={styles.levelText}>Niv {rank.level}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ⚠️ Le bandeau NE COUPE PAS : c'est `clip` qui s'en charge, un cran plus
  // bas.
  //
  // ⚠️ Et il n'a AUCUNE marge, ni haute ni basse : le haut du cadre part du
  // bord de l'écran, son bas touche le haut du décor. Une marge ici laissait
  // une bande de fond clair entre les deux — le « vide blanc ».
  //
  // ⚠️ `zIndex` : la plaque de niveau déborde SUR le décor, qui est un frère
  // dessiné APRÈS le bandeau. Sans ce relief, elle passerait dessous et
  // serait tout simplement invisible.
  root: { position: 'relative', zIndex: 2 },

  clip: { overflow: 'hidden' },

  // ⚠️ SANS marge intérieure horizontale — elle appartient à `bar`, un cran
  // plus bas (voir le commentaire du rendu) : le dessin de fond se mesure sur
  // ce conteneur-ci, et une marge latérale le rétrécirait sur téléphone.
  // Les marges verticales, elles, sont calculées au rendu : elles dépendent
  // de la barre d'état et de la hauteur mesurée de la ligne.
  frame: { justifyContent: 'flex-end' },
  // Sans `width`/`height`, l'image garderait sa taille NATIVE — 512 points de
  // large — et sortirait du cadre par la droite ; `stretch` est répété ici
  // parce que le style n'atteint pas l'image sur iOS et la prop ne l'atteint
  // pas sur le web. Pas de coins arrondis : ils se liraient au milieu de
  // l'écran, là où le dessin est coupé.
  frameSkin: { width: '100%', height: '100%', resizeMode: 'stretch' },

  // ⚠️ La marge BASSE n'est pas décorative : la ferrure basse du dessin mord
  // sur un sixième de la hauteur du cadre. En deçà, les bourses viendraient
  // se poser DESSUS au lieu de se lire dans le cadre.
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    paddingLeft: AVATAR_SLOT,
    paddingRight: SPACE.md,
    paddingTop: SPACE.xs,
    paddingBottom: SPACE.md + SPACE.xs,
  },

  // Le médaillon descend plus bas que la bande : il commence sous la barre
  // d'état (`top`, posé au rendu) et sa plaque de niveau tombe sur le décor.
  avatarWrap: { position: 'absolute', left: SPACE.md, alignItems: 'center' },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.panelRaised,
    borderWidth: 3,
    borderColor: COLORS.gold,
  },
  // Le portrait remplace le cadre, il ne s'y ajoute pas : même diamètre que
  // le médaillon de couleurs, pour que le bandeau garde sa hauteur quel que
  // soit le dieu choisi.
  portrait: { width: AVATAR, height: AVATAR },

  levelPlate: {
    marginTop: -8,
    paddingHorizontal: SPACE.sm,
    paddingVertical: 1,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bar,
    borderWidth: 1.5,
    borderColor: COLORS.gold,
  },
  levelText: { ...TYPE.tiny, color: COLORS.onDark },

  // La languette du nom : la même bordure d'or que les bourses, pour qu'elle
  // se lise comme une pièce de la même ligne.
  nameTab: {
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.xs,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bar,
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  name: { ...TYPE.title, fontSize: 14, color: COLORS.onDark },

  purse: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: SPACE.sm },

  burger: {
    width: TOUCH_MIN - 6,
    height: TOUCH_MIN - 6,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bar,
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  burgerPressed: { opacity: 0.8, transform: [{ scale: 0.94 }] },
  burgerLines: { ...TYPE.display, fontSize: 24, color: COLORS.onDark, lineHeight: 30 },
});
