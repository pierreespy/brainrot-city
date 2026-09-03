# Maquettes — le menu de Divine City

Les écrans du menu, dessinés avant d'être codés : onglets **Jouer**,
**Magasin** et **Dieux**, plus les paramètres et la fiche d'un dieu.

Canvas publié : <https://claude.ai/code/artifact/db1f90be-13de-4bae-a869-5195698f5cea>

## Les fichiers

| Fichier | Écran |
|---|---|
| `Main.dc.html` | Le menu et ses trois onglets — **les onglets sont cliquables** |
| `Reglages.dc.html` | Les paramètres, ouverts par l'engrenage de l'onglet Jouer |
| `FicheDieu.dc.html` | La fiche d'un dieu et ses apparences |
| `canvas.json` | La disposition des trois écrans sur le canvas |

Le fichier assemblé (`menu-divine-city.html`, 2,4 Mo) n'est **pas suivi par
Git** : il est regénéré à partir des sources ci-dessus.

## Ce que les maquettes reprennent du jeu

Rien n'est inventé quand le code a déjà tranché :

- l'accent `#7dd3fc` et les panneaux `rgba(0, 0, 0, 0.45)` de `src/ui/Hud.tsx` ;
- le marbre `#efe9db` et la tuile `#c4694a` de `src/world/districts.ts` ;
- les **sept dieux de `src/entities/gods/roster.ts`** (M12) — couleurs,
  capacités, durées et recharges, et qui est débloqué d'emblée.

Titrage en **Cinzel**, texte en **Manrope** — deux polices Google. Les charger
dans l'app demandera `expo-font` ; ce n'est pas encore fait.

## Ce qui reste à décider

- **Une seule monnaie** (les drachmes) est supposée ici. Une seconde devise
  premium est l'autre modèle courant du genre.
- Les **prix en euros sont des `[PRIX]`** : ils ne s'inventent pas.
- Les prix en drachmes (1 200 / 1 800 / 2 400) sont des valeurs d'exemple,
  à équilibrer avec le gain d'une partie.
- Rien de tout cela n'est branché : les écrans correspondent aux milestones
  **M13** (sélection du dieu), **M15** (déblocage) et **M46** (monétisation).
