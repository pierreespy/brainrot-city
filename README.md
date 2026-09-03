# Divine City

Jeu 3D de foule (inspiré du genre *crowd runner*) **sur le thème de la
mythologie grecque** : tu incarnes une divinité de l'Olympe, les mortels que tu
croises rejoignent ton cortège, et chaque dieu dispose d'une **capacité qui lui
est propre**.

👉 L'univers, les quartiers de la cité, le panthéon jouable et les capacités
sont décrits dans **[`UNIVERS.md`](./UNIVERS.md)**.

**Application mobile Android et iOS**, destinée à une publication sur les stores.

> **État actuel : Milestones 12 et 13 terminées** — app Expo fonctionnelle, **cité
> grecque** générée en six quartiers (Agora, Céramique, Acropole, Port,
> Théâtre, Bois sacré), collisions contre les façades,
> **450 mortels qui déambulent**, **conversion au contact** qui se propage, et
> un **cortège de plusieurs centaines de fidèles** qui suit le chemin du dieu
> en foule cohérente, **compteur et bouton de relance**. Joystick tactile et
> caméra de suivi avec anticipation. Le jeu est **profilé et optimisé** :
> 0,09 ms de calcul par image en partie réelle, sur les 16,7 disponibles.
> Le **panthéon** existe côté données : sept dieux, chacun une ligne dans
> `src/entities/gods/roster.ts`, et l'app s'ouvre désormais sur un **menu à
> trois onglets** — Jouer, Magasin, Dieux — avec des **drachmes** gagnées en
> jouant, des divinités et des parures à acquérir, et une progression
> **enregistrée sur l'appareil**. Le dieu court **au milieu de sa foule**, plus
> en tête de file.

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
| `npm run bench` | **Banc de mesure** : ce que coûte une image, étape par étape |
| `npm run typecheck` | Vérifie les types TypeScript |
| `npm run doctor` | Vérifie la cohérence des versions Expo |

## Contrôles

| Plateforme | Contrôle |
|---|---|
| Téléphone | **Joystick tactile** — pose ton doigt dans la moitié basse de l'écran et glisse |
| Web (banc de test) | Joystick à la souris, **ou** `ZQSD` / `WASD` / flèches |

**Touche le compteur de fidèles** pour afficher les mesures de performance
(fps, coût de chaque étape, silhouettes réellement dessinées) — sur le
téléphone comme sur le banc web. Touche-le à nouveau pour les cacher.

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
├── tools/                 Hors du jeu : les outils de mesure (npm run bench)
│   ├── bench.ts           ⭐ Le banc : la vraie simulation, sans écran
│   └── check-separation.ts  Vérifie que la grille de répulsion n'oublie rien
│
└── src/
    ├── config.ts          ⭐ TOUS les réglages (vitesses, tailles, joystick)
    │
    ├── core/
    │   ├── Game.ts        ⭐ Chef d'orchestre : décrit une frame de jeu
    │   ├── Loop.ts        Boucle de jeu + delta time
    │   ├── Scene.ts       Scène Three.js, lumières, sol
    │   ├── Profiler.ts    ⭐ Ce que coûte une image, étape par étape
    │   ├── instancing.ts  Écrire une silhouette dans un mesh instancié, vite
    │   └── createRenderer.ts  Pont technique entre expo-gl et Three.js
    │
    ├── entities/
    │   ├── Player.ts      Position et déplacement du joueur
    │   ├── Mortals.ts     ⭐ Les 450 habitants : déambulation + mesh instancié
    │   ├── Retinue.ts     ⭐ Le cortège : le score et la foule AUTOUR du dieu
    │   └── gods/roster.ts ⭐ Le panthéon : un dieu = une ligne de données
    │
    ├── meta/              Hors partie : ce que le joueur possède
    │   ├── progression.ts ⭐ Drachmes, dieux, parures — données pures, testables
    │   ├── store.ts       ⭐ Le catalogue : prix, parures, paquets de drachmes
    │   ├── storage.ts     La sauvegarde sur l'appareil (AsyncStorage)
    │   └── useProgression.ts  Le pont vers React
    │
    ├── systems/
    │   ├── CameraRig.ts   Caméra qui suit le joueur en douceur
    │   ├── Conversion.ts  Le contact : un mortel quitte la cité pour le cortège
    │   ├── ViewCulling.ts ⭐ Ce que la caméra cadre — donc ce qu'on paie
    │   ├── PlayerTrail.ts ⭐ La trace du dieu : c'est ELLE que le cortège suit
    │   └── input/
    │       ├── InputSource.ts   Le contrat commun (une direction x/z)
    │       ├── TouchInput.ts    Direction venue du joystick
    │       ├── KeyboardInput.ts Direction venue du clavier (web)
    │       └── InputManager.ts  Regroupe les sources disponibles
    │
    ├── ui/
    │   ├── Joystick.tsx   Le joystick virtuel (composant React Native)
    │   ├── Hud.tsx        ⭐ Compteur de fidèles, relance, retour au menu
    │   ├── Stats.tsx      L'affichage de debug (touche le compteur)
    │   └── menu/          ⭐ L'accueil : Jouer / Magasin / Dieux
    │       ├── MenuScreen.tsx   La coquille et la barre d'onglets
    │       ├── PlayTab.tsx      Lancer une partie, et les paramètres
    │       ├── ShopTab.tsx      Drachmes, divinités, parures
    │       ├── GodsTab.tsx      Le panthéon possédé et ses cosmétiques
    │       ├── SettingsSheet.tsx  La feuille de paramètres
    │       ├── parts.tsx        Les briques communes (bouton, carte, pastille)
    │       └── theme.ts         Couleurs, espacements, échelle de texte
    │
    └── world/
        ├── City.ts        ⭐ La cité : ce qu'on bâtit dans chaque quartier
        ├── districts.ts   ⭐ Le PLAN : quel quartier occupe quel pâté
        ├── Collider.ts    Le contrat commun de ce qui bloque le passage
        └── Population.ts  Le contrat de « où naissent les mortels »
```

### Les deux fichiers à connaître

- **`src/config.ts`** — tous les nombres réglables du jeu. C'est ici qu'on
  expérimente (vitesse, taille du monde, hauteur de caméra, rayon du joystick)
  sans rien casser.
- **`src/core/Game.ts`** — la méthode `update()` liste, dans l'ordre, tout ce
  qui se passe à chaque frame. Lire ces 15 lignes = comprendre le jeu entier.

### La cité et ses quartiers

La cité n'est pas dessinée à la main : elle est **générée** à partir de
quelques nombres de `src/config.ts` (taille d'un pâté, largeur des rues,
nombre de parcelles, hauteur des maisons).

```
   rue         pâté de maisons        rue
  |----|  |------------------|  |----|
       ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
       ▓ maison │ maison │ m. ▓      ← plaquées sur la rue,
       ▓────────┼── cour ─┼────▓        en anneau autour d'une cour
       ▓ maison │ (vide) │ m. ▓
       ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
```

Les rues sont centrées sur les multiples du pas `blockSize + roadWidth`, ce qui
garantit deux choses : **(0, 0) est toujours un carrefour** (le joueur ne
démarre jamais dans un mur) et le bord du monde tombe au milieu d'une rue.

La cité est **déterministe** : la graine `city.seed` fixe le tirage, donc la
même cité se régénère à chaque lancement. Change la graine, tu obtiens une
autre cité — et le banc de test reste reproductible.

**Six quartiers** (Milestone 8), décrits dans
[`src/world/districts.ts`](./src/world/districts.ts) :

| Quartier | Ce qu'on y trouve | Densité de mortels |
|---|---|---|
| **Agora** | Places dallées, colonnades, autels. Le point de départ. | ×2,6 |
| **La Céramique** | Le tissu courant : maisons ocre, toits de tuiles, cours | ×1 |
| **Acropole** | Plateforme de marbre, péristyle, cella | ×0,5 |
| **Le Port** | Entrepôts en retrait, quai ouvert, **la mer** au-delà | ×1,3 |
| **Le Théâtre** | Trois anneaux de gradins en demi-cercle | ×3 |
| **Bois sacré** | Oliviers, pas de bâti. Une respiration, un raccourci. | ×0,4 |

**Le plan est écrit à la main, le contenu est généré.** Un repère tiré au sort
n'est pas un repère : l'Acropole doit être au même endroit à chaque partie,
sinon elle n'aide personne à s'orienter. En revanche, ce qu'on bâtit *dans* un
pâté reste tiré par la graine.

**Pourquoi des quartiers ?** Parce que la grille uniforme de la Milestone 2
avait un défaut de jeu identifié dès sa livraison : tous les carrefours se
ressemblaient, donc **on s'y perdait et on ne mesurait pas sa progression**.
Trois choses y répondent, et la première fait l'essentiel du travail :

1. **La couleur du sol.** La caméra plonge de 40 unités : ce que le joueur
   voit le plus, c'est le sol. Chaque quartier a sa dalle — marbre pâle à
   l'agora, ocre à la Céramique, vert au bois sacré, gris-vert au port. On sait
   qu'on a changé d'endroit avant même d'avoir vu un bâtiment.
2. **Le nom du quartier**, annoncé sous le compteur quand on y entre.
3. **La densité de mortels**, qui donne une *raison* d'aller quelque part :
   l'agora et le théâtre valent le détour, le bois sacré est un raccourci
   désert.

> ⚠️ **Un repère « visible de loin » n'est pas possible avec cette caméra**, et
> c'était pourtant l'intention de départ pour l'Acropole (voir `UNIVERS.md`).
> La caméra est à 40 unités de haut et penchée : **le haut de l'écran touche le
> sol à 55 unités**. Rien ne dépasse cet horizon, quelle que soit sa hauteur —
> grandir le temple ne l'aurait pas rendu visible de plus loin, mais l'aurait
> fait masquer le joueur en passant devant. C'est donc au sol que l'orientation
> se joue.

**Ce qui bloque, et ce qui ne bloque pas.** Murs, plateformes, gradins et
entrepôts sont des obstacles ; **colonnes et oliviers n'en sont pas**. Ce n'est
pas un oubli : un cortège de plusieurs centaines de fidèles se coince sur les
obstacles fins, et la Milestone 7 avait mesuré qu'un seul fidèle bloqué
décroche de 40 unités. Semer une forêt de poteaux dans les rues coûterait plus
en jouabilité que ça ne rapporte en réalisme.

**Chaque pâté a sa venelle.** Une parcelle du pourtour est toujours laissée
vide, pour que la cour intérieure soit ouverte sur la rue. Sans elle, une cour
sur cinq était entièrement ceinturée : un fidèle poussé là-dedans n'en
ressortait jamais, et l'étalement du cortège grimpait à 82 unités au banc.

### Les mortels

Ce sont les habitants de la cité, ceux que l'on convertit au contact. Entre
deux conversions ils vivent leur vie : ils marchent, changent de cap toutes les
2 à 5 secondes, et font demi-tour quand ils butent.

Trois choix expliquent leur comportement :

- **Ils suivent les axes des rues**, avec un léger flottement
  (`mortals.headingJitter`). Lancés dans une direction quelconque, ils
  passeraient leur vie le nez contre les façades ; lancés le long d'un axe, ils
  descendent la rue.
- **Ils ont un TYPE dès maintenant**, alors qu'il n'existe que le citoyen. Le
  catalogue `mortals.types` de `config.ts` attend les hoplites, prêtresses et
  philosophes décrits dans [`UNIVERS.md`](./UNIVERS.md) — chacun étant une
  ligne à ajouter, avec sa couleur, sa vitesse et sa **valeur en fidèles**.
- **Ils ne coûtent que quand on les voit** (Milestone 7). Sur 450, la caméra
  n'en cadre qu'une vingtaine : eux seuls sont dessinés et déplacés à chaque
  image. Les autres avancent une image sur quatre, d'un pas quatre fois plus
  long — même distance parcourue, quatre fois moins de calcul, et rien à
  l'écran pour le trahir.

Comme les immeubles, les 450 mortels tiennent dans **un seul `InstancedMesh`**,
donc un appel GPU. Ils réutilisent la ville comme carte de collision : le même
`Collider` que le joueur, sans une ligne de code en plus.

- **Ils naissent là où il y a du monde** (Milestone 8). Le tirage n'est plus
  uniforme : il suit la densité du quartier, si bien que l'agora grouille et
  que le bois sacré reste désert. C'est ce qui transforme le choix d'une
  direction en vrai choix.

**Pourquoi 450 et pas 100 ?** Parce que c'est calculé, pas deviné. Le joueur
balaie un couloir de `2 × conversion.radius` de large à 18 u/s, soit 68 unités²
par seconde sur les 39 200 de la cité. À 100 mortels, on mesurait **3
conversions en 40 secondes** : injouable. À 450, environ une par seconde.
Changer `world.halfSize` ou `conversion.radius` oblige à recalculer.

### La conversion et le cortège

Un mortel est converti quand il est touché **par la divinité ou par un fidèle
déjà converti**. C'est ce second cas qui fait la boule de neige du genre : plus
le cortège est large, plus il ratisse.

> Comparer 450 mortels à 600 fidèles ferait 270 000 tests par frame. On procède
> donc en deux temps : le cortège reste groupé autour du joueur, donc au-delà
> de son étalement (`Retinue.spreadRadius`, mesuré gratuitement pendant le
> suivi) plus le rayon de conversion, aucun fidèle ne peut toucher personne.
> Ce filtre écarte la quasi-totalité de la cité en une soustraction par mortel,
> et seuls les rares survivants sont comparés aux fidèles un par un. Mesuré :
> **0,003 ms par frame** avec un cortège de 47.

Trois fichiers, chacun avec un seul rôle :

- **`Mortals.ts`** sait rendre ceux qu'on touche (`takeNear`) et les
  **remplace aussitôt** ailleurs dans la cité, à 70 unités au moins du joueur :
  le vivier ne se vide jamais et le mesh n'est jamais reconstruit.
- **`Retinue.ts`** détient le **score** (la somme des *valeurs*, pas le nombre
  de silhouettes — un hoplite vaudra 3) et les fidèles qui courent derrière.
- **`Conversion.ts`** ne fait que brancher les deux. C'est là que se
  grefferont les capacités qui convertissent (Foudre, Charme) : elles ne
  changeront que le rayon ou le point de conversion.

### La formation du cortège

Elle repose sur **deux mécanismes indépendants**, et c'est leur combinaison qui
donne une foule plutôt qu'une file ou un tas.

**1. Suivre le chemin, pas le joueur.** Le dieu laisse une trace
(`PlayerTrail`) : un point tous les 35 cm, avec la distance parcourue. Chaque
fidèle vise le point situé à `lagMin + lagStep × √rang` derrière lui **sur
cette trace**. Le cortège emprunte donc les mêmes rues et contourne les mêmes
angles.

> C'est ce qui a supprimé les traînards. Avant, chacun visait la *position* du
> dieu en ligne droite et poussait contre les façades : jusqu'à **33 unités**
> de retard mesurées. Après : **8 au plus**.

La racine carrée du rang est délibérée : un cortège de 500 doit **s'épaissir**,
pas s'étirer sur 250 mètres.

**2. Se repousser entre voisins.** Sans cela, tous se poseraient sur le même
point du chemin. Deux détails font toute la différence :

- un fidèle **cesse de chasser sa cible** dès qu'il en est à moins de
  `arriveRadius` — c'est ce qui laisse à la répulsion la place d'étaler la
  foule (sans ce réglage : 30 % des paires superposées ; avec : 2,6 %) ;
- les nouveaux arrivants naissent avec un **léger écart aléatoire**, sinon
  deux conversions simultanées créaient deux fidèles au même point exact, et
  la répulsion n'avait aucune direction où pousser.

**Le coût**, mesuré au banc de test avec **600 fidèles** : `Retinue.update()`
prend **1,22 ms** par frame, tout compris (chemin, répulsion, collisions,
matrices), soit 7 % du budget d'une frame à 60 Hz. La répulsion compare chaque
fidèle à ses seuls voisins de grille — 9 cases — et non aux 600 autres, ce qui
ferait 180 000 paires.

### Le HUD

Le compteur, le bouton de relance et **l'emplacement réservé à la capacité
divine** (Milestone 10) sont des composants React Native posés par-dessus la
3D — du texte net, et un coût quasi nul.

Quasi nul **à une condition** : ne pas redessiner l'interface à chaque image.
Le jeu tourne à 60 images par seconde ; prévenir React à chacune déclencherait
60 rendus par seconde pour afficher un nombre. Le jeu ne publie donc son score
que s'il a **changé**, et au plus toutes les 120 ms.

> Mesuré : pendant 1,6 seconde de conversions en rafale, le texte du compteur
> a été mis à jour **10 fois** — contre 96 si l'on publiait à chaque image, et
> l'affichage reste identique au score réel du jeu.

Le lien va dans un seul sens : le jeu expose `onFaithfulChange` et annonce un
nombre. Il ne sait pas ce qu'est un HUD, ce qui permet de redessiner
l'interface sans jamais toucher au moteur.

**L'ordre des couches compte.** Le joystick est déclaré *avant* le HUD, car en
React Native la dernière couche déclarée reçoit le doigt : c'est ce qui rend le
bouton de relance cliquable tout en laissant le reste de l'écran au joystick
(vérifié au banc de test — un glissé sous le HUD déplace bien le joueur).

### Le budget de performance

Une image dure **16,7 ms** à 60 images par seconde. La Milestone 7 a d'abord
cherché où elles passaient, **avant** de toucher à quoi que ce soit — le projet
en avait déjà fait l'expérience en Milestone 2, où une belle optimisation de la
grille de collision n'avait rien changé aux fps : le coût était ailleurs.

Deux instruments, parce qu'il y a deux budgets :

- **`npm run bench`** — le banc de mesure. Il rejoue la vraie simulation
  (ville, mortels, conversion, cortège) sans écran ni carte graphique : 90
  secondes de jeu en quelques secondes, et le coût de chaque étape. C'est le
  budget **processeur**, celui qui nous appartient.
- **le compteur de fidèles, qu'on touche du doigt** — l'affichage de debug.
  Les mêmes chiffres, mais sur l'appareil du joueur, dans Expo Go. C'est le
  seul moyen de mesurer un vrai téléphone — et certains réglages, comme
  l'anticrénelage matériel d'iOS, sont **invisibles pour le banc**.

Ce que la mesure a montré : **la logique du jeu ne coûtait presque rien
(0,25 ms sur 16,7), et la foule coûtait tout — 288 796 triangles par image**,
dont la quasi-totalité pour des personnages situés hors de l'écran. La cité
entière, ses 124 immeubles et ses 434 bandes blanches comprises, n'en pèse que
3 196.

| Partie réelle, cortège d'une trentaine | Avant | Après |
|---|---|---|
| Calcul par image | 0,245 ms | **0,070 ms** |
| Triangles par image | 131 512 | **9 119** |
| Mortels dessinés | 450 / 450 | **18 / 450** |

| Pire cas : cortège plein (600 fidèles) | Avant | Après |
|---|---|---|
| Calcul par image | 1,584 ms | **0,772 ms** |
| Triangles par image | 288 796 | **53 604** |

Quatre idées suffisent à expliquer l'essentiel, et elles répondent toutes à la
même question — **est-ce que ça se voit ?**

**1. Ne dessiner que ce qui est cadré.** La caméra est haute et penchée : elle
ne montre qu'une quarantaine d'unités devant le joueur, sur une cité de 198.
Three.js sait écarter un *objet* hors champ, mais pas une *instance* : la foule
entière ne forme qu'un seul objet, toujours à l'écran. `ViewCulling` fait donc
ce tri nous-mêmes, silhouette par silhouette. Le tronc de vision de la caméra
plutôt qu'un rayon autour du joueur, parce qu'un rayon devrait être taillé pour
le pire écran — étroit sur un téléphone vertical, trois fois plus ouvert dans
une fenêtre de navigateur — et recalculé à chaque retouche de la caméra.

**2. Alléger la silhouette, du bon côté.** Une capsule de 4 × 8 segments pèse
**272 triangles**, en 2 × 8 seulement **144**. Les deux réglages ne se valent
pas : la caméra plonge de haut, donc c'est le découpage **radial** qui dessine
le contour visible, tandis que les calottes ne coûtent que des triangles. On
divise les calottes par deux et on garde les 8 côtés — descendre le radial à 6
gagnait encore un quart, mais transformait les mortels proches en cailloux à
facettes.

**3. Couper l'anticrénelage**, dans le renderer *et* sur `GLView`
(`msaaSamples={0}`). Ce second réglage est propre à iOS, qui applique par
défaut 4 échantillons par pixel sur un écran déjà très dense. ⚠️ Le banc web ne
peut pas le mesurer : c'est un réglage à juger sur un vrai téléphone.

**4. Ne pas faire marcher ce que personne ne regarde.** Un mortel hors champ
avance une image sur quatre, d'un pas quatre fois plus long : il accumule le
temps qui lui est dû au lieu de le perdre. Il parcourt exactement la même
distance et se retrouve au bon endroit quand le joueur arrive.

Le reste est du travail d'artisan sur les boucles chaudes, chaque fois vérifié
au banc : matrices d'instances écrites à la main plutôt que par un `Object3D`
de service, `Math.hypot` remplacé par une racine carrée (**13,6 fois plus
rapide**, mesuré), envoi partiel du tampon d'instances, et deux grilles
resserrées :

- **les collisions** n'interrogent plus que les cases que le personnage touche
  vraiment — une, parfois deux — au lieu des neuf qui l'entourent ;
- **la répulsion du cortège** ne vide plus que les cases qu'elle a remplies. La
  grille en gardait une pour chaque mètre carré jamais traversé : le jeu
  ralentissait donc à mesure qu'on visitait la cité. `separate()` est passée de
  0,617 à 0,336 ms.

> **Ce qui a été mesuré puis laissé tel quel.** Descendre à 39 000 triangles
> (1 calotte, 5 côtés) faisait gagner 30 % de plus **sur le banc** : refusé, la
> perte visuelle était nette, et optimiser pour un GPU logiciel c'est optimiser
> pour la mauvaise machine. Découper la ville en morceaux pour la trier par
> quartiers ne rapporterait rien non plus : elle ne pèse que 3 196 triangles
> sur 53 604. Et remplacer la table de hachage de la répulsion par un tableau
> plat gagnerait environ 0,15 ms sur 0,77, au prix d'un code nettement moins
> lisible. Le budget est tenu ; on s'arrête là et on le note.

Sur le banc web (Chromium, **GPU logiciel**, format téléphone), les images par
seconde sont passées de **8,5 à 12,1** à l'arrêt et de **8,5 à 11,7** en
course. Ce chiffre ne dit rien d'un vrai téléphone — le banc rend ses pixels
sans carte graphique — mais il confirme le sens de la marche. Et il rappelle
l'essentiel : à 11 images par seconde, l'affichage de debug indique **90 ms
d'image pour 0,4 ms de calcul**. Le goulot du banc n'a jamais été notre code.

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

**Pas d'ombres, et maintenant on sait pourquoi.** Le profilage de la
Milestone 7 a tranché : le temps d'une image ne part pas dans notre code
(0,07 ms sur 16,7) mais dans le dessin des pixels. Une passe d'ombres double
le nombre de géométries rendues et ajoute une lecture de texture par pixel :
c'est exactement le budget déjà sous tension. À rouvrir si un jour on mesure
de la marge sur un vrai téléphone, pas avant.

**Le banc de mesure fait partie du jeu.** `npm run bench` importe les vrais
systèmes, pas des copies : ce qu'il mesure est ce qui tourne. Il publie aussi
des garde-fous de qualité — personne dans un mur, cortège qui ne décroche pas,
fidèles qui ne s'empilent pas — pour qu'une optimisation qui casserait le jeu
se voie en chiffres et pas seulement à l'œil.

---

## Feuille de route

Le thème (mythologie grecque) a été décidé le 2026-09-02, après l'ancienne
Milestone 2 (aujourd'hui M3). Les milestones 4 à 10 restent **techniques** :
elles construisent la boucle de jeu, qui est la même quel que soit
l'habillage. Le thème arrive ensuite, une fois qu'il y a un jeu à habiller.

> La feuille de route est passée de 13 à 50 milestones le 2026-09-03, pour un
> découpage plus fin du travail restant. Voir
> **[`UPDATE.md`](./UPDATE.md)** pour la table de correspondance avec
> l'ancienne numérotation (les commits Git passés gardent leurs anciens
> numéros).

| # | Milestone | État |
|---|---|---|
| 1 | Projet + scène + déplacement du joueur | ✅ Terminée |
| 2 | Migration vers Expo (app mobile) + joystick tactile | ✅ Terminée |
| 3 | Ville simple + caméra | ✅ Terminée |
| 4 | **Mortels** : spawn + déambulation (~100) | ✅ Terminée |
| 5 | **Conversion** au contact | ✅ Terminée |
| 6 | Propagation de la conversion dans le cortège | ✅ Terminée |
| 7 | Système de cortège (formation, suivi) | ✅ Terminée |
| 8 | HUD : compteur de fidèles + relance | ✅ Terminée |
| 9 | Optimisation : profileur + banc de mesure | ✅ Terminée |
| 10 | Optimisation : tri par instance | ✅ Terminée |
| 11 | 🏛️ **La cité grecque** : quartiers, marbre, temples, repères | ✅ Terminée |
| 12 | 🏛️ Panthéon — roster de données (apparence, capacité, réglages) | ✅ Terminée |
| 12b | 🏛️ Le dieu au milieu de sa foule (cortège devant ET derrière) | ✅ Terminée |
| 13 | 🏛️ Menu d'accueil — onglets Jouer / Magasin / Dieux, paramètres | ✅ Terminée |
| 14 | 🏛️ Panthéon — apparence différenciée par dieu **en jeu** | 🟡 Partielle (couleur du dieu et du cortège) |
| 15 | 🏛️ Panthéon — déblocage progressif des dieux | 🟡 Partielle (achat en drachmes ; reste le déblocage par exploit) |
| 16 | Mortel spécialisé — l'hoplite (valeur ×3) | ⬜ |
| 17 | Mortel spécialisé — la prêtresse (recharge capacité) | ⬜ |
| 18 | Mortel spécialisé — le philosophe (fuite) | ⬜ |
| 19 | ⚡ Contrat `Ability` + bouton et jauge HUD | ⬜ |
| 20 | ⚡ Capacité Hermès — Talaria (sprint) | ⬜ |
| 21 | ⚡ Capacité Zeus — Foudre (conversion de zone) | ⬜ |
| 22 | ⚡ Capacité Aphrodite — Charme (rayon ×2,5) | ⬜ |
| 23 | ⚡ Capacité Poséidon — Ressac (attire les mortels) | ⬜ |
| 24 | ⚡ Capacité Athéna — Égide (invulnérabilité du cortège) | ⬜ |
| 25 | ⚡ Capacité Hadès — Retour du Styx (récupération) | ⬜ |
| 26 | ⚡ Capacité Arès — Charge (vol de fidèles) | ⬜ |
| 27 | ⚡ Équilibrage des capacités | ⬜ |
| 28 | ⚔️ Cortège rival — IA de déambulation et conversion | ⬜ |
| 29 | ⚔️ Combat au contact entre cortèges | ⬜ |
| 30 | ⚔️ Plusieurs cortèges rivaux sur la carte | ⬜ |
| 31 | ⚔️ Lisibilité UX du vol de fidèles | ⬜ |
| 32 | ⚔️ Optimisation : budget perf avec rivaux (2ᵉ passe) | ⬜ |
| 33 | Game feel — particules de conversion | ⬜ |
| 34 | Game feel — juice HUD (animations, feedback) | ⬜ |
| 35 | Audio — musique d'ambiance | ⬜ |
| 36 | Audio — effets sonores | ⬜ |
| 37 | Retour haptique | ⬜ |
| 38 | Écran de fin de partie / résultats | ⬜ |
| 39 | Réglages de qualité graphique adaptatifs | ⬜ |
| 40 | Contenu visuel — style des personnages (décision + prototype) | ⬜ |
| 41 | Contenu visuel — habillage hoplite / prêtresse / philosophe | ⬜ |
| 42 | Contenu visuel — détails de quartier | ⬜ |
| 43 | Contenu visuel — ambiance lumineuse (ciel, skybox) | ⬜ |
| 44 | Contenu visuel — artwork UI (icônes des dieux) | ⬜ |
| 45 | Décision — mode de jeu | ⬜ |
| 46 | Décision — monétisation | ⬜ |
| 47 | Publication — icônes, splash, métadonnées `app.json` | ⬜ |
| 48 | Publication — vérification nom/marque | ⬜ |
| 49 | Publication — build EAS + tests sur device réels | ⬜ |
| 50 | Publication — soumission App Store et Play Store | ⬜ |

### Ce que le thème change, milestone par milestone

- **M4 — Mortels.** Les PNJ s'appellent des mortels. Un seul type pour
  commencer (le citoyen) ; hoplites, prêtresses et philosophes viennent avec
  le panthéon (M16-M18), quand la boucle est jouable. Le code, lui, prévoit
  dès M4 un **type** par mortel, sinon il faudra tout reprendre.
- **M5 — Conversion.** Le contact « recrute » ; le thème n'ajoute qu'un mot et
  un effet visuel. Mais la M5 doit prévoir qu'un mortel puisse valoir **plus
  d'un fidèle** (l'hoplite en vaut 3), sinon le compteur sera à refaire.
- **M7 — Cortège.** Inchangé techniquement. C'est ici que se décide si un
  cortège de 500 fidèles reste lisible à l'écran.
- **M8 — HUD.** Le compteur affiche des **fidèles**. Prévoir dès maintenant la
  place du **bouton de capacité** (M19) : le HUD sera à redessiner sinon.
- **M9-M10 — Optimisation.** Le budget de performance devait être tenu
  **avant** d'ajouter marbre, colonnes et cortèges rivaux. Il l'est : 0,07 ms
  de calcul et 9 100 triangles par image en partie réelle. La M11 peut donc
  dépenser — et le banc dira aussitôt combien.
- **M11 — La cité grecque.** Faite : six quartiers, marbre et tuiles,
  colonnes, oliviers, la mer au bord du port. Le découpage corrige le défaut
  constaté en M3 — la grille uniforme où l'on se perdait — et c'est **la
  couleur du sol**, plus que les monuments, qui fait le travail.
  **Ce qui n'a PAS été fait ici** : les hoplites, prêtresses et philosophes,
  annoncés pour cette milestone à l'origine. Ils demandent un mesh par type
  et des comportements propres (fuir, rester immobile), et la prêtresse
  recharge une capacité qui n'existe qu'en M19. Ils vont donc avec le
  panthéon, en M16-M18.
- **M12-M15 — Le panthéon.** Un dieu = **une ligne de données**, pas une
  classe. Apparence, capacité, réglages propres. Plus l'écran de sélection.
  **M12 est faite** : `src/entities/gods/roster.ts` porte les sept dieux, et
  `Game` sait lequel est joué sans qu'aucun autre fichier ne connaisse le nom
  d'un dieu. Les réglages propres (`tuning`) valent tous 1 : les écarts
  s'inventent en jouant, avec les capacités sous la main — c'est la M27.
  **M13 est faite**, et elle a débordé : l'écran de sélection est devenu un
  **menu à trois onglets** (Jouer, Magasin, Dieux), donc une économie
  (les drachmes), un catalogue de parures et une sauvegarde. Le
  dossier `src/meta/` tient tout cela **hors du jeu** : le moteur reçoit un
  dieu et deux couleurs, il ignore qu'elles ont été payées.
- **M12b — Le dieu au milieu de sa foule.** Le cortège suivait en file, le
  dieu seul en tête : on voyait un homme suivi d'une foule, pas une foule
  ayant un dieu. Une partie du cortège vise désormais un point **devant** lui.
  Détail complet dans [`UPDATE.md`](./UPDATE.md).
- **M19-M27 — Capacités divines.** Le cœur du thème : Foudre, Talaria,
  Charme, Ressac, Égide, Retour du Styx, Charge. Même principe
  d'architecture que les entrées et les collisions — **un contrat, plusieurs
  implémentations** — donc le jeu ne connaîtra jamais « Zeus », seulement
  « la capacité active ».
- **M28-M32 — Rivaux.** Ce qui donne un enjeu à la carte et un sens aux
  capacités défensives (Égide, Retour du Styx) et offensives (Charge).

> **Envie de voir le thème plus tôt ?** On peut avancer la seule *palette* de
> la M11 (marbre et tuiles, ~1 h de travail, aucun risque) sans toucher aux
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
