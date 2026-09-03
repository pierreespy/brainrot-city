# Journal des modifications — Divine City

> Les modifications les plus **récentes** sont en haut.
> À lire en premier quand tu reprends le projet.

**Convention** — à chaque changement notable, ajouter un bloc en haut du fichier
avec : la date, l'auteur, ce qui a changé, les fichiers touchés, ce qui a été
vérifié, et ce qui a été supprimé ou cassé.

---

## 2026-09-03 — Claude — La feuille de route passe de 13 à 50 milestones

**Résumé** — Découpage beaucoup plus fin de la feuille de route pour cadrer
précisément le travail restant : 30-50 personnages/dieux/décors à produire,
7 capacités divines, plusieurs types de mortels, la publication. Chaque
étape future doit rester petite et vérifiable. **Aucun code de gameplay n'a
changé** : ce bloc ne touche que la documentation et les commentaires citant
un numéro de milestone. Les **commits Git passés gardent leurs anciens
numéros** (`Milestone 8 : la cité grecque`, etc.) — l'historique n'est pas
réécrit.

### Ancienne → nouvelle numérotation

| Ancien # | Nouveau # | Contenu |
|---|---|---|
| 1 | 1 | Projet + scène + déplacement du joueur |
| — (Expo) | 2 | Migration vers Expo + joystick tactile |
| 2 | 3 | Ville simple + caméra |
| 3 | 4 | Mortels : spawn + déambulation |
| 4 | 5-6 | Conversion au contact + propagation dans le cortège |
| 5 | 7 | Système de cortège |
| 6 | 8 | HUD : compteur + relance |
| 7 | 9-10 | Optimisation : profileur/banc de mesure + tri par instance |
| 8 | 11 | La cité grecque |
| 9 | 12-18 | Panthéon (roster, sélection, apparence, déblocage) + mortels spécialisés (hoplite, prêtresse, philosophe) |
| 10 | 19-27 | Capacités divines : contrat + une milestone par dieu + équilibrage |
| 11 | 28-32 | Cortèges rivaux (IA, combat, plusieurs rivaux, UX, perf) |
| 12 | 33-44 | Game feel, audio, haptique, réglages qualité, contenu visuel |
| — (nouveau) | 45-46 | Décisions de design encore ouvertes (mode de jeu, monétisation) |
| 13 | 47-50 | Publication |

La feuille de route à jour est dans **[`README.md`](./README.md#feuille-de-route)**.

### Notes

- Le H1 de ce journal, resté « Brainrot City » depuis le renommage du jeu,
  est corrigé en « Divine City ».
- La table dupliquée et obsolète en fin de fichier (dans le bloc de la
  Milestone 1) est remplacée par un renvoi vers le README, pour ne plus avoir
  deux feuilles de route à maintenir.
- Les commentaires de code citant un numéro de milestone (`src/config.ts`,
  `src/ui/Hud.tsx`, `src/world/City.ts`, `src/world/districts.ts`,
  `src/entities/Mortals.ts`, `src/entities/Retinue.ts`, `src/ui/Stats.tsx`)
  sont mis à jour vers la nouvelle numérotation dans ce même changement.

---

## 2026-09-02 — Claude — 🏛️ Milestone 8 : la cité grecque

**Résumé** — La grille uniforme devient une **cité en six quartiers** : Agora,
Céramique, Acropole, Port, Théâtre, Bois sacré. Marbre et tuiles, colonnes,
oliviers, et la mer au bout du port. Le budget de la Milestone 7 tient :
**0,087 ms de calcul par image** sur les 16,7 disponibles.

### Ajouté

| Fichier | Rôle |
|---|---|
| `src/world/districts.ts` | ⭐ Le PLAN : quel quartier occupe quel pâté |
| `src/world/Population.ts` | Le contrat de « où naissent les mortels » |

### Le vrai sujet : on se perdait

Le défaut était noté depuis la Milestone 2, dans le README comme dans
UNIVERS.md : **tous les carrefours se ressemblaient, donc on s'y perdait et on
ne mesurait pas sa progression.** Les monuments ne suffisent pas à corriger ça.
Trois choses y répondent, et la première fait l'essentiel du travail :

1. **La couleur du sol.** La caméra plonge de 40 unités : ce que le joueur voit
   le plus, c'est le sol. Chaque quartier a sa dalle — marbre pâle à l'agora,
   ocre à la Céramique, vert au bois sacré, gris-vert au port. On sait qu'on a
   changé d'endroit avant d'avoir vu le moindre bâtiment. Et cela n'a rien
   coûté : la dalle de pâté existait déjà depuis la M2, elle a juste pris une
   couleur.
2. **Le nom du quartier**, annoncé sous le compteur quand on y entre.
3. **La densité de mortels par quartier** : ×2,6 à l'agora, ×3 au théâtre,
   ×0,4 au bois sacré. C'est ce qui transforme le choix d'une direction en
   vrai choix.

### ⚠️ Le repère « visible de loin » était impossible

UNIVERS.md promettait une Acropole « visible depuis toute la carte ». Le calcul
dit non : la caméra est à 40 unités de haut, inclinée de 66°, avec 60° de
champ — **le haut de l'écran touche le sol à 55 unités**. Rien ne dépasse cet
horizon, quelle que soit sa hauteur.

Un temple deux fois plus grand ne se verrait donc pas de plus loin ; il
masquerait seulement le joueur qui passe devant, ce que la M2 avait déjà
interdit en plafonnant la hauteur des bâtiments. L'Acropole reste donc à
hauteur de maison, et c'est sa **dalle claire** et sa colonnade qui la font
reconnaître. UNIVERS.md a été corrigé plutôt que le jeu.

### Le toit, ou pourquoi une cité paraît grecque

Vue de 40 unités de haut, une maison est **essentiellement un toit**. C'est la
tuile, pas la façade, qui fait l'essentiel du dépaysement — et c'est aussi ce
qui a demandé le plus d'allers-retours en capture :

| Ce qu'on a essayé | Ce que ça donnait |
|---|---|
| 2 × 2 parcelles par pâté (comme en M2) | Quatre **énormes** toits rouges par pâté |
| 3 × 3 parcelles, pâté plein | Un tissu de petites toitures — mais des pièges (voir plus bas) |
| 3 × 3 en **anneau autour d'une cour** | Retenu : des toitures serrées, des cours, des venelles |

### 🐞 Deux pièges à personnages, trouvés par le banc

Le banc de mesure de la M7 a gagné sa place : il a attrapé les deux, en
chiffres, avant qu'on les voie à l'œil.

**1. Les maisons mitoyennes piégeaient les fidèles.** La collision ressort un
personnage de la maison où il est, par le côté le plus court. Si les maisons se
touchent, en sortir d'une le fait entrer dans la voisine, qui le renvoie dans
la première : **un cycle stable**, que répéter la passe ne casse pas. Sous la
pression d'un cortège de 600, jusqu'à **40 fidèles sur 600** finissaient dans
un mur, là où la règle est zéro.

> `Collider.extract()` remplace `resolve()` pour la foule. À chaque tour, il
> cherche l'obstacle où l'on est le **plus** enfoncé, essaie ses quatre
> sorties, et garde celle qui laisse le moins d'enfoncement **total**. Cette
> quantité décroît strictement : le cycle devient impossible. Coût : seulement
> pour ceux qui touchent vraiment quelque chose.

**2. Les cours fermées enfermaient pour de bon.** Une cour sur cinq se
retrouvait ceinturée de maisons sans ouverture. Un fidèle poussé là n'en
ressortait jamais — étalement du cortège mesuré à **82 unités**. Chaque pâté
laisse désormais une parcelle du pourtour vide : c'est la venelle qui ouvre la
cour sur la rue.

Le même banc a aussi imposé le **quai** : sans lui, la rue du bord ne faisait
que 5,5 unités entre les entrepôts et la mer, et le cortège s'y écrasait. Les
entrepôts sont donc en retrait d'une parcelle — ce qu'un port devrait être de
toute façon.

### Ce qui bloque, et ce qui ne bloque pas

Murs, plateformes, gradins et entrepôts sont des obstacles. **Colonnes et
oliviers n'en sont pas.** Ce n'est pas un oubli : la M7 avait mesuré qu'un seul
fidèle coincé décroche de 40 unités, et les obstacles fins sont exactement ce
qui les coince. Semer une forêt de poteaux dans les rues coûterait plus en
jouabilité que ça ne rapporte en réalisme.

Les oliviers ont d'ailleurs été **rapetissés** après capture : traversables et
larges, ils passaient au-dessus du joueur et le cachaient. Sur un jeu où l'on
suit sa propre foule, perdre son personnage de vue une seconde est déjà trop.

### Le budget, vérifié plutôt que supposé

| Partie réelle (cortège d'une cinquantaine) | M7 | M8 |
|---|---|---|
| Calcul par image | 0,070 ms | **0,087 ms** |
| Triangles par image | 9 119 | **20 710** |
| … dont le décor | 3 196 | **12 858** |
| Mortels dessinés | 18 / 450 | 20 / 450 |

| Pire cas (cortège plein, 600 fidèles) | M7 | M8 |
|---|---|---|
| Calcul par image | 0,772 ms | **0,844 ms** |
| Triangles par image | 53 604 | **70 839** |

Le décor a **quadruplé** en géométrie — toits, colonnes, oliviers, gradins,
pavage — et reste marginal devant la foule. C'était tout l'intérêt de faire la
M7 **avant** la M8 : on savait où était le budget avant de dépenser.

### Vérifié

- [x] `npm run typecheck` — OK
- [x] `npm run bench` — **0 mortel et 0 fidèle dans un mur** dans les deux
      scénarios, et les 8 directions de la grille de répulsion
- [x] Banc web (Chromium, 390 × 844), tour des six quartiers : **aucune erreur
      console**, le nom du quartier suit bien le joueur, 190 bâtiments
- [x] Bord du monde à **98,4**, joueur jamais dans un mur
- [x] Relance, joystick sous le HUD, affichage de debug : inchangés
- [x] Captures des six quartiers relues une à une — c'est ainsi qu'on a
      attrapé les toits géants, le temple illisible et les arbres qui cachent

### ⚠️ Ce qui reste ouvert

- **Les hoplites, prêtresses et philosophes** étaient annoncés pour cette
  milestone. Ils demandent un mesh par type et des comportements propres
  (fuir, rester immobile), et la prêtresse recharge une capacité qui n'existe
  qu'en M10. Ils partent donc avec le panthéon, en **M9**. La densité de
  mortels par quartier, elle, est déjà là et les attend.
- **Le cortège reste trop dense à 600** : 44 % de fidèles superposés, étalement
  moyen de 69 unités. C'est la limite mesurée en M7 — 600 fidèles pour une rue
  de 11 unités, soit quatre fois trop de monde — et la cité n'y change rien.
  Personne n'est plus coincé dans un mur, mais le plafond jouable reste bien
  en dessous de `retinue.maxSize`.

**Cassé** — L'ancienne ville grise a disparu : palette, sol, ciel et lumière
sont ceux d'une cité de Méditerranée. `city.palette` et `city.sidewalkColor`
n'existent plus (les couleurs vivent dans `districts.ts`), et `lotDepth` est
figé à 1 — au-dessus, les maisons se chevauchent et piègent les personnages.

---

## 2026-09-02 — Claude — ⚡ Milestone 7 : première passe d'optimisation

**Résumé** — Le jeu est désormais **mesuré**, puis optimisé à partir de ces
mesures. En partie réelle : **0,070 ms de calcul par image contre 0,245**, et
**9 119 triangles contre 131 512**. Deux nouveaux outils : un banc de mesure
(`npm run bench`) et un affichage de debug qui marche sur le téléphone.

> **Cette entrée fusionne deux Milestone 7** menées en parallèle par deux
> sessions. Elles ont trouvé le même coupable — la géométrie de la foule — mais
> ne se recouvraient qu'à moitié : l'une a traité le **dessin** (découpage des
> corps, anticrénelage, mortels hors champ), l'autre le **dessin et le
> processeur** (tri par tronc de vision, banc de mesure, boucles chaudes). Là
> où elles se contredisaient, c'est la mesure qui a tranché — voir « Les
> arbitrages entre les deux versions » plus bas.

### Ajouté

| Fichier | Rôle |
|---|---|
| `src/core/Profiler.ts` | ⭐ Ce que coûte une image, étape par étape |
| `src/core/instancing.ts` | Écrire une silhouette dans un mesh instancié, vite |
| `src/systems/ViewCulling.ts` | ⭐ Ce que la caméra cadre — donc ce qu'on paie |
| `src/ui/Stats.tsx` | L'affichage de debug (touche le compteur de fidèles) |
| `tools/bench.ts` | ⭐ Le banc de mesure : la vraie simulation, sans écran |
| `tools/check-separation.ts` | Vérifie que la grille de répulsion n'oublie rien |
| `tsconfig.bench.json` | Compilation du banc (hors application) |

### D'abord mesurer, ensuite optimiser

La Milestone 2 avait laissé un avertissement dans le code : une réécriture
soignée de la grille de collision n'avait **rien** changé aux fps, parce que le
coût était ailleurs. On a donc commencé par construire de quoi savoir.

`npm run bench` rejoue la vraie simulation — mêmes fichiers, même graine, un
joueur automatique qui descend les rues et tourne — sans écran ni carte
graphique. 90 secondes de jeu en quelques secondes, et le coût de chaque étape.

Le verdict a été net, et différent de ce qu'on aurait deviné :

| Poste | Avant |
|---|---|
| Toute la logique du jeu | 0,245 ms sur les 16,7 d'une image |
| **Triangles envoyés au GPU** | **288 796 par image au pire cas** |
| … dont la cité entière (124 immeubles, 434 bandes) | 3 196, soit **1 %** |

Autrement dit : **99 % de ce qu'on faisait dessiner était de la foule, et la
quasi-totalité de cette foule était hors de l'écran.**

### Les quatre idées qui ont tout fait

**1. Ne dessiner que ce qui est cadré.** La caméra est haute et penchée : elle
ne montre qu'une quarantaine d'unités devant le joueur, sur une cité de 198.
Three.js sait écarter un *objet* hors champ, mais pas une *instance* — et la
foule entière ne forme qu'un seul objet, toujours à l'écran. `ViewCulling` fait
ce tri silhouette par silhouette, avec le tronc de vision de la caméra plutôt
qu'un rayon autour du joueur : un rayon devrait être taillé pour le pire écran,
étroit sur un téléphone vertical, trois fois plus ouvert en fenêtre large.

> Effet mesuré : **18 mortels dessinés sur 450**, sans que rien ne manque à
> l'écran (vérifié en capture, y compris en bord de cadre).

**2. Alléger la silhouette — mais pas n'importe comment.** Une capsule de
4 × 8 segments pèse **272 triangles**, en 2 × 8 seulement **144**. Les deux
réglages ne se valent pas : la caméra plonge de haut, donc c'est le découpage
**radial** qui dessine le contour visible, tandis que les calottes ne coûtent
que des triangles. On divise donc les calottes par deux et on garde les 8
côtés. Descendre le radial à 6 gagnait encore 25 %, mais transformait les
mortels proches en cailloux à facettes (constaté en capture des deux côtés).

**3. Couper l'anticrénelage**, dans le renderer **et** sur `GLView`
(`msaaSamples={0}`). Ce second réglage est propre à iOS, qui applique par
défaut 4 échantillons par pixel sur un écran déjà très dense. ⚠️ Le banc web ne
peut pas le mesurer, mais c'est l'un des postes les plus lourds sur téléphone.

**4. Ne pas faire marcher ce que personne ne regarde.** Un mortel hors champ
avance une image sur quatre, d'un pas quatre fois plus long : le temps qui lui
est dû est **accumulé, pas perdu**. Il parcourt la même distance et se retrouve
au bon endroit quand le joueur arrive. Le pas reste de 17 cm, très inférieur à
l'épaisseur d'un mur : aucun risque de traverser une façade.

### Et le travail d'artisan sur les boucles chaudes

- **Les matrices d'instances sont écrites à la main.** Un `Object3D` de service
  convertissait un angle en quaternion puis recomposait 16 nombres, 1 050 fois
  par image, pour une rotation autour d'un seul axe. Une matrice de rotation
  en Y ne contient que quatre nombres variables ; le reste est écrit une fois
  pour toutes (`instancing.ts`).
- **`Math.hypot` → racine carrée** dans les boucles du cortège : mesuré
  **13,6 fois plus rapide** sur 5 millions d'appels. `hypot` protège d'un
  dépassement de capacité dont des distances de quelques dizaines d'unités sont
  très loin.
- **L'étalement du cortège était calculé deux fois** par image, une fois pour
  rien. Il ne l'est plus qu'une, et au carré — une seule racine à la fin.
- **Envoi partiel du tampon d'instances** : on ne transmet plus au GPU que la
  plage réellement utilisée, au lieu des 38 ko du cortège complet.
- **Les collisions** n'interrogent plus que les cases que le personnage touche
  vraiment — une, parfois deux — au lieu des neuf qui l'entourent. C'est
  correct par construction : un immeuble est inscrit dans toutes les cases que
  son rectangle touche, donc aucun contact ne peut échapper au test.

### 🐞 Le jeu ralentissait à mesure qu'on visitait la cité

La grille de répulsion du cortège se vidait en parcourant **toutes** ses cases.
Or elle en crée une pour chaque mètre carré que la foule traverse, et n'en
retire jamais : après quelques secondes de course, c'étaient 2 500 cases vidées
deux fois par image — et cela ne faisait que monter, pour toute la partie.

On ne vide plus que les cases qu'on a remplies. Au passage, chaque fidèle
n'examine plus que **cinq** cases voisines au lieu de neuf : une paire de cases
adjacentes ne se rencontre alors qu'une fois, celle qu'on ne regarde pas nous
regardera.

| `Retinue.separate()`, 600 fidèles | ms / image |
|---|---|
| Avant | 0,617 |
| Après | **0,336** |

Ce raccourci du demi-voisinage est le genre de raisonnement qui est juste
jusqu'à ce qu'il ne le soit plus, et dont le symptôme serait discret (des
fidèles qui se traversent dans une seule direction). `tools/check-separation.ts`
le vérifie donc à chaque `npm run bench` : deux fidèles voisins, dans les huit
directions, doivent se repousser. **Les 8 sont couvertes.**

### Le résultat

| Partie réelle (60 s, cortège d'une trentaine) | Avant | Après |
|---|---|---|
| joueur | 0,003 | 0,002 |
| caméra | 0,007 | 0,010 |
| mortels | 0,148 | **0,029** |
| conversion | 0,005 | 0,006 |
| cortège | 0,082 | **0,022** |
| **total processeur** | **0,245 ms** | **0,070 ms** |
| Mortels dessinés | 450 / 450 | **18 / 450** |
| Triangles par image | 131 512 | **9 119** |

| Pire cas : cortège plein (600 fidèles) | Avant | Après |
|---|---|---|
| mortels | 0,186 | **0,033** |
| conversion | 0,051 | 0,044 |
| cortège | 1,341 | **0,687** |
| **total processeur** | **1,584 ms** | **0,772 ms** |
| Fidèles dessinés | 600 / 600 | **337 / 600** |
| Triangles par image | 288 796 | **53 604** |

Sur le banc web (Chromium, **GPU logiciel**, format téléphone 390 × 844) :

| Images par seconde | Avant | Après |
|---|---|---|
| À l'arrêt | 8,5 | **12,1** |
| En course | 8,5 | **11,7** |

⚠️ Ce dernier chiffre ne dit rien d'un vrai téléphone : le banc rend ses pixels
sans carte graphique, et il ne voit ni `msaaSamples` ni l'anticrénelage
matériel. Il confirme le sens de la marche, rien de plus. C'est justement pour
cela que l'affichage de debug existe.

### Les arbitrages entre les deux versions

| Sujet | Retenu | Pourquoi |
|---|---|---|
| Découpage radial | **8 côtés** | Testé à 6 puis 5 : cailloux à facettes sur les mortels proches. Le gain ne valait que sur le GPU logiciel du banc. |
| Tri hors champ | **tronc de vision** | Une distance en dur (55 u) doit être taillée pour le pire écran et recalculée à chaque changement de caméra ; le tronc s'adapte seul. Le calcul qui donnait 55 reste noté dans `crowd.cullMargin` comme vérification. |
| Anticrénelage | **coupé** | Un des postes les plus lourds sur mobile, invisible pour le banc — donc facile à manquer si l'on ne mesure que le banc. |
| Affichage de debug | **panneau détaillé, allumé au toucher** | Le coût par étape vaut mieux qu'un seul fps ; et un appui sur le compteur évite de recompiler, donc `debug.showStats` peut rester à `false` par défaut. |
| Compte de triangles | **`renderer.info`** | Compté par Three.js lui-même, pas estimé par nous. |
| Boucles processeur | **optimisées** | Une mesure ponctuelle disait « 1,13 ms, rien à gagner ». Elle ratait le fait que ce coût **montait avec la durée de la partie** (voir le bug ci-dessus). |

### Ce qui a été mesuré, puis laissé tel quel

L'inverse d'une optimisation est aussi une décision, et elle mérite d'être
écrite :

- **Descendre à 39 000 triangles** (1 calotte, 5 côtés) : possible, 30 % de
  gain de plus **sur le banc**. Refusé, la perte visuelle était nette — et
  optimiser pour un GPU logiciel, c'est optimiser pour la mauvaise machine.
- **Découper la ville en quartiers pour la trier par morceaux** : elle ne pèse
  que 3 196 triangles sur 53 604. Rien à gagner. (Le découpage en quartiers de
  la M8 se fera donc pour le *jeu*, pas pour la performance.)
- **Une grille en tableau plat plutôt qu'en table de hachage** pour la
  répulsion : environ 0,15 ms gagnées sur 0,77, au prix d'un code nettement
  moins lisible. Le budget est tenu.
- **La conversion** (0,044 ms) : son filtre grossier suppose que le cortège
  reste groupé autour du joueur. Le banc montre que cette hypothèse tombe dès
  qu'un fidèle décroche (voir ci-dessous). Le coût mesuré ne justifie pas de le
  remplacer aujourd'hui — mais il faudra y revenir en M11, avec les cortèges
  rivaux.

### ⚠️ Deux défauts de jeu que le banc a révélés (et qui restent entiers)

Ils ne sont pas nés en M7 : les mêmes chiffres sortent du code d'avant. Le banc
les a simplement rendus visibles, en jouant un trajet plus dur que celui de la
M5 — un joueur qui longe les façades plutôt que le milieu des rues.

1. **Un fidèle peut rester coincé contre une façade** une demi-seconde, et se
   retrouver à **40 à 80 unités** derrière le cortège avant de revenir. La M5
   avait mesuré 11,9 au pire sur son propre trajet ; ce n'était pas le pire
   trajet. C'est un sujet de formation, pas de performance.
2. **600 fidèles ne tiennent pas dans une rue de 11 unités de large.** Le
   cortège s'étale sur environ 16 unités de chemin : il y a quatre fois trop de
   monde pour la place disponible, d'où **45 à 48 % de fidèles superposés**
   (contre 3 % avec une trentaine). Le plafond jouable est bien plus bas que
   `retinue.maxSize`, ou bien il faudra que les fidèles s'écartent dans les
   rues perpendiculaires.

À traiter avec la cité de la M8 et les rivaux de la M11 — les deux changent
justement la façon dont la foule occupe l'espace.

### Modifié

- `src/entities/Mortals.ts` — une seule boucle qui cadre, simule et dessine ;
  plus rien d'alloué par image.
- `src/entities/Retinue.ts` — grille de répulsion revue, racines carrées,
  étalement calculé une seule fois, tri par instance à l'affichage.
- `src/world/City.ts` — collisions restreintes aux cases réellement touchées,
  `isFree()` sans allocation.
- `src/core/Game.ts` — profileur branché sur les six étapes d'une image ; **la
  caméra passe avant la foule** (c'est son champ qui décide de ce qu'on
  dessine ; elle ne lit que la position et la vitesse du joueur, déjà à jour,
  donc son comportement est inchangé) ; `getStats()`.
- `src/core/createRenderer.ts` — anticrénelage piloté par `render.antialias`.
- `src/config.ts` — sections `crowd`, `render`, `debug` et `profiler`,
  `mortals.offscreenSlices`.
- `src/ui/Hud.tsx`, `App.tsx` — le compteur devient un bouton qui affiche les
  mesures ; le panneau vient les chercher, le jeu ne les pousse pas ;
  `msaaSamples={0}` sur la surface 3D.
- `package.json` — `npm run bench`.

### Vérifié

- [x] `npm run typecheck` — OK
- [x] `npm run bench` — les deux scénarios, plus les 8 directions de la grille
      de répulsion
- [x] Banc web (Chromium, 390 × 844) : **aucune erreur console**, le jeu tourne,
      convertit, le cortège suit
- [x] **0 mortel et 0 fidèle dans un immeuble**, le joueur non plus
- [x] Bord du monde à **98,4** — identique à la M6
- [x] Le compteur affiche **0** au lancement et suit le score
- [x] Le bouton **↻** remet le score à 0, vide le cortège et replace le joueur
      en (0, 0)
- [x] Le **joystick reste utilisable** sous le HUD (glissé de 15,9 unités)
- [x] L'affichage de debug s'allume et s'éteint au toucher du compteur
- [x] Rien ne manque en bord de cadre malgré le tri par instance (captures)

**Cassé** — Rien. Aucun réglage de jeu n'a changé : mêmes vitesses, mêmes
distances, même ville. Seules les silhouettes ont deux calottes de moins, et
l'anticrénelage est coupé.

---

## 2026-09-02 — Claude — 📊 Milestone 6 : le HUD

**Résumé** — Le score s'affiche enfin : **compteur de fidèles**, **bouton de
relance**, et l'**emplacement réservé à la capacité divine** de la Milestone 10.

### Ajouté

| Fichier | Rôle |
|---|---|
| `src/ui/Hud.tsx` | ⭐ Compteur, relance, emplacement de la capacité |

### Le vrai sujet : ne pas redessiner l'interface 60 fois par seconde

Le jeu tourne à 60 images par seconde. Prévenir React à chaque image
déclencherait 60 rendus d'interface par seconde… pour afficher un nombre.

Le jeu ne publie donc son score que s'il a **changé**, et au plus toutes les
120 ms (`hud.scorePublishInterval`) — 8 fois par seconde, ce que l'œil lit
comme instantané.

| Mesure, pendant 1,6 s de conversions en rafale | Valeur |
|---|---|
| Mises à jour réelles du texte | **10** |
| Ce qu'aurait donné une publication par image | 96 |
| Score affiché contre score réel du jeu | **identiques** |

Le lien va dans un seul sens : `Game.onFaithfulChange` annonce un nombre, et
le jeu ignore ce qu'est un HUD. L'interface peut donc être redessinée sans
jamais toucher au moteur.

### L'emplacement de la capacité est réservé DÈS MAINTENANT

C'était la contrainte notée en adoptant le thème : décider de la place du
bouton après coup obligerait à redessiner tout le HUD, et le pouce du joueur
aura déjà pris ses habitudes. Il est donc affiché **éteint et non cliquable**,
en bas à droite, en attendant la Milestone 10.

### ⚠️ L'ordre des couches, qui n'est pas un détail

Le joystick est déclaré **avant** le HUD dans `App.tsx` : en React Native, la
dernière couche déclarée reçoit le doigt. C'est ce qui rend le bouton de
relance cliquable **tout en** laissant le reste de l'écran au joystick.
Vérifié au banc : un glissé sous le HUD déplace bien le joueur de 28 unités.

### 🐞 Corrigé au passage : la partie commençait à 1 fidèle

Un mortel naissait parfois sous les pieds de la divinité et se faisait
convertir à la première image. `mortals.spawnClearance` tient désormais une
zone de 7 unités libre autour du point de départ. Le compteur affiche bien
**0** au lancement.

### Modifié

- `src/core/Game.ts` — `onFaithfulChange`, publication filtrée, remise à zéro
  immédiate du compteur au `restart()`.
- `App.tsx` — un seul état React (le score), le HUD et la relance branchés ;
  l'ancien panneau titre/consigne disparaît au profit du HUD.
- `src/config.ts` — section `hud`, `mortals.spawnClearance`.

### Vérifié (banc de test web, Chromium, format téléphone 390 × 844)

- [x] `npm run typecheck` — OK, aucune erreur console
- [x] Le compteur affiche **0** au lancement, puis suit exactement le score
      réel (750 contre 750)
- [x] **10 mises à jour** du texte en 1,6 s de conversions, contre 96 possibles
- [x] Le bouton **↻** remet le score à 0, vide le cortège et replace le joueur
      en (0, 0)
- [x] Le **joystick reste utilisable** sous le HUD
- [x] Aucune régression : formation (retard max 11,0 ; 13 chevauchements ; 0
      fidèle dans un mur), joueur bloqué à `x = 4,9`, bord du monde à 98,4

**Cassé** — L'ancien panneau « titre + consigne » du coin supérieur gauche a
disparu, remplacé par le compteur. La consigne de déplacement n'est plus
affichée : à réintroduire comme tutoriel en Milestone 12 si besoin.

---

## 2026-09-02 — Claude — 🏛️ Milestone 5 : la formation du cortège

**Résumé** — Le cortège n'est plus un tas de fidèles qui poussent contre les
murs : c'est une **foule cohérente** qui repasse par le chemin du dieu et dont
les membres s'écartent les uns des autres. Testé jusqu'à **600 fidèles**.

### Ajouté

| Fichier | Rôle |
|---|---|
| `src/systems/PlayerTrail.ts` | ⭐ La trace du dieu : un point tous les 35 cm |

### Les deux défauts connus, et leur remède

**1. Les traînards.** Chaque fidèle visait la *position* du dieu en ligne
droite : dès qu'un immeuble se trouvait entre les deux, il poussait contre la
façade et décrochait — **33 unités de retard** mesurées en M4.

> Un cortège ne doit pas viser où est son dieu, mais **repasser par où il est
> passé**. Chaque fidèle suit désormais un point situé à
> `lagMin + lagStep × √rang` derrière lui **sur sa trace**.

| | Avant (M4) | Après (M5) |
|---|---|---|
| Pire retard sur tout un parcours | **32,9 unités** | **11,9** |
| Retard médian | 3,2 | 4,9 |

**2. L'empilement.** Tous visaient le même point, donc s'y superposaient.
Deux réglages, trouvés par la mesure :

- `arriveRadius` — un fidèle **cesse de chasser sa cible** dès qu'il en est
  assez près, ce qui laisse à la répulsion la place d'étaler la foule ;
- les nouveaux arrivants naissent avec un **léger écart aléatoire** : sans
  lui, deux conversions simultanées créaient deux fidèles au **même point
  exact**, et la répulsion n'avait aucune direction où pousser.

| Paires de fidèles superposées | Taux |
|---|---|
| Première version (sans les deux réglages) | **30 %** |
| Avec `arriveRadius` + deux passes de répulsion | 5,6 % |
| Avec l'écart à la naissance | **2,6 %** (à 600 fidèles) |

### Le coût, mesuré à 600 fidèles

| Mesure | Valeur |
|---|---|
| `Retinue.update()` — chemin, répulsion, collisions, matrices | **1,22 ms/frame** |
| Mortels + conversion | 0,16 ms/frame |
| **Total de nos boucles** | **1,37 ms** sur les 16,7 ms d'une frame à 60 Hz |

Trois précautions expliquent ce chiffre :

- **Un seul parcours de la trace pour tout le cortège.** Les retards allant
  croissant avec le rang, un curseur avance dans la trace au fil des fidèles
  au lieu de la relire 600 fois.
- **La répulsion passe par une grille** dont la case vaut exactement la
  distance de répulsion : chaque fidèle n'est comparé qu'à ses voisins de 9
  cases, jamais aux 599 autres (180 000 paires évitées).
- **Rien n'est alloué par frame** : grille, seaux et vecteurs de travail sont
  réutilisés d'une image à l'autre.

### Modifié

- `src/entities/Retinue.ts` — `update()` réécrite en trois temps : suivre le
  chemin, se repousser, ne finir ni dans un mur ni hors de la cité.
- `src/config.ts` — section `retinue` refondue (`trail*`, `lag*`,
  `arriveRadius`, `separation*`), chaque valeur commentée avec ce qu'elle
  casse si on la change.
- `src/core/Game.ts` — la trace est mise à jour à l'étape 4 et remise à zéro
  par `restart()`.

### Vérifié (banc de test web, Chromium, format téléphone 390 × 844)

- [x] `npm run typecheck` — OK, aucune erreur console
- [x] **Retard maximal 11,9 unités** sur 50 changements de direction, contre
      32,9 en M4
- [x] **2,6 % de paires superposées** à 600 fidèles, contre 30 % au premier jet
- [x] **0 fidèle dans un mur**, en surveillance continue
- [x] **Coûts ci-dessus**, mesurés avec un cortège de 600
- [x] La foule tient la rue et contourne les immeubles (capture à l'appui)
- [x] Aucune régression : joueur bloqué à `x = 4,9`, glissement, bord du
      monde, 450 mortels toujours vivants, `restart()` remet tout à zéro

### ⚠️ Ce qui reste

- **Le score n'est toujours pas affiché** : c'est le HUD de la Milestone 6.
- Les fps du banc (17) restent dictés par son **GPU logiciel**, pas par notre
  code : 1,37 ms de calcul contre 16,7 ms disponibles. La mesure qui compte
  reste celle du téléphone.

**Cassé** — Rien.

---

## 2026-09-02 — Claude — ⚡ La conversion fait boule de neige

**Demandé** — Un mortel doit être converti quand il est touché **par la
divinité ou par un fidèle déjà converti**, et non par la seule divinité.

**Effet mesuré** — Sur le même trajet de 40 secondes : **39 fidèles** contre
19 à 32 auparavant. C'est le comportement qui fait le genre : plus le cortège
est large, plus il ratisse.

### Le piège évité : 270 000 tests par frame

Comparer naïvement 450 mortels à 600 fidèles ferait 270 000 tests à chaque
image. La solution tient en une observation : **le cortège reste groupé autour
du joueur**. Au-delà de son étalement plus le rayon de conversion, aucun fidèle
ne peut toucher qui que ce soit.

`Retinue` mesure donc cet étalement **gratuitement**, pendant la boucle de
suivi qu'elle parcourt déjà. `Conversion` s'en sert comme filtre grossier : une
soustraction par mortel écarte la quasi-totalité de la cité, et seuls les rares
survivants sont comparés aux fidèles un par un.

| Mesure | Valeur |
|---|---|
| Coût de la conversion, cortège vide | **0,022 ms/frame** |
| Coût de la conversion, cortège de 47 | **0,003 ms/frame** |
| Coût total de nos boucles | **0,18 ms/frame** (1 % du budget) |

### 🎨 Un réglage corrigé au passage

Avec un cortège dense, **la divinité disparaissait dans sa propre foule**
(constaté en capture). `retinue.minDistance` passe de 1,5 à **2,4** : le
premier rang de fidèles laisse désormais un anneau libre autour du joueur, qui
reste repérable à l'écran.

### Modifié

- `src/entities/Retinue.ts` — `spreadRadius` et `hasFollowerNear()`.
- `src/entities/Mortals.ts` — `takeNear()` accepte un second test de contact.
- `src/systems/Conversion.ts` — le filtre en deux temps.
- `src/config.ts` — `retinue.minDistance` 1,5 → 2,4.

### Vérifié

- [x] `npm run typecheck` — OK, aucune erreur console
- [x] **39 fidèles** en 40 s contre 19-32 avant
- [x] Coûts mesurés ci-dessus, avec un cortège de 47
- [x] **0 fidèle dans un mur**, toujours 450 mortels dans la cité
- [x] La divinité reste visible dans un cortège dense (capture à l'appui)

**Cassé** — Rien.

---

## 2026-09-02 — Claude — ⚡ Milestone 4 : la conversion au contact

**Résumé** — Toucher un mortel le convertit : il quitte la cité et rejoint le
**cortège**, qui grandit derrière le joueur. Le score existe.

### Ajouté

| Fichier | Rôle |
|---|---|
| `src/entities/Retinue.ts` | Le cortège : le score et les fidèles qui suivent |
| `src/systems/Conversion.ts` | Le contact : branche le vivier et le cortège |

Le découpage en trois fichiers n'est pas décoratif : `Mortals` ignore le
cortège, `Retinue` ignore d'où viennent ses fidèles, et `Conversion` est le
seul endroit où les deux se rencontrent. C'est là que se grefferont la Foudre
de Zeus et le Charme d'Aphrodite (M10) : elles ne changeront que le rayon.

### La densité était fausse, et ça se mesure

Avec les 100 mortels de la M3 : **3 conversions en 40 secondes de course**.
Injouable. Le calcul le confirme — le joueur balaie 68 unités² par seconde sur
les 39 200 de la cité, soit une conversion toutes les six secondes.

`mortals.count` passe donc de 100 à **450**, valeur calculée pour viser une
conversion par seconde. Mesuré ensuite : **19 à 32 conversions en 40 s** selon
le trajet. Le commentaire de `config.ts` explique le calcul, pour que la valeur
soit recalculable si la taille de la cité ou le rayon de conversion changent.

### 🐞 Un bug que les chiffres ne montraient pas

Le compteur affichait **23 fidèles et l'écran n'en montrait aucun.**

Three.js calcule une sphère englobante pour décider si un objet est à l'écran.
Il la calculait ici alors que le cortège était encore **vide**, puis la gardait
en cache : les fidèles ajoutés ensuite tombaient hors de cette sphère périmée,
et l'objet entier était écarté du rendu dès qu'on s'éloignait du centre de la
carte. Corrigé en désactivant ce test pour le cortège — il colle au joueur,
il est de toute façon toujours à l'écran. Les mortels, eux, calculent
désormais leur sphère **après** avoir été placés.

> Ce bug n'apparaissait dans aucune mesure : tous les compteurs étaient bons.
> Il n'a été vu que sur une **capture d'écran**. D'où l'intérêt de regarder le
> jeu, et pas seulement ses chiffres.

### Deux autres corrections

- **Le vide au bord du monde.** Arrivé à la limite de la cité, le joueur
  voyait le sol s'arrêter. La marge du sol passe de 40 à 300 unités : un plan
  de plus ne coûte rien, et le brouillard s'occupe du lointain.
- **La grille de collision** est désormais indexée par un entier plutôt que
  par une chaîne « colonne,ligne » (~4 000 chaînes créées par frame avec 450
  mortels). ⚠️ **Honnêteté : ce changement n'a rien amélioré aux fps.** Le
  profilage a montré que nos boucles coûtent **0,19 ms par frame** (1 % du
  budget) et que cacher les silhouettes double les fps : le coût est
  entièrement dans le **dessin des pixels** par le GPU logiciel du banc de
  test, pas dans notre code. C'est une propreté de principe, pas une
  optimisation constatée.

### Modifié

- `src/config.ts` — sections `conversion` et `retinue`, `mortals.count` à 450.
- `src/entities/Mortals.ts` — `takeNear()`, remplacement des convertis loin du
  joueur, `reset()`.
- `src/core/Game.ts` — étape 4 de la frame ; `restart()` vide le cortège et
  repeuple la cité ; compteurs exposés au banc de test.
- `src/core/Scene.ts`, `src/world/City.ts` — les deux corrections ci-dessus.

### Vérifié (banc de test web, Chromium, format téléphone 390 × 844)

- [x] `npm run typecheck` — OK, aucune erreur console
- [x] **Le cortège grandit** : 19 à 32 fidèles après 40 s de course
- [x] **Le vivier ne se vide jamais** : toujours exactement 450 mortels
- [x] **0 fidèle dans un mur**, en surveillance continue pendant les 40 s
- [x] **0 mortel dans un mur** sur 12 s de surveillance à 450 habitants
- [x] **Le cortège est visible** (capture à l'appui, après correction du bug)
- [x] **`restart()`** remet le score à 0, vide le cortège et repeuple la cité
- [x] Aucune régression : blocage du joueur à `x = 4,9`, glissement, bord du
      monde, caméra à 5,8 unités de balayage

### ⚠️ Ce qui reste, et qui est le sujet de la Milestone 5

- **Les traînards.** Un fidèle vise son point en ligne droite : il peut rester
  coincé derrière un immeuble et se retrouver à 30 unités du joueur (mesuré).
  Il faudra que le cortège suive le **chemin** du joueur, pas sa position.
- **Les fidèles se traversent entre eux.** Pas de cohésion, pas d'évitement.
- **Le score n'est pas affiché** : c'est le HUD de la Milestone 6.

**Cassé** — Rien.

---

## 2026-09-02 — Claude — 🚶 Milestone 3 : les mortels

**Résumé** — La cité est habitée : **100 mortels** déambulent dans les rues,
évitent les immeubles et font demi-tour quand ils butent. Ce sont eux que l'on
convertira au contact en Milestone 4.

### Ajouté

| Fichier | Rôle |
|---|---|
| `src/entities/Mortals.ts` | ⭐ Les habitants : naissance, déambulation, mesh instancié |

### Deux décisions qui expliquent leur comportement

1. **Ils suivent les axes des rues.** Un mortel ne part pas dans une direction
   quelconque : il prend l'un des quatre axes de la cité, avec un flottement
   de ±0,35 radian (`mortals.headingJitter`). Lancés au hasard, ils
   passeraient leur vie le nez contre les façades.
2. **Ils ont un TYPE dès maintenant**, alors qu'il n'existe que le citoyen.
   C'était la contrainte notée en adoptant le thème : greffer les hoplites et
   les prêtresses plus tard sur un code qui suppose « tous les mortels sont
   identiques » coûterait une réécriture. Le catalogue `mortals.types` porte
   déjà la couleur, la vitesse, la taille **et la valeur en fidèles** de
   chaque type.

### Performance

Les 100 mortels tiennent dans **un seul `InstancedMesh`**, comme les 124
immeubles. Ils réutilisent la ville comme carte de collision — le même
`Collider` que le joueur, sans une ligne de code supplémentaire. Le coût par
frame est donc de 100 additions et 100 matrices, pas de 100 objets 3D.

### Modifié

- `src/config.ts` — nouvelle section `mortals` (nombre, catalogue des types,
  durée de marche, flottement de cap, graine).
- `src/core/Game.ts` — les mortels naissent après la ville, vivent à l'étape 3
  de la frame ; ajout de `getMortalCount()`, `getMortalPositions()` et
  `countMortalsInsideBuildings()` pour le banc de test.
- `README.md` — section « Les mortels », arborescence, feuille de route.

### Vérifié (banc de test web, Chromium, format téléphone 390 × 844)

- [x] `npm run typecheck` — OK
- [x] **100 mortels**, **0 dans un mur** à la naissance
- [x] **0 dans un mur** en surveillance continue pendant 12 s (relevé toutes
      les 250 ms) — c'est le test qui compte : buter ne doit jamais faire
      traverser
- [x] **Ils bougent tous** : 11,1 unités parcourues en moyenne en 12 s,
      **aucun immobile**
- [x] **Ils occupent toute la cité** : de −98 à +98 sur les deux axes
- [x] Aucune régression : blocage du joueur à `x = 4,9`, glissement, bord du
      monde, caméra à 5,8 unités de balayage
- [x] Aucune erreur console

### ⚠️ Ce qui reste à faire, et qui est normal à ce stade

- **La cité paraît vide.** 100 mortels sur 198 × 198 unités, cela fait environ
  huit silhouettes à l'écran. C'est le chiffre prévu par la feuille de route,
  et `mortals.count` se change en une seconde — mais la bonne densité ne se
  jugera qu'une fois la conversion en place (M4).
- **Les mortels se traversent entre eux.** Ils s'évitent les immeubles, pas
  leurs semblables : la séparation est le sujet de la Milestone 5.
- **Ils traversent le joueur**, faute de conversion. C'est la M4.

**Cassé** — Rien.

---

## 2026-09-02 — Claude — 🏷️ Nom : **Divine City**

**Résumé** — Le jeu s'appelle **Divine City**. C'est le quatrième nom de la
journée (« Brainrot City » → « Olympus » → « Gods Rush » → **Divine City**) ;
aucun des précédents n'a été publié, donc aucun n'a laissé de trace ailleurs
que dans ce journal.

**Pourquoi ce nom** — Il réunit les deux moitiés du jeu : *Divine* pour le
panthéon jouable et ses capacités, *City* pour la cité qui est le terrain de
jeu. Il reprend aussi la structure « … City » de *Crowd City*, la référence du
genre — un joueur qui lit le nom sait à quoi s'attendre.

### Modifié

| Fichier | Changement |
|---|---|
| `app.json` | `name` → **Divine City**, `slug` → `divine-city`, identifiant de bundle |
| `package.json` | `name` → `divine-city` |
| `App.tsx` | Titre affiché dans le HUD |
| `README.md`, `UNIVERS.md` | Titre et section « Le nom » |

**Identifiant de bundle** — désormais **`com.pierreespy.divinecity`** (iOS et
Android). Toujours sans conséquence, rien n'étant publié — mais c'est la
dernière fenêtre pour en changer sans douleur.

### ⚠️ Restent à vérifier avant publication

- **Le nom sur l'App Store** (Apple impose l'unicité du nom d'app) et les
  **marques déposées** en classes 9 et 41 (INPI, EUIPO).
- Les **voisins immédiats** (« Divine City 3D », « Divinity City »…) : un nom
  libre mais trop proche d'un jeu existant se fait écraser dans les résultats.

### Vérifié

- [x] `npm run typecheck` — OK
- [x] Bundle web régénéré, **aucune erreur console**
- [x] Le HUD affiche **Divine City** (capture vérifiée)
- [x] Aucune régression : 124 immeubles, blocage, glissement, bord du monde

**Cassé** — Rien. L'app apparaîtra de nouveau comme **nouvelle** dans Expo Go,
l'identifiant ayant changé.

---

## 2026-09-02 — Claude — 🏷️ Nom : **Gods Rush**

**Résumé** — Le jeu s'appelle **Gods Rush**. Ce bloc remplace celui du dessous,
qui actait « Olympus » : ce dernier n'aura jamais été publié.

**Pourquoi ce nom** — Il dit les deux choses à la fois : *Gods* pour le
panthéon jouable et ses capacités, *Rush* pour le genre — le mot que les
joueurs de *crowd runner* reconnaissent. « Olympus », quoique disponible sur
l'App Store, ne disait rien du genre de jeu.

### Modifié

| Fichier | Changement |
|---|---|
| `app.json` | `name` → **Gods Rush**, `slug` → `gods-rush`, identifiant de bundle |
| `package.json` | `name` → `gods-rush` |
| `App.tsx` | Titre affiché dans le HUD |
| `README.md`, `UNIVERS.md` | Titre et section « Le nom » |

**Identifiant de bundle** — `com.pierreespy.olympus` → **`com.pierreespy.godsrush`**
(iOS et Android). Le changer est **sans conséquence aujourd'hui**, rien n'étant
publié ; ce ne sera plus le cas après la première mise en ligne.

### ⚠️ Restent à vérifier avant publication

- **Le nom sur l'App Store** : Apple impose l'unicité du nom d'app.
- **Les marques déposées** en classes 9 et 41 (INPI, EUIPO).
- ⚠️ « Rush » est un mot **très employé** dans les jeux mobiles. Chercher les
  **voisins immédiats** (« God Rush », « Gods Rush 3D »…), pas seulement la
  correspondance exacte : un nom trop proche d'un jeu existant nuit au
  référencement même quand il est juridiquement disponible.

### Vérifié

- [x] `npm run typecheck` — OK
- [x] Bundle web régénéré, **aucune erreur console**
- [x] Le HUD affiche **Gods Rush** (capture vérifiée)
- [x] Aucune régression : 124 immeubles, blocage, glissement, bord du monde

**Cassé** — Rien. Comme au renommage précédent, l'app apparaîtra comme
**nouvelle** dans Expo Go, l'identifiant ayant changé.

---

## 2026-09-02 — Claude — 🏷️ Le jeu s'appelle désormais **Olympus**

**Résumé** — « Brainrot City » devient **Olympus**, pour coller au thème de la
mythologie grecque décidé plus tôt dans la journée.

### Modifié

| Fichier | Changement |
|---|---|
| `app.json` | `name` → **Olympus**, `slug` → `olympus`, et surtout l'**identifiant de bundle** |
| `package.json` | `name` → `olympus` |
| `App.tsx` | Le titre affiché dans le HUD |
| `README.md` | Titre du projet |
| `UNIVERS.md` | Nouvelle section « Le nom » ; le nom sort de la liste des questions ouvertes |

### ⚠️ L'identifiant de bundle est le point irréversible

`com.brainrotcity.game` → **`com.pierreespy.olympus`**, sur iOS **et** Android.

J'ai écarté `com.olympus.game` : un identifiant doit être **unique sur toute
la planète**, et « olympus » est un mot très disputé — le risque qu'il soit
déjà pris était réel. Le préfixe reprend donc ton pseudo GitHub, ce qui est la
convention quand on ne possède pas de nom de domaine. Si tu achètes un domaine
un jour, c'est **maintenant** qu'il faut le dire : **une fois l'app publiée sur
les stores, cet identifiant ne peut plus jamais changer.**

### ⚠️ Reste à faire côté stores (pas faisable depuis le code)

- **Vérifier que « Olympus » est disponible** sur l'App Store et le Play Store.
  Le mot est **très utilisé** dans les jeux mobiles (Gods of Olympus, Olympus
  Rush, Olympus Game…). Il est probable qu'il faille publier sous un nom
  composé, du type **« Olympus : Divine Rush »** — ce qui aide aussi à être
  trouvé, « Olympus » seul ne disant rien du genre de jeu.
- **Vérifier l'absence de marque déposée** en classes 9 et 41 (INPI, EUIPO).

### Non renommé volontairement

Le **dépôt GitHub** s'appelle toujours `brainrot-city`. Le renommer casserait
les liens et les clones existants, et c'est une action qui t'appartient
(Settings → General → Repository name). Ça n'a aucune conséquence sur l'app.

### Vérifié

- [x] `npm run typecheck` — OK
- [x] `npx expo export --platform web` — bundle régénéré, **aucune erreur console**
- [x] Le HUD affiche bien **Olympus** (capture vérifiée)
- [x] Aucune régression : 124 immeubles, blocage, glissement, bord du monde

**Cassé** — Rien dans le code. En revanche, l'app installée via Expo Go
apparaîtra comme une **nouvelle app** (l'identifiant a changé) : c'est normal.

---

## 2026-09-02 — Claude — 🏛️ Thème décidé : mythologie grecque

**Résumé** — Le jeu prend un thème : **mythologie grecque**. Tu incarnes une
divinité de l'Olympe, les mortels rejoignent ton **cortège**, et **chaque dieu
a une capacité qui lui est propre**. La feuille de route est réécrite en
conséquence. **Aucun code n'a changé** : ce bloc ne touche que la planification.

### Ajouté

| Fichier | Rôle |
|---|---|
| `UNIVERS.md` | ⭐ Le document de référence du thème : la cité et ses quartiers, les mortels, le panthéon jouable et ses capacités, les rivaux |

### La feuille de route passe de 8 à 13 milestones

Les milestones 3 à 7 restent **techniques et inchangées** : elles construisent
la boucle de jeu, identique quel que soit l'habillage. Le thème arrive
ensuite — on habille un jeu qui existe, on ne construit pas un habillage en
espérant qu'un jeu s'y loge.

| # | Avant | Après |
|---|---|---|
| 3–5 | NPC, recrutement, foule | Idem, renommés **mortels**, **conversion**, **cortège** |
| 6 | UI compteur + restart | Idem, + **réserver la place du bouton de capacité** |
| 7 | Optimisation | Idem — à tenir **avant** d'ajouter marbre et rivaux |
| 8 | Gameplay et game feel | 🏛️ **La cité grecque** (quartiers, marbre, temples) |
| 9 | — | 🏛️ **Le panthéon** : dieux jouables + sélection |
| 10 | — | ⚡ **Capacités divines** : une par dieu |
| 11 | — | ⚔️ **Cortèges rivaux** |
| 12 | — | Game feel, effets, audio |
| 13 | — | Publication (EAS Build, stores) |

### Trois décisions qui engagent le code AVANT le thème

Elles sont notées ici parce que les ignorer coûterait une réécriture :

1. **Un mortel a un TYPE dès la M3**, même s'il n'y en a qu'un seul au début.
   Hoplites et prêtresses arrivent en M8 ; sans ce champ, tout est à reprendre.
2. **Un mortel peut valoir PLUS D'UN fidèle dès la M4** (l'hoplite en vaut 3).
   Un compteur qui fait `+1` en dur serait à refaire.
3. **Le HUD de la M6 réserve la place du bouton de capacité** (M10), sinon il
   sera à redessiner.

### Un défaut de jeu que le thème répare

La ville de la Milestone 2 est une grille **uniforme** : tous les carrefours se
ressemblent, donc on s'y perd et on ne mesure pas sa progression. Le découpage
en quartiers de la M8 (Agora, Acropole visible de loin, Port, Théâtre) n'est
donc pas que de la décoration : c'est la correction de ce défaut.

### Les capacités, en une ligne chacune

Chacune répond à un problème de jeu **différent** — c'est ce qui fait du choix
du dieu un vrai choix, et non un choix de couleur.

| Dieu | Capacité | Problème qu'elle résout |
|---|---|---|
| Hermès | **Talaria** (sprint) | La distance |
| Zeus | **Foudre** (conversion en zone) | Le ramassage |
| Poséidon | **Ressac** (attire les mortels) | Le ramassage, autrement |
| Aphrodite | **Charme** (rayon ×2,5) | La marge d'erreur |
| Athéna | **Égide** (aucune perte) | Encaisser |
| Hadès | **Retour du Styx** (récupère les perdus) | Réparer |
| Arès | **Charge** (vole aux rivaux) | Le conflit |

Détail complet, durées et recharges : **[`UNIVERS.md`](./UNIVERS.md)**.

### Ce qui n'est PAS décidé

Le **nom du jeu** (« Brainrot City » colle mal à la mythologie), le style des
personnages, le mode de jeu et la monétisation. Listé en fin d'`UNIVERS.md`.

**Cassé** — Rien. Aucun fichier de code touché.

---

## 2026-09-02 — Claude — 🎥 Correctif : la caméra se bousculait aux demi-tours

**Symptôme signalé** — « la caméra bouge trop, surtout au premier mouvement ;
aller à droite, relâcher, puis aller à gauche crée un bousculement visuel ».

**Diagnostic** — C'est l'anticipation ajoutée en Milestone 2, mesurée au banc
de test sur exactement ce geste (droite 1 s → relâché 0,5 s → gauche 1 s) :

| | Avant | Après |
|---|---|---|
| Amplitude du balayage caméra | **14,0 unités** | **5,9 unités** |
| Vitesse de balayage maximale | **65,4 u/s** | **8,5 u/s** |

65 u/s pour un joueur qui court à 18 u/s : la caméra allait presque quatre
fois plus vite que ce qu'elle suivait. D'où la sensation de bousculement.

Trois causes, cumulées :

1. **Trop d'amplitude.** `lookAhead` valait 7, donc un demi-tour déplaçait la
   visée de 14 unités. Ramené à **3,5**.
2. **Trop rapide.** `lookAheadSmoothing` valait 0,2, soit 80 % de l'écart
   rattrapé par frame — quasiment aussi sec que le suivi lui-même. Passé à
   **0,965** (bien plus mou que le suivi, comme prévu à l'origine).
3. **Un recentrage parasite.** Relâcher le doigt ramenait l'anticipation à
   zéro, puis repartir dans l'autre sens la relançait : **trois** mouvements
   de caméra pour un simple aller-retour. Désormais la cible est
   **conservée** quand le joueur ralentit (`lookAheadDeadZone`), donc un
   aller-retour ne coûte qu'un seul mouvement.

**Fichiers touchés** — `src/config.ts`, `src/systems/CameraRig.ts`,
`src/core/Game.ts` (ajout de `getCameraPosition()` pour le banc de test).

**Vérifié**

- [x] `npm run typecheck` — OK
- [x] Mesures ci-dessus, sur le geste exact signalé
- [x] Aucune régression : 124 immeubles, blocage à `x = 4,9`, glissement,
      0 blocage dans un mur sur 40 courses aléatoires, bord du monde à 98,4

**Cassé** — Rien. L'anticipation existe toujours, elle est juste plus discrète.

---

## 2026-09-02 — Claude — 🏙️ Milestone 2 : la ville et la caméra

**Résumé** — Le terrain vide devient une **ville** : rues, trottoirs et 124
immeubles générés, contre lesquels le joueur bute et le long desquels il
glisse. La caméra a été redressée et vise désormais devant le joueur.

### Ajouté

| Fichier | Rôle |
|---|---|
| `src/world/City.ts` | ⭐ Génère la ville **et** sert de carte de collision |
| `src/world/Collider.ts` | Le contrat commun de ce qui bloque le passage |

### Comment la ville est faite

Rues et pâtés de maisons alternent tous les `blockSize + roadWidth` (22 + 11 =
33). Les rues sont centrées sur les **multiples** de ce pas, ce qui garantit
que **(0, 0) est un carrefour** : le joueur ne démarre jamais dans un mur, et
le bord du monde tombe au milieu d'une rue.

Chaque pâté est découpé en 2 × 2 parcelles. Chaque immeuble est **plaqué sur
la rue** et déborde vers l'intérieur du pâté (la cour, jamais vue).

> ⚠️ **Le piège évité.** Ma première version centrait chaque immeuble dans sa
> parcelle avec un recul. Le banc de test a montré que le joueur **traversait
> les pâtés de maisons de part en part** : les reculs, tous identiques,
> s'alignaient d'un pâté à l'autre et ouvraient des couloirs rectilignes à
> travers toute la ville. D'où la règle `city.lotDepth.min = 1` : un immeuble
> remplit **au moins** sa parcelle, jamais moins.

La ville est **déterministe** (`city.seed`) : la même ville se régénère à
chaque lancement, ce qui rend le banc de test reproductible. Changer la graine
= une autre ville.

### Performance : 124 immeubles = 2 appels GPU

Tous les immeubles partagent une géométrie et un matériau, dans un seul
`THREE.InstancedMesh` (les trottoirs et les bandes blanches en ont un chacun).
C'est déjà la technique qui servira à afficher la foule en Milestone 5.

### Collisions

En construisant un immeuble, on note son rectangle au sol dans une **grille
indexée par pâté**. Tester une collision ne regarde que les 9 cases voisines,
jamais les 124 immeubles — ça restera vrai avec des centaines de NPC.

La résolution ressort le personnage par le côté où il est le **moins enfoncé**
et n'annule que la vitesse de cet axe : on **glisse** le long des façades au
lieu de s'y coller. Indispensable dans une ville en couloirs.

### Caméra

- **Anticipation** (`camera.lookAhead`) : la caméra vise jusqu'à 7 unités
  devant le joueur, proportionnellement à sa vitesse. On voit où l'on va.
- **Inclinaison redressée** : `offset` passe de `(0, 26, 20)` à `(0, 40, 18)`.

> ⚠️ **Lien caméra ↔ hauteur des immeubles.** Au premier essai, le joueur
> disparaissait derrière le toit de l'immeuble situé derrière lui (capture à
> l'appui). La ligne de visée monte de 40 pour 18 de recul : un immeuble
> derrière le joueur doit dépasser ~11 de haut pour le cacher. D'où
> `city.height.max = 10`. **Si tu montes les immeubles, redresse la caméra.**

### Modifié

- `src/config.ts` — `world.halfSize` 60 → **99** (un multiple exact du pas de
  la ville, sinon la ville ne remplit pas le terrain), nouvelle section
  `city`, `camera.offset` et `camera.lookAhead`, sol éclairci.
- `src/core/Scene.ts` — **la grille de repère de la Milestone 1 est retirée**
  (annoncé) ; ce sont les trottoirs et les bandes blanches qui donnent
  maintenant la sensation de déplacement. Brouillard reculé (70 → 190), sol
  élargi, soleil incliné pour donner du relief aux façades.
- `src/core/Game.ts` — construit la ville avant le joueur et la lui injecte ;
  passe la vitesse à la caméra ; ajoute `getBuildingCount()` et
  `isPlayerInsideBuilding()` pour le banc de test.
- `src/entities/Player.ts` — accepte un `Collider` **optionnel** (il sait
  encore courir sans décor, ce qui permet de tester sa logique seule) ;
  `velocity` devient publique en lecture pour la caméra.
- `src/systems/CameraRig.ts` — anticipation lissée séparément.
- `README.md` — sections « La ville » et « La caméra », décisions techniques.

**Supprimé** — La `GridHelper` du sol, comme prévu en Milestone 1. Rien d'autre.

### Vérifié (banc de test web, Chromium, format téléphone 390 × 844)

- [x] `npm run typecheck` — OK, aucune erreur
- [x] `npx expo export --platform web` — bundle généré, **aucune erreur console**
- [x] **124 immeubles** générés, joueur démarrant libre en (0, 0)
- [x] **Course en rue** — 27,2 unités en 1,5 s (18 u/s attendues) : le delta
      time n'a pas bougé
- [x] **Blocage** — foncer 2,7 s dans une façade arrête le joueur à
      `x = 4,9`, soit le bord du pâté (5,5) moins son rayon (0,6). Exact.
- [x] **Glissement** — en diagonale contre une façade, le joueur longe le mur
      et continue sur l'autre axe (`z` bloqué à −4,9, `x` progresse jusqu'à 26)
- [x] **Aucun blocage dans un mur** — 40 courses aléatoires enchaînées :
      `isPlayerInsideBuilding()` est resté **faux à chaque fois**
- [x] **Bord du monde** — arrêt net à `z = 98,4` (99 − 0,6)
- [x] **Joueur visible** — captures d'écran au carrefour et collé à une
      façade : aucun toit ne le masque
- [x] `game.restart()` — replace le joueur en (0, 0)

### ⚠️ Ce que je n'ai PAS pu vérifier

Toujours **pas de téléphone** dans mon environnement. Le banc web tourne sur
un GPU logiciel (~30 fps) : ce chiffre ne dit **rien** des performances
réelles sur mobile, où le GPU fait ce travail les doigts dans le nez. À
confirmer sur ton téléphone via Expo Go.

### Pour tester

```bash
npm install
npm start          # puis scanner le QR code avec Expo Go
```

Envie d'une autre ville ? Change `city.seed` dans `src/config.ts`.

---

## 2026-09-01 — Claude — 🔄 Migration vers Expo : le jeu devient une app mobile

**Résumé** — Clarification importante du projet : **Brainrot City est une
application mobile Android + iOS**, destinée aux stores. Le projet passe donc de
« site web Three.js » à « app Expo », testable sur téléphone via **Expo Go**.

### ⚠️ Changement de stack (validé)

| Avant | Après |
|---|---|
| Vite (bundler web) | **Expo SDK 54** + Metro |
| Page HTML + canvas | **React Native 0.81.5** + `expo-gl` |
| Cible : navigateur | Cible : **iOS + Android**, web conservé comme banc de test |

Three.js et TypeScript sont **conservés**. Seule l'enveloppe change.

**Pourquoi** — L'objectif est une publication sur l'App Store et le Play Store.
Expo est le chemin le plus court pour y arriver depuis un seul code TypeScript,
avec test instantané par QR code et publication via EAS Build.

### Supprimé

> ⚠️ Ces fichiers n'existent plus. C'est volontaire, ils étaient propres à la
> cible web et sont remplacés par l'enveloppe Expo.

- `index.html` — remplacé par `App.tsx`
- `vite.config.ts` — remplacé par `app.json` + `babel.config.js`
- `src/main.ts` — remplacé par `index.ts`
- `public/favicon.svg` — remplacé par `assets/favicon.png`
- `src/systems/Input.ts` — éclaté en `src/systems/input/` (4 fichiers)

### Conservé sans aucune modification

`src/config.ts`, `src/core/Loop.ts`, `src/entities/Player.ts` et
`src/systems/CameraRig.ts` — du TypeScript pur, sans dépendance à la
plateforme. L'architecture posée en Milestone 1 a tenu.

### Ajouté

| Fichier | Rôle |
|---|---|
| `app.json` | Configuration Expo (nom, orientation portrait, icônes, bundle ID) |
| `index.ts` | Point d'entrée Expo |
| `App.tsx` | ⭐ Enveloppe : le seul fichier qui connaît la plateforme |
| `babel.config.js` | Preset Expo |
| `assets/favicon.png` | Icône (généré, 215 octets) |
| `src/core/createRenderer.ts` | Pont technique entre `expo-gl` et Three.js |
| `src/systems/input/InputSource.ts` | Le contrat commun (une direction x/z) |
| `src/systems/input/TouchInput.ts` | Direction venue du joystick |
| `src/systems/input/KeyboardInput.ts` | Direction venue du clavier (web) |
| `src/systems/input/InputManager.ts` | Regroupe les sources disponibles |
| `src/ui/Joystick.tsx` | ⭐ Joystick tactile **remonté depuis la Milestone 8** |

### Modifié

- `src/core/Scene.ts` — ne crée plus le renderer, elle le **reçoit**. C'est ce
  qui rend le cœur du jeu identique sur les trois plateformes.
- `src/core/Game.ts` — reçoit le renderer et l'entrée, appelle `presentFrame()`
  après chaque rendu (obligatoire sur mobile pour afficher l'image).
- `src/config.ts` — `camera.fov` passe de 50 à **60** (écran de téléphone
  étroit en portrait), ajout de la section `joystick`.
- `package.json`, `tsconfig.json`, `.gitignore`, `README.md`

### Bug corrigé pendant la migration

Le joystick était affiché conditionnellement via `gameRef.current` — or modifier
une *ref* React ne redéclenche pas l'affichage : **le joystick ne serait jamais
apparu**. Corrigé en créant l'`InputManager` en amont et en l'injectant dans le
jeu, ce qui rend le joystick utilisable dès la première image.

### Vérifié

- [x] `npm install` — OK
- [x] `npm run typecheck` — OK, aucune erreur
- [x] `npx expo-doctor` — 16/18 (les 2 échecs sont des appels réseau bloqués par
      le bac à sable, pas des problèmes du projet)
- [x] `npx expo export --platform web` — bundle généré (1,08 Mo, 213 modules)
- [x] Lancement dans Chromium en **format téléphone (390×844, tactile)** —
      canvas WebGL créé, jeu initialisé, **aucune erreur console**
- [x] **Joystick tactile** — glissé vers le haut-droite → le joueur va bien vers
      X+ / Z−, et le joystick s'affiche sous le doigt (capture vérifiée)
- [x] **Arrêt au relâchement** — dérive résiduelle de 0,004 unité (≈ zéro)
- [x] **Clavier** (banc web) — `Q` fait bien diminuer X
- [x] **Vitesse** — mesurée à **18,05 u/s** contre 18,00 attendue, soit 0,3 %
      d'écart : pas de bug de delta time
- [x] `game.restart()` — replace le joueur en `(0, 0)`

### ⚠️ Ce que je n'ai PAS pu vérifier

Je n'ai **pas de téléphone** dans mon environnement : je ne peux pas exécuter
Expo Go moi-même. J'ai validé le code sur la cible web, qui exécute **le même
`App.tsx`, le même Three.js et le même `expo-gl`** — mais le rendu final sur
iOS et Android reste à confirmer par toi.

Le point le plus susceptible de différer est `createRenderer.ts` (le faux canvas
et l'appel `gl.endFrameEXP()`, qui n'existe que sur mobile). Si l'écran est noir
sur ton téléphone, c'est là qu'il faudra regarder en premier.

### Pour tester

```bash
npm install
npm start          # puis scanner le QR code avec Expo Go
```

En cas d'échec de connexion : `npx expo start --tunnel`.

---

## 2026-09-01 — Claude — `UPDATE.TXT` devient `UPDATE.md`

**Résumé** — Le journal passe en Markdown pour être lisible directement sur
GitHub (titres, tableaux, cases à cocher, liens cliquables). Le contenu et la
convention ne changent pas.

**Fichiers touchés**

- `UPDATE.TXT` → `UPDATE.md` (renommé via `git mv`, l'historique est conservé)
- `README.md` — le lien vers le journal pointe désormais sur `UPDATE.md`

**Cassé** — Rien. Simple renommage et mise en forme.

**Suite** — La discussion sur Expo Go a abouti à la migration décrite dans le
bloc du dessus.

---

## 2026-09-01 — Claude — Milestone 1 : fondations du projet

**Résumé** — Création du projet de zéro (le dépôt était vide). On a désormais un
jeu 3D qui se lance dans le navigateur, avec un personnage déplaçable au clavier
et une caméra qui le suit.

### Stack choisie

**TypeScript + Three.js + Vite**, cible navigateur (desktop et mobile).

Raison principale : `THREE.InstancedMesh` permet d'afficher des milliers de
personnages en **un seul appel GPU**, ce qui est le cœur du jeu.

> Validée le 2026-09-01. Ne pas changer sans discussion.

### Fichiers ajoutés

| Fichier | Rôle |
|---|---|
| `package.json`, `tsconfig.json`, `vite.config.ts`, `.gitignore` | Configuration du projet (TypeScript en mode strict) |
| `index.html` | Canvas plein écran + couche UI en HTML par-dessus |
| `public/favicon.svg` | Icône d'onglet |
| `src/config.ts` | ⭐ **Tous** les réglages du jeu au même endroit |
| `src/main.ts` | Point d'entrée |
| `src/core/Scene.ts` | Scène Three.js, lumières, sol, grille, redimensionnement |
| `src/core/Loop.ts` | Boucle de jeu et calcul du delta time |
| `src/core/Game.ts` | ⭐ Chef d'orchestre, décrit une frame complète |
| `src/entities/Player.ts` | Position et déplacement du joueur |
| `src/systems/Input.ts` | Clavier → direction voulue (abstraction) |
| `src/systems/CameraRig.ts` | Caméra de suivi avec lissage |
| `README.md` | Stack, installation, architecture, décisions techniques |
| `UPDATE.TXT` | Ce fichier (devenu `UPDATE.md` depuis) |

**Supprimé ou cassé** — Rien. Le dépôt était vide, il n'y avait rien à casser.

### Vérifié

- [x] `npm install` — OK
- [x] `npm run build` (typecheck strict + build) — OK, aucune erreur
- [x] Lancement dans Chromium — OK, **aucune erreur console**
- [x] Déplacement — après 1,2 s de `D` + `Z`, le joueur passe de `(0, 0)` à `(16.06, -16.04)`
- [x] Caméra — suit correctement le joueur (position caméra X = position joueur X)
- [x] `game.restart()` — replace correctement le joueur en `(0, 0)`

### Contrôles

`ZQSD` (AZERTY) / `WASD` (QWERTY) / flèches directionnelles.

Les deux dispositions fonctionnent car on lit `event.code` (position *physique*
de la touche) et non `event.key` (caractère imprimé dessus).

### Pour tester

> ⚠️ **Obsolète** — `npm run dev` n'existe plus depuis la migration vers Expo.
> La commande actuelle est `npm start`. Conservé ici pour l'historique.

```bash
npm install
npm run dev              # ← n'existe plus
# puis ouvrir http://localhost:5173
```

### Notes pour la suite

- `src/world/` et `src/ui/` sont des dossiers vides, prêts pour les milestones 2 et 6.
- `Game.update()` contient des commentaires marquant l'endroit exact où seront
  branchés les NPC (M3), le recrutement (M4) et la foule (M5).
- La grille au sol est **temporaire** : elle sert à percevoir le déplacement tant
  que la ville n'existe pas. Elle disparaîtra en milestone 2.
- Les ombres sont désactivées volontairement (coûteuses, inutiles à ce stade).
  À réévaluer en milestone 8.

---

## Feuille de route

> Cette table date de la Milestone 1 (numérotation d'origine, 1 à 13) et
> n'est plus tenue à jour ici pour éviter la duplication. La feuille de
> route à jour (50 milestones depuis le 2026-09-03) vit dans
> **[`README.md`](./README.md#feuille-de-route)** ; la correspondance
> ancien→nouveau numéro est documentée dans le bloc du 2026-09-03 en tête de
> ce journal.
