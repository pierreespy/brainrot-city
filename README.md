# Brainrot City

Jeu 3D de foule (inspiré du genre *crowd runner*) **sur le thème de la
mythologie grecque** : tu incarnes une divinité de l'Olympe, les mortels que tu
croises rejoignent ton cortège, et chaque dieu dispose d'une **capacité qui lui
est propre**.

👉 L'univers, les quartiers de la cité, le panthéon jouable et les capacités
sont décrits dans **[`UNIVERS.md`](./UNIVERS.md)**.

**Application mobile Android et iOS**, destinée à une publication sur les stores.

> **État actuel : Milestone 2 terminée** — app Expo fonctionnelle, ville
> générée (rues, trottoirs, 124 immeubles), collisions contre les façades,
> joueur au joystick tactile et caméra de suivi avec anticipation.

---

## Stack technique

| Élément | Choix |
|---|---|
| Framework app | **Expo SDK 54** (React Native 0.81.5) |
| Langage | **TypeScript** (typage strict) |
| Rendu 3D | **Three.js** sur **`expo-gl`** |
| Cibles | **iOS**, **Android**, et web (banc de test) |
| Test sur téléphone | **Expo Go** (SDK 54) |

**Pourquoi ce choix ?** Expo permet de développer une vraie app iOS + Android
depuis un seul code TypeScript, de la tester instantanément sur un téléphone via
Expo Go (un QR code, pas de compilation), et de la publier sur les stores avec
EAS Build. `expo-gl` fournit un contexte OpenGL natif dans lequel Three.js tourne
normalement — et `THREE.InstancedMesh` permet d'afficher **des milliers de
personnages en un seul appel GPU**, ce qui est exactement le besoin du jeu.

`expo-gl` est un module natif **inclus dans Expo Go** : aucun build personnalisé
n'est nécessaire pour développer.

---

## Installation

Prérequis : [Node.js](https://nodejs.org) 18 ou plus, et l'app **Expo Go** sur
ton téléphone (SDK 54).

```bash
npm install
```

## Lancer le jeu sur ton téléphone

```bash
npm start
```

Un QR code s'affiche dans le terminal :

- **Android** — scanne-le depuis l'app Expo Go.
- **iOS** — scanne-le avec l'appareil photo, il ouvrira Expo Go.

Ton ordinateur et ton téléphone doivent être sur le **même réseau Wi-Fi**. Si ça
ne passe pas (réseau d'entreprise, Wi-Fi public), lance `npx expo start --tunnel`.

## Commandes utiles

| Commande | Rôle |
|---|---|
| `npm start` | Serveur de développement + QR code pour Expo Go |
| `npm run android` | Ouvre directement sur un émulateur / téléphone Android |
| `npm run ios` | Ouvre directement sur un simulateur iOS (macOS uniquement) |
| `npm run web` | Ouvre le jeu dans un navigateur (banc de test) |
| `npm run typecheck` | Vérifie les types TypeScript |
| `npm run doctor` | Vérifie la cohérence des versions Expo |

## Contrôles

| Plateforme | Contrôle |
|---|---|
| Téléphone | **Joystick tactile** — pose ton doigt dans la moitié basse de l'écran et glisse |
| Web (banc de test) | Joystick à la souris, **ou** `ZQSD` / `WASD` / flèches |

Le joystick apparaît **là où tu poses le doigt** : pas besoin de viser une zone
précise. Les deux dispositions de clavier fonctionnent sans réglage, car le code
lit la *position physique* de la touche (`event.code`) et non le caractère
imprimé dessus.

---

## Architecture

```
├── index.ts               Point d'entrée Expo
├── App.tsx                ⭐ Enveloppe : le SEUL fichier qui connaît la plateforme
├── app.json               Configuration de l'app (nom, icônes, orientation)
│
└── src/
    ├── config.ts          ⭐ TOUS les réglages (vitesses, tailles, joystick)
    │
    ├── core/
    │   ├── Game.ts        ⭐ Chef d'orchestre : décrit une frame de jeu
    │   ├── Loop.ts        Boucle de jeu + delta time
    │   ├── Scene.ts       Scène Three.js, lumières, sol
    │   └── createRenderer.ts  Pont technique entre expo-gl et Three.js
    │
    ├── entities/
    │   └── Player.ts      Position et déplacement du joueur
    │
    ├── systems/
    │   ├── CameraRig.ts   Caméra qui suit le joueur en douceur
    │   └── input/
    │       ├── InputSource.ts   Le contrat commun (une direction x/z)
    │       ├── TouchInput.ts    Direction venue du joystick
    │       ├── KeyboardInput.ts Direction venue du clavier (web)
    │       └── InputManager.ts  Regroupe les sources disponibles
    │
    ├── ui/
    │   └── Joystick.tsx   Le joystick virtuel (composant React Native)
    │
    └── world/
        ├── City.ts        ⭐ La ville : rues, trottoirs, immeubles + collisions
        └── Collider.ts    Le contrat commun de ce qui bloque le passage
```

### Les deux fichiers à connaître

- **`src/config.ts`** — tous les nombres réglables du jeu. C'est ici qu'on
  expérimente (vitesse, taille du monde, hauteur de caméra, rayon du joystick)
  sans rien casser.
- **`src/core/Game.ts`** — la méthode `update()` liste, dans l'ordre, tout ce
  qui se passe à chaque frame. Lire ces 15 lignes = comprendre le jeu entier.

### La ville

La ville n'est pas dessinée à la main : elle est **générée** à partir de
quatre nombres dans `src/config.ts` (taille d'un pâté de maisons, largeur des
rues, nombre de parcelles, hauteur des immeubles).

```
   rue        pâté de maisons        rue
  |----|  |------------------|  |----|
       ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
       ▓ immeuble │ immeuble ▓      ← plaqués sur la rue,
       ▓──────────┼──────────▓        ils débordent vers la cour
       ▓ immeuble │ immeuble ▓
       ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
```

Les rues sont centrées sur les multiples du pas `blockSize + roadWidth`, ce qui
garantit deux choses : **(0, 0) est toujours un carrefour** (le joueur ne
démarre jamais dans un mur) et le bord du monde tombe au milieu d'une rue.

La ville est **déterministe** : la graine `city.seed` fixe le tirage, donc la
même ville se régénère à chaque lancement. Change la graine, tu obtiens une
autre ville — et le banc de test reste reproductible.

### La caméra

Elle suit le joueur avec du retard (`camera.smoothing`) et vise **un peu
devant lui** (`camera.lookAhead`), proportionnellement à sa vitesse : on voit
où l'on va plutôt que d'où l'on vient.

L'anticipation est volontairement **discrète et très molle**, et sa cible est
**conservée quand le joueur s'arrête**. Un demi-tour coûte le double de
`lookAhead` : à 7, faire droite puis gauche balayait 14 unités à 65 u/s, soit
presque quatre fois la vitesse du joueur — l'image se bousculait. Si tu
remontes cette valeur, remonte aussi `lookAheadSmoothing`.

Son inclinaison (`camera.offset`) est liée à la hauteur des immeubles : la
ligne de visée monte de 40 pour 18 de recul, donc un immeuble derrière le
joueur devrait dépasser ~11 de haut pour le cacher. C'est pour cela que
`city.height.max` vaut 10. **Si tu montes la hauteur des immeubles, redresse
la caméra**, sinon le joueur disparaît derrière un toit.

### Le principe central : le jeu ignore la plateforme

Tout ce qui est dans `src/core`, `src/entities` et `src/systems` est du
TypeScript **pur** : aucune référence à React Native, à iOS ou au web. Seuls
`App.tsx`, `Joystick.tsx` et `createRenderer.ts` savent sur quoi on tourne.

C'est ce qui permet de faire tourner exactement le même jeu sur téléphone (via
Expo Go) et dans un navigateur — ce dernier servant de **banc de test
automatisé** pour vérifier que la logique fonctionne à chaque milestone.

### Où vit quoi

- **Les données** : en mémoire, dans des tableaux détenus par les *managers*.
  Pas de base de données, pas de fichiers de sauvegarde.
- **La logique de jeu** : dans `Game.update()`, qui appelle les systèmes.
- **L'interface** : en composants React Native posés par-dessus la surface 3D
  (`App.tsx`) — plus simple et quasiment gratuit en performance.

---

## Décisions techniques

**Le joueur est une position, pas un objet 3D.** `Player` stocke un
`Vector2 (x, z)` et recopie cette valeur dans son mesh à l'affichage. Séparer
les *données* de l'*affichage* est ce qui permettra, plus tard, de gérer des
milliers de personnages avec un seul mesh instancié.

**Le monde est en 2D.** Le jeu est vu de dessus et personne ne saute : on
n'utilise que X et Z. Cela simplifie tous les calculs (distances, collisions)
et divise le coût par frame.

**Tout est multiplié par `deltaTime`.** Le jeu avance à la même vitesse réelle
sur un téléphone à 60 Hz et sur un écran à 120 Hz. Le delta est plafonné à
0,1 s pour éviter que le joueur ne se téléporte au retour d'arrière-plan.

**L'entrée est une abstraction.** Le jeu demande « quelle direction ? » et ne
sait pas d'où vient la réponse. Ajouter une manette plus tard ne touchera
**qu'un seul dossier**, `src/systems/input/`.

**Le renderer est injecté, pas créé par le jeu.** `GameScene` reçoit un
`WebGLRenderer` déjà configuré. C'est ce qui rend le cœur du jeu identique sur
les trois plateformes.

**`createRenderer.ts` force `pixelRatio` à 1.** `expo-gl` fournit déjà des
dimensions en pixels physiques ; laisser Three.js appliquer en plus le ratio de
l'écran ferait rendre 2 à 3 fois trop de pixels sur un téléphone récent.

**Les immeubles sont deux `InstancedMesh`, pas 124 objets.** Tous partagent
une géométrie et un matériau ; seules leur matrice et leur couleur diffèrent.
Afficher 124 immeubles coûte donc deux appels GPU. C'est exactement la
technique qui servira à afficher la foule.

**La ville est aussi la carte de collision.** En construisant un immeuble, on
note son rectangle au sol dans une grille indexée par pâté de maisons. Savoir
contre quoi on bute ne teste alors que les 9 cases voisines, jamais les 124
immeubles — et ça restera vrai avec 500 NPC.

**On glisse le long des façades.** La collision ressort le personnage par le
côté où il est le moins enfoncé, et annule seulement la vitesse de cet axe.
Sans ça, on resterait collé au mur dès qu'on le touche en diagonale : injouable
dans une ville en couloirs.

**Les immeubles sont plaqués sur la rue.** S'ils étaient centrés dans leur
parcelle avec un recul, les reculs s'aligneraient d'un pâté à l'autre et
ouvriraient des couloirs traversant toute la ville (constaté au banc de test :
le joueur traversait les pâtés au lieu de les contourner).

**Pas d'ombres pour l'instant.** Le rendu d'ombres est coûteux et n'apporte
rien à ce stade. On les évaluera en Milestone 8, après profiling.

---

## Feuille de route

Le thème (mythologie grecque) a été décidé le 2026-09-02, après la Milestone 2.
Les milestones 3 à 7 restent **techniques** : elles construisent la boucle de
jeu, qui est la même quel que soit l'habillage. Le thème arrive ensuite, une
fois qu'il y a un jeu à habiller.

| # | Milestone | État |
|---|---|---|
| 1 | Projet + scène + déplacement du joueur | ✅ Terminée |
| — | Migration vers Expo (app mobile) + joystick tactile | ✅ Terminée |
| 2 | Ville simple + caméra | ✅ Terminée |
| 3 | **Mortels** : spawn + déambulation (~100) | ⬜ À venir |
| 4 | **Conversion** au contact : le cortège grandit | ⬜ |
| 5 | Système de cortège (formation, suivi) | ⬜ |
| 6 | HUD : compteur de fidèles + relance | ⬜ |
| 7 | Première passe d'optimisation | ⬜ |
| 8 | 🏛️ **La cité grecque** : quartiers, marbre, temples, repères | ⬜ |
| 9 | 🏛️ **Le panthéon** : dieux jouables (données, apparence, sélection) | ⬜ |
| 10 | ⚡ **Capacités divines** : une par dieu, jauge et bouton | ⬜ |
| 11 | ⚔️ **Cortèges rivaux** : concurrence et affrontements | ⬜ |
| 12 | Game feel, effets et audio | ⬜ |
| 13 | Publication (EAS Build, App Store et Play Store) | ⬜ |

### Ce que le thème change, milestone par milestone

- **M3 — Mortels.** Les PNJ s'appellent des mortels. Un seul type pour
  commencer (le citoyen) ; hoplites, prêtresses et philosophes viennent en M8,
  quand la boucle est jouable. Le code, lui, prévoit dès M3 un **type** par
  mortel, sinon il faudra tout reprendre.
- **M4 — Conversion.** Le contact « recrute » ; le thème n'ajoute qu'un mot et
  un effet visuel. Mais la M4 doit prévoir qu'un mortel puisse valoir **plus
  d'un fidèle** (l'hoplite en vaut 3), sinon le compteur sera à refaire.
- **M5 — Cortège.** Inchangé techniquement. C'est ici que se décide si un
  cortège de 500 fidèles reste lisible à l'écran.
- **M6 — HUD.** Le compteur affiche des **fidèles**. Prévoir dès maintenant la
  place du **bouton de capacité** (M10) : le HUD sera à redessiner sinon.
- **M7 — Optimisation.** Le budget de performance doit être tenu **avant**
  d'ajouter marbre, colonnes et cortèges rivaux, pas après.
- **M8 — La cité grecque.** L'habillage : palettes de marbre, toits de tuiles,
  colonnes et oliviers (deux `InstancedMesh` de plus), et surtout le **découpage
  en quartiers** (Agora, Acropole, Port, Théâtre…). Ce découpage corrige un
  vrai défaut de jeu constaté en M2 : la grille actuelle est uniforme, donc on
  s'y perd et on ne mesure pas sa progression.
- **M9 — Le panthéon.** Un dieu = **une ligne de données**, pas une classe.
  Apparence, capacité, réglages propres. Plus l'écran de sélection.
- **M10 — Capacités divines.** Le cœur du thème : Foudre, Talaria, Charme,
  Ressac, Égide, Retour du Styx, Charge. Même principe d'architecture que les
  entrées et les collisions — **un contrat, plusieurs implémentations** — donc
  le jeu ne connaîtra jamais « Zeus », seulement « la capacité active ».
- **M11 — Rivaux.** Ce qui donne un enjeu à la carte et un sens aux capacités
  défensives (Égide, Retour du Styx) et offensives (Charge).

> **Envie de voir le thème plus tôt ?** On peut avancer la seule *palette* de
> la M8 (marbre et tuiles, ~1 h de travail, aucun risque) sans toucher aux
> quartiers. En revanche, refaire la génération de la cité **avant** que la
> foule existe reviendrait à la refaire deux fois : le cortège change la façon
> dont on lit l'espace.

## Travail à deux

Deux documents à connaître avant de coder :

- **[`UNIVERS.md`](./UNIVERS.md)** — le thème : la cité grecque et ses
  quartiers, les mortels, le panthéon jouable et les capacités de chaque dieu.
  C'est le « quoi » et le « pourquoi » du contenu.
- **[`UPDATE.md`](./UPDATE.md)** — le journal, ci-dessous.

Le fichier **[`UPDATE.md`](./UPDATE.md)** liste les dernières modifications
apportées au projet, de la plus récente à la plus ancienne. **À lire en premier**
quand tu reprends le projet, et à compléter à chaque changement notable.
