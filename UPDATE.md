# Journal des modifications — Brainrot City

> Les modifications les plus **récentes** sont en haut.
> À lire en premier quand tu reprends le projet.

**Convention** — à chaque changement notable, ajouter un bloc en haut du fichier
avec : la date, l'auteur, ce qui a changé, les fichiers touchés, ce qui a été
vérifié, et ce qui a été supprimé ou cassé.

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

| # | Milestone | État |
|---|---|---|
| 1 | Projet + scène + déplacement du joueur | ✅ Terminée |
| — | Migration vers Expo (app mobile) + joystick tactile | ✅ Terminée |
| 2 | Ville simple + caméra | ✅ Terminée |
| 3 | **Mortels** : spawn + déambulation (~100) | ✅ Terminée |
| 4 | **Conversion** au contact : le cortège grandit | ✅ Terminée |
| 5 | Système de cortège (formation, suivi) | ⬜ À venir |
| 6 | HUD : compteur de fidèles + relance | ⬜ |
| 7 | Première passe d'optimisation | ⬜ |
| 8 | 🏛️ La cité grecque : quartiers, marbre, temples, repères | ⬜ |
| 9 | 🏛️ Le panthéon : dieux jouables | ⬜ |
| 10 | ⚡ Capacités divines : une par dieu | ⬜ |
| 11 | ⚔️ Cortèges rivaux | ⬜ |
| 12 | Game feel, effets et audio | ⬜ |
| 13 | Publication (EAS Build, stores) | ⬜ |
