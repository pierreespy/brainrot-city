# assets

Deux sortes d'images, et elles ne se rangent pas au même endroit :

- **le décor** — `wallpaper1.png` et `wallpaper2.png`, ci-dessous ;
- **le cadre du menu** — `temple_cadre.png`, ci-dessous ;
- **les icônes de l'interface** — `ui/`, qui a son propre README : la pièce
  d'or, la couronne de laurier et les trois icônes d'onglets.

## wallpaper1.png / wallpaper2.png — le décor du menu

Ce sont **les deux seules images de FOND du menu**. Chaque onglet en montre
une tranche pleine largeur, pas un quart d'un paysage continu :

- `wallpaper1.png` — l'onglet « Jouer », seul ;
- `wallpaper2.png` — les quatre autres onglets (Quêtes, Olympe, Passe,
  Boutique), qui la partagent.

Pour changer un décor, **remplace le fichier correspondant**. Rien d'autre à
toucher : ni le code, ni `app.json`. Garde les noms `wallpaper1.png` et
`wallpaper2.png`.

| | |
| --- | --- |
| Chemins | `assets/wallpaper1.png`, `assets/wallpaper2.png` |
| Format | PNG (`.png`) — le fichier doit VRAIMENT être un PNG, renommer l'extension ne suffit pas |
| Cadrage | plein écran, portrait |
| Taille conseillée | 1350 × 2400 px (minimum 750 × 1400) |

Deux règles de cadrage, parce que chaque image est affichée en `cover` sur
une page pleine largeur :

- **Le sujet vit au centre.** Les bords gauche et droit sont légèrement
  rognés sur un téléphone étroit, et beaucoup plus sur un écran large.
- **Le haut et le bas restent calmes.** Le bandeau du profil et la barre
  d'onglets s'y posent en permanence.

L'image est affichée telle quelle, sans voile ni opacité par-dessus.

## temple_cadre.png — le cadre du menu

Le temple dessiné qui entoure une page : fronton et tablette gravée en haut,
colonnes sur les côtés, socle en bas. Il est posé sur **tous les onglets sauf
« Jouer »**, et le titre de l'onglet s'écrit dans sa tablette.

Son centre est **transparent** : c'est par là que le décor se voit.

| | |
| --- | --- |
| Chemin | `assets/temple_cadre.png` |
| Format | PNG à fond transparent |
| Taille | 1024 × 1536 px |

⚠️ Le cadre est **étiré** à la page, et les marges du contenu sont écrites en
fractions de l'image dans `MenuScreen.tsx` (`FRAME_INSET`, `FRAME_PLAQUE`),
mesurées sur son alpha : vide intérieur à 11,3 % des côtés, 15 % du haut,
5,5 % du bas ; tablette du fronton entre 4,2 % et 11,4 % de la hauteur. Si le
dessin change de proportions, il faut re-mesurer ces fractions, sinon le
contenu passe sous les colonnes et le titre sort de sa tablette.

Après remplacement, relance Metro en vidant son cache, sinon l'ancienne image
reste servie :

```
npx expo start -c
```
