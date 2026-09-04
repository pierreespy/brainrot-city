# assets/ui — les images de l'interface

Les icônes affichées par le menu. Elles sont déclarées **une par une** dans
`src/ui/menu/icons.ts` : Metro résout un `require()` à la compilation, donc un
chemin construit à l'exécution donnerait une image introuvable sur téléphone
alors qu'elle s'afficherait très bien sur le banc web.

Le décor du menu n'est pas ici : il vit dans `assets/wallpaper.jpg`, et son
README voisin explique comment le remplacer.

| Fichier | Où il s'affiche |
| --- | --- |
| `olympe.png` | L'onglet **Olympe**, dans la barre du bas |
| `passe.png` | L'onglet **Passe** |
| `boutique.png` | L'onglet **Boutique** |
| `piece-or.png` | La monnaie **or** : bourse du bandeau, prix, récompenses |
| `laurier.png` | La monnaie **laurier** : bourse, prix, paquets de la boutique |
| `bouton-match.png` | *Pas encore posée* — plaque gravée « TROUVER MATCH » |
| `bouton-continuer.png` | *Pas encore posée* — plaque gravée « CONTINUER » |

## Ce sont des PNG, et c'est le sujet

Les sources vivent dans `images/`, en JPEG, sur un damier gris. **Ce damier
n'est pas une transparence** : le JPEG ne sait pas en porter, et l'outil qui a
produit ces images l'a donc aplati dans les pixels. Posée telle quelle sur le
parchemin du menu, chaque icône traînerait son rectangle gris.

D'où la conversion, à faire une fois par image qui entre ici :

```
pip install pillow
python3 tools/detourer.py "images/laurier.jpg" assets/ui/laurier.png 192x192
```

Le script reconnaît le damier à son ALTERNANCE, pas à sa position : une zone
enfermée par le sujet — l'œil d'un casque, le col d'une amphore — n'est reliée
à aucun bord, et un simple remplissage depuis les bords l'aurait laissée
blanche. Il recadre ensuite au sujet et réduit à la taille demandée.

⚠️ **Vérifie le résultat sur un fond clair**, pas sur le damier d'une
visionneuse : c'est exactement ce qu'on cherche à distinguer.

## Les tailles

Deux fois la taille d'affichage, pas plus : une icône de barre d'onglets se
dessine dans 38 × 28 points, et un écran dense en demande le double. Au-delà,
on paie de la mémoire pour des pixels que personne ne voit.

## Les deux plaques gravées

`bouton-match.png` et `bouton-continuer.png` ne sont **pas des fonds de
bouton** : leur intitulé est dans les pixels. Une plaque ne peut donc porter
que l'action qu'elle annonce — la reprendre pour un autre libellé mentirait au
joueur, et aucun `label` ne viendrait corriger l'image. C'est pourquoi
`icons.ts` les range à part, dans `PLATES`, et qu'aucun écran ne les affiche
encore : le menu n'a aujourd'hui ni recherche d'adversaire ni course à
reprendre.
