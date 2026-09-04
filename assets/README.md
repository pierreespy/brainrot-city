# assets

Deux sortes d'images, et elles ne se rangent pas au même endroit :

- **le décor** — `wallpaper1.png` et `wallpaper2.png`, ci-dessous ;
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
- **L'image passe au second plan.** Un brouillard clair la recouvre pour que
  le parchemin des cartes s'y détache ; inutile d'y chercher du détail fin.

Après remplacement, relance Metro en vidant son cache, sinon l'ancienne image
reste servie :

```
npx expo start -c
```
