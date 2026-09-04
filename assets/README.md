# assets

Deux sortes d'images, et elles ne se rangent pas au même endroit :

- **le décor** — `wallpaper.jpg`, ci-dessous ;
- **les icônes de l'interface** — `ui/`, qui a son propre README : la pièce
  d'or, la couronne de laurier et les trois icônes d'onglets.

## wallpaper.jpg — le décor du menu

C'est **la seule image de FOND du menu**. Les quatre onglets n'en portent pas
quatre exemplaires : ils se partagent celle-ci, large de quatre écrans.
L'Olympe en montre le premier quart, « Jouer » le deuxième, le passe de combat
le troisième, la boutique le dernier — le doigt fait voyager le regard le long
du même paysage.

Pour changer le décor, **remplace ce fichier**. Rien d'autre à toucher : ni le
code, ni `app.json`. Garde le nom `wallpaper.jpg`.

| | |
| --- | --- |
| Chemin | `assets/wallpaper.jpg` |
| Format | JPEG (`.jpg`) — le fichier doit VRAIMENT être un JPEG, renommer l'extension ne suffit pas |
| Cadrage | panoramique **27:16** |
| Taille conseillée | 2700 × 1600 px (minimum 1350 × 800) |

Deux règles de cadrage, parce que l'image est affichée en `cover` sur une
boîte de quatre écrans de large :

- **Le sujet vit au centre.** Les bords gauche et droit sont légèrement
  rognés sur un téléphone étroit, et beaucoup plus sur un écran large.
- **Le haut et le bas restent calmes.** Le bandeau du profil et la barre
  d'onglets s'y posent en permanence.
- **L'image passe au second plan.** Un brouillard clair la recouvre pour que
  le parchemin des cartes s'y détache ; inutile d'y chercher du détail fin.

Après remplacement, relance Metro en vidant son cache, sinon l'ancienne image
reste servie :

```
npx expo start -c
```
