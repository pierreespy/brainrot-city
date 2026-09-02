# Journal des modifications — Brainrot City

> Les modifications les plus **récentes** sont en haut.
> À lire en premier quand tu reprends le projet.

**Convention** — à chaque changement notable, ajouter un bloc en haut du fichier
avec : la date, l'auteur, ce qui a changé, les fichiers touchés, ce qui a été
vérifié, et ce qui a été supprimé ou cassé.

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
| 3 | NPC : spawn + déplacement (~100) | ⬜ À venir |
| 4 | Recrutement au contact | ⬜ |
| 5 | Système de foule (formation, suivi) | ⬜ |
| 6 | UI : compteur + restart | ⬜ |
| 7 | Première passe d'optimisation | ⬜ |
| 8 | Gameplay et game feel | ⬜ |
