# Journal des modifications — Brainrot City

> Les modifications les plus **récentes** sont en haut.
> À lire en premier quand tu reprends le projet.

**Convention** — à chaque changement notable, ajouter un bloc en haut du fichier
avec : la date, l'auteur, ce qui a changé, les fichiers touchés, ce qui a été
vérifié, et ce qui a été supprimé ou cassé.

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
| 2 | Ville simple + caméra | ⬜ À venir |
| 3 | NPC : spawn + déplacement (~100) | ⬜ |
| 4 | Recrutement au contact | ⬜ |
| 5 | Système de foule (formation, suivi) | ⬜ |
| 6 | UI : compteur + restart | ⬜ |
| 7 | Première passe d'optimisation | ⬜ |
| 8 | Gameplay et game feel | ⬜ |
