# Maquettes — le menu de Divine City

Les écrans du menu, dessinés avant d'être codés : onglets **Magasin**,
**Jouer** (au milieu) et **Dieux**, plus les paramètres et la fiche d'un dieu.

Canvas publié : <https://claude.ai/code/artifact/db1f90be-13de-4bae-a869-5195698f5cea>

**2026-09-03 — révision** : le menu codé (`src/ui/menu/`) est passé entre
temps par un ordre d'onglets différent (Magasin / Jouer / Dieux, Jouer au
milieu) et un vrai fond (`assets/wallpaper.jpg`, un temple grec). `Main.dc.html`
a été refait pour suivre : nouvel ordre, fond + voile de lisibilité identiques
à `MenuScreen.tsx`, et un contenu relu pour coller exactement au code —
couleurs, prix et copie viennent maintenant de `theme.ts`, `roster.ts` et
`store.ts`, pas d'une estimation. `Reglages.dc.html` et `FicheDieu.dc.html`
n'ont pas été retouchés.

## Les fichiers

| Fichier | Écran |
|---|---|
| `Main.dc.html` | Le menu et ses trois onglets — **les onglets sont cliquables** |
| `Reglages.dc.html` | Les paramètres, ouverts par l'engrenage de l'onglet Jouer |
| `FicheDieu.dc.html` | La fiche d'un dieu et ses apparences |
| `canvas.json` | La disposition des trois écrans sur le canvas |
| `temple-bg.jpg` | Le fond du menu — `assets/wallpaper.jpg` réduit (~25 Ko) |

Le fichier assemblé (`menu-divine-city.html`, plusieurs Mo) n'est **pas suivi
par Git** : il est regénéré à partir des sources ci-dessus.

## Ce que les maquettes reprennent du jeu

Rien n'est inventé quand le code a déjà tranché :

- la palette de `src/ui/menu/theme.ts` (fond, panneaux, or, textes, bordures) ;
- le fond `assets/wallpaper.jpg`, avec le même voile en dégradé que
  `src/ui/menu/MenuScreen.tsx` (assombri en haut et en bas, centre visible) ;
- les **sept dieux de `src/entities/gods/roster.ts`** (M12) — couleurs,
  domaines, capacités, et qui est débloqué d'emblée ;
- les prix de `src/meta/store.ts` — `GOD_PRICES`, `PURCHASABLE` (parures),
  `GOLD_PACKS` (or contre argent réel, packs et prix réels) ;
- la copie exacte de `PlayTab.tsx`, `ShopTab.tsx` et `GodsTab.tsx` (accroche,
  pitch, notes, libellés de bouton).

Titrage en **Cinzel**, texte en **Manrope** — deux polices Google. Les charger
dans l'app demandera `expo-font` ; ce n'est pas encore fait.

## Ce qui reste à décider

- L'onglet Jouer affiche un solde et un record d'**exemple** (2 480 or,
  708 fidèles) : une partie fraîche démarre à 0. Choisis de vrais chiffres
  quand tu auras joué.
- Le trait doré + libellé de la barre d'onglets remplace les icônes de la
  version précédente — plus proche du code actuel (`MenuScreen.tsx` n'a pas
  d'icônes), à valider avant de l'ajouter en RN.
- Rien de tout cela n'est branché : les écrans correspondent aux milestones
  **M13** (sélection du dieu), **M15** (déblocage) et **M46** (monétisation).
