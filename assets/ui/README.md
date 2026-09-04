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
| `zeus.png` | Le **portrait** du bandeau, quand Zeus est la divinité choisie |
| `desert.png` | Le médaillon de l'**Agora**, sur la frise de l'onglet Jouer |
| `vague.png` | Le médaillon du **Port** |
| `foret.png` | Le médaillon du **Bois sacré** |
| `volcan.png` | Le médaillon de l'**Acropole** |
| `bouton-match.png` | La plaque « TROUVER MATCH », sur la carte de l'arène |
| `bouton-continuer.png` | La plaque « CONTINUER », sur la carte de la course |

Les quatre médaillons sont appariés par **sujet**, pas par rang : la vague va
au Port, les pins au Bois sacré, le volcan à l'Acropole, et les colonnes à
l'Agora — le seul quartier à colonnade (voir `world/districts.ts`). L'ordre à
l'écran suit le niveau qui ouvre chaque étape, et peut changer sans que ces
couples bougent.

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
joueur, et aucun `label` ne viendrait corriger l'image. D'où le composant
`Plate`, qui prend une image et un `hint` mais jamais de `label`, et d'où la
table `PLATES`, séparée des icônes.

Deux conséquences visibles :

- « CONTINUER » ne s'affiche qu'à un joueur **qui a déjà couru**. Une première
  partie garde le bouton d'or, qui dit « Jouer » : personne ne continue une
  course qu'il n'a pas commencée.
- « TROUVER MATCH » est posée **éteinte** sur la carte de l'arène, sous sa
  pastille « bientôt ». Le mode n'existe pas encore ; la plaque l'annonce sans
  le promettre.

## Deux états cuits dans le dessin

⚠️ `desert.jpg` et `volcan.jpg` portent un état **dessiné dans l'image** :
un halo doré pour l'un, un cadenas pour l'autre. Or l'application calcule
l'état d'un chapitre à partir du niveau du joueur — un cadre d'or quand il est
atteint, un voile quand il ne l'est pas.

Le halo du désert a été retiré, en recadrant sur le cercle du médaillon
(option `--cercle`, voir `tools/detourer.py`). **Le cadenas du volcan, lui,
reste** : il chevauche le disque, on ne peut pas le découper sans entamer le
dessin. L'Acropole aura donc l'air verrouillée même une fois le niveau 30
atteint. Pour y remédier, il faut **régénérer `images/volcan.jpg` sans le
cadenas**, comme `vague.jpg` et `foret.jpg` qui n'en portent pas, puis relancer
le détourage.
