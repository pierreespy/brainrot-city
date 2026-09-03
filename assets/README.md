# assets

## wallpaper.jpg — le décor du menu

C'est **la seule image du menu**. Les trois onglets n'en portent pas trois
exemplaires : ils se partagent celle-ci, large de trois écrans. Le magasin en
montre le tiers gauche, « Jouer » le milieu, les dieux le tiers droit, et le
doigt fait voyager le regard le long du même paysage.

Pour changer le décor, **remplace ce fichier**. Rien d'autre à toucher : ni le
code, ni `app.json`. Garde le nom `wallpaper.jpg`.

| | |
| --- | --- |
| Chemin | `assets/wallpaper.jpg` |
| Format | JPEG (`.jpg`) |
| Cadrage | panoramique **27:16** |
| Taille conseillée | 2700 × 1600 px (minimum 1350 × 800) |

Deux règles de cadrage, parce que l'image est affichée en `cover` sur une
boîte de trois écrans de large :

- **Le sujet vit au centre.** Les bords gauche et droit sont légèrement
  rognés sur un téléphone étroit, et beaucoup plus sur un écran large.
- **Le haut et le bas restent calmes.** Un voile sombre en dégradé y est posé
  en permanence, pour que la bourse et la barre d'onglets restent lisibles.

Après remplacement, relance Metro en vidant son cache, sinon l'ancienne image
reste servie :

```
npx expo start -c
```
