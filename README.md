# Brainrot City

Jeu 3D de foule (inspiré du genre *crowd runner*) : tu contrôles un personnage,
tu recrutes les passants au contact, ta foule grandit.

> **État actuel : Milestone 1 terminée** — projet fonctionnel, scène 3D,
> joueur contrôlable au clavier, caméra de suivi.

---

## Stack technique

| Élément | Choix |
|---|---|
| Langage | **TypeScript** (typage strict) |
| Rendu 3D | **Three.js** |
| Build / serveur de dev | **Vite** |
| Plateforme | **Navigateur** (desktop + mobile), portage app possible via Capacitor |

**Pourquoi ce choix ?** Tout est du code texte (pas d'éditeur graphique), le
cycle modifier → tester est quasi instantané, le jeu se partage par un simple
lien, et surtout `THREE.InstancedMesh` permet d'afficher **des milliers de
personnages en un seul appel GPU** — ce qui est exactement le besoin du jeu.
Coût : zéro, licence : aucune.

---

## Installation

Prérequis : [Node.js](https://nodejs.org) 18 ou plus.

```bash
npm install
```

## Lancer le jeu

```bash
npm run dev
```

Puis ouvre **http://localhost:5173**.

Le rechargement est automatique : modifie un fichier, sauvegarde, le jeu se met
à jour instantanément dans le navigateur.

## Commandes utiles

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement + rechargement à chaud |
| `npm run build` | Vérifie les types **et** génère le build final dans `dist/` |
| `npm run typecheck` | Vérifie les types sans construire (rapide) |
| `npm run preview` | Teste le build de production en local |

## Contrôles

| Touche | Action |
|---|---|
| `Z` `Q` `S` `D` (AZERTY) | Se déplacer |
| `W` `A` `S` `D` (QWERTY) | Se déplacer |
| Flèches directionnelles | Se déplacer |

Les deux dispositions fonctionnent sans réglage : le code lit la *position
physique* de la touche (`event.code`), pas le caractère imprimé dessus.

---

## Architecture

```
src/
├── main.ts              Point d'entrée : crée le jeu et le démarre
├── config.ts            ⭐ TOUS les réglages (vitesses, tailles, couleurs)
│
├── core/
│   ├── Game.ts          ⭐ Chef d'orchestre : décrit une frame de jeu
│   ├── Loop.ts          Boucle de jeu + delta time
│   └── Scene.ts         Scène Three.js, lumières, sol, redimensionnement
│
├── entities/
│   └── Player.ts        Position et déplacement du joueur
│
├── systems/
│   ├── Input.ts         Clavier → direction voulue (abstraction)
│   └── CameraRig.ts     Caméra qui suit le joueur en douceur
│
├── world/               (Milestone 2 : la ville)
└── ui/                  (Milestone 6 : compteur, restart)
```

### Les deux fichiers à connaître

- **`src/config.ts`** — tous les nombres réglables du jeu. C'est ici qu'on
  expérimente (vitesse, taille du monde, hauteur de caméra) sans rien casser.
- **`src/core/Game.ts`** — la méthode `update()` liste, dans l'ordre, tout ce
  qui se passe à chaque frame. Lire ces 15 lignes = comprendre le jeu entier.

### Où vit quoi

- **Les données** : en mémoire, dans des tableaux détenus par les *managers*.
  Pas de base de données, pas de fichiers de sauvegarde.
- **La logique de jeu** : dans `Game.update()`, qui appelle les systèmes.
- **L'interface** : en HTML/CSS classique par-dessus le canvas (`#ui-layer`
  dans `index.html`), pas dans la scène 3D — plus simple et gratuit en
  performance.

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
sur un écran 60 Hz et sur un 144 Hz. Le delta est plafonné à 0,1 s pour éviter
que le joueur ne se téléporte au retour d'un onglet en arrière-plan.

**L'entrée est une abstraction.** Le jeu demande « quelle direction ? » et ne
sait pas d'où vient la réponse. Ajouter un joystick tactile ou une manette ne
touchera **que `Input.ts`**.

**Pas d'ombres pour l'instant.** Le rendu d'ombres est coûteux et n'apporte
rien à ce stade. On les évaluera en Milestone 8, après profiling.

---

## Feuille de route

| # | Milestone | État |
|---|---|---|
| 1 | Projet + scène + déplacement du joueur | ✅ Terminée |
| 2 | Ville simple + caméra | ⬜ À venir |
| 3 | NPC : spawn + déplacement (~100) | ⬜ |
| 4 | Recrutement au contact | ⬜ |
| 5 | Système de foule (formation, suivi) | ⬜ |
| 6 | UI : compteur + restart | ⬜ |
| 7 | Première passe d'optimisation | ⬜ |
| 8 | Gameplay et game feel | ⬜ |

---

## Travail à deux

Le fichier **[`UPDATE.TXT`](./UPDATE.TXT)** liste les dernières modifications
apportées au projet, de la plus récente à la plus ancienne. **À lire en premier**
quand tu reprends le projet, et à compléter à chaque changement notable.
