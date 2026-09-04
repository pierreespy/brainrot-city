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
| `volcan.png` | Le médaillon de l'**Acropole** — détouré de `volcanbon.jpg` |
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

## Un état cuit dans le dessin, et comment il a été réglé

⚠️ Une image de médaillon ne doit porter AUCUN état. L'application calcule
elle-même si un chapitre est atteint — cadre d'or quand il l'est, voile quand
il ne l'est pas — à partir du niveau du joueur. Un halo ou un cadenas dessiné
dans le fichier contredit ce calcul un chapitre sur deux.

Les deux sources qui en portaient un ont été traitées différemment, parce que
la géométrie ne laissait pas le choix :

- **`desert.jpg`** porte un halo doré, DESSINÉ par-dessus le damier. Là, il n'y
  a plus de damier à reconnaître — les carreaux n'y alternent plus — donc
  aucune analyse ne peut le retirer. Le halo étant hors du disque, on recadre
  sur le cercle du médaillon (option `--cercle`, voir `tools/detourer.py`).
- **`volcan.jpg`** portait un cadenas, et lui chevauchait le disque : impossible
  à découper sans entamer le dessin. Il a fallu régénérer l'image. C'est
  **`volcanbon.jpg`** qui sert aujourd'hui, et c'est la bonne façon de s'en
  sortir — corriger la source plutôt que rattraper au découpage.

## Refaire un fichier

Les commandes exactes, une par image :

```
python3 tools/detourer.py "images/Olympe.jpg"          assets/ui/olympe.png    256x256
python3 tools/detourer.py "images/passe de combat.jpg" assets/ui/passe.png     256x256
python3 tools/detourer.py "images/boutique.jpg"        assets/ui/boutique.png  256x256
python3 tools/detourer.py "images/pièce-or.jpg"        assets/ui/piece-or.png  192x192
python3 tools/detourer.py "images/laurier.jpg"         assets/ui/laurier.png   192x192
python3 tools/detourer.py "images/zeus joueur.jpg"     assets/ui/zeus.png      256x256
python3 tools/detourer.py "images/vague.jpg"           assets/ui/vague.png     256x256
python3 tools/detourer.py "images/foret.jpg"           assets/ui/foret.png     256x256
python3 tools/detourer.py "images/volcanbon.jpg"       assets/ui/volcan.png    256x256
python3 tools/detourer.py "images/bouton match.jpg"    assets/ui/bouton-match.png     768x768
python3 tools/detourer.py "images/bouton continuer.jpg" assets/ui/bouton-continuer.png 768x768
python3 tools/detourer.py "images/desert.jpg"          assets/ui/desert.png    256x256 \
    --cercle 512,575,444
```
