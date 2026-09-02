/**
 * config.ts — TOUS les réglages du jeu au même endroit.
 *
 * C'est LE fichier à modifier pour tester des choses : change une valeur,
 * sauvegarde, le jeu se recharge tout seul. Aucun autre fichier à toucher.
 */

export const CONFIG = {
  /**
   * Le monde est un carré centré sur (0, 0). Ici : de -99 à +99 sur X et Z.
   *
   * ⚠️ Cette valeur est choisie comme un MULTIPLE EXACT du pas de la ville
   * (`blockSize + roadWidth` = 33) : le bord du monde tombe alors au milieu
   * d'une rue, jamais dans un immeuble, et la ville remplit tout le terrain.
   */
  world: {
    halfSize: 99,
    /**
     * Couleur du sol = la terre battue des rues (les dalles des quartiers
     * sont posées dessus).
     */
    groundColor: 0xbfa981,
    /**
     * La mer, au-delà du port. Elle remplace le mur invisible sur ce bord de
     * la carte : le joueur comprend enfin pourquoi il ne va pas plus loin.
     */
    seaColor: 0x2f7d9e,
    /** Le ciel, et le brouillard qui s'y fond au loin. */
    skyColor: 0xb4cfe0,
  },

  /**
   * La ville. Elle est faite de RUES et de PÂTÉS DE MAISONS alternés.
   *
   * Le motif se répète tous les `blockSize + roadWidth` : les rues sont
   * centrées sur les multiples de ce pas, donc (0, 0) — où démarre le
   * joueur — est toujours un carrefour.
   */
  city: {
    /** Côté d'un pâté de maisons, entre deux rues. */
    blockSize: 22,
    /** Largeur d'une rue, d'un trottoir à l'autre. */
    roadWidth: 11,
    /**
     * La dalle du quartier dépasse du pâté : c'est elle qu'on longe en
     * courant, et c'est SA COULEUR qui dit dans quel quartier on est.
     * Chaque quartier a la sienne (voir `world/districts.ts`).
     */
    sidewalkHeight: 0.18,
    /**
     * Chaque pâté est découpé en `lotsPerBlock` × `lotsPerBlock` parcelles.
     *
     * ⚠️ Passé de 2 à 3 en Milestone 8, pour une raison purement visuelle :
     * avec 2, un pâté n'était que quatre maisons de 11 unités de côté, donc
     * **quatre énormes toits rouges** vus d'en haut. À 3, la Céramique
     * redevient un tissu de petites toitures — ce qu'annonce son nom.
     */
    lotsPerBlock: 3,
    /**
     * Profondeur d'une maison, en multiples de sa parcelle.
     *
     * ⚠️ Vaut exactement 1 depuis la Milestone 8, et il y a deux raisons de
     * ne pas y toucher :
     *
     * - **en dessous de 1**, les maisons laisseraient des trous entre elles
     *   et la cité deviendrait traversable en diagonale (Milestone 2) ;
     * - **au-dessus de 1**, elles se CHEVAUCHENT. Deux obstacles qui se
     *   recouvrent se repoussent l'un l'autre : un personnage coincé dans
     *   leur intersection est renvoyé de l'un vers l'autre indéfiniment, et
     *   aucune passe de collision n'en sort. Mesuré au banc avec un cortège
     *   de 600 : jusqu'à 13 fidèles dans un mur, là où la règle est zéro.
     *
     * La variété ne vient donc plus de la profondeur, mais de la HAUTEUR et
     * des parcelles laissées vides (`emptyLotChance`) — qui creusent les
     * cours intérieures d'une cité grecque.
     */
    lotDepth: { min: 1, max: 1 },
    /**
     * Hauteur des immeubles. Volontairement BASSE : plus haut, les façades
     * situées derrière le joueur passeraient devant la caméra et le
     * cacheraient (constaté au banc de test). À relire avec `camera.offset`.
     */
    height: { min: 4, max: 10 },
    /**
     * Probabilité qu'une parcelle reste vide.
     *
     * C'est ce qui creuse les cours et les venelles de la Céramique — et,
     * depuis que la profondeur des maisons est figée à 1, la seule source de
     * variété du plan au sol.
     */
    emptyLotChance: 0.18,
    /**
     * Hauteur des entrepôts du port : bas et larges, pour qu'on voie la mer
     * par-dessus depuis le quai.
     */
    warehouseHeight: { min: 3, max: 5.5 },

    /**
     * Le toit de tuiles — l'apport visuel décisif de la Milestone 8.
     *
     * ⚠️ Ce n'est pas de la décoration. La caméra plonge de 40 unités de
     * haut : d'une maison, on voit surtout **son toit**. C'est la tuile, pas
     * la façade, qui fait qu'une cité paraît grecque. Le débord donne
     * l'ombre portée qui détache le bâtiment de sa rue.
     */
    roofHeight: 0.55,
    roofOverhang: 0.9,

    /** Colonnes : agora, temples, péristyles. Décor, elles ne bloquent pas. */
    columnRadius: 0.42,
    columnHeight: 4.6,
    columnSpacing: 4.4,

    /** Oliviers plantés dans un pâté de bois sacré. */
    treesPerGrove: 11,

    /**
     * Le pavage au milieu des rues. Il remplace les bandes blanches de la
     * Milestone 2 : une cité grecque n'a pas de marquage routier, mais elle
     * a des dalles — et sans repère au sol, on ne sent plus qu'on avance.
     */
    pavingSize: 2.4,
    pavingGap: 2.2,
    /**
     * Graine du générateur aléatoire. Change ce nombre = autre ville.
     * Fixe = la ville est identique à chaque lancement (et testable).
     */
    seed: 20260902,
  },

  /**
   * Les mortels — les PNJ que l'on convertit (Milestone 4).
   *
   * ⚠️ Un mortel a un **type** dès maintenant, alors qu'il n'en existe qu'un
   * seul (le citoyen). C'est volontaire : hoplites, prêtresses et philosophes
   * sont prévus (voir UNIVERS.md), et les greffer plus tard sur un code qui
   * suppose « tous les mortels sont identiques » coûterait une réécriture.
   */
  mortals: {
    /**
     * Combien de mortels vivent dans la cité en même temps.
     *
     * ⚠️ Valeur calculée, pas devinée. Le joueur balaie un couloir de
     * `2 × conversion.radius` de large à 18 u/s, soit 68 unités² par seconde
     * sur les 39 200 de la cité. À 100 mortels cela donnait **3 conversions
     * en 40 secondes** (mesuré) : injouable. À 450, on attend environ une
     * conversion par seconde, ce qui est le rythme du genre.
     *
     * Si tu changes `world.halfSize` ou `conversion.radius`, ce nombre est à
     * recalculer.
     */
    count: 450,

    /**
     * Le catalogue des types. Un type = une ligne, comme pour les dieux.
     * `value` est le nombre de fidèles gagnés à la conversion (Milestone 4).
     */
    types: {
      citizen: {
        label: 'Citoyen',
        /**
         * ⚠️ Assombri en Milestone 8. Le beige clair d'origine se lisait très
         * bien sur l'asphalte gris de la Milestone 2 ; sur le marbre et la
         * terre battue de la cité grecque, les mortels disparaissaient dans
         * le décor. Une foule doit se voir : c'est elle qu'on vient chercher.
         */
        color: 0x74513a,
        value: 1,
        /** Unités par seconde. Très lent face aux 18 u/s du joueur. */
        speed: 2.6,
        radius: 0.45,
        height: 1.1,
      },
    },

    /** Durée d'une marche en ligne droite avant de changer de cap. */
    wander: { minSeconds: 2, maxSeconds: 5 },

    /**
     * Écart maximal (en radians) autour d'une direction cardinale.
     *
     * Les mortels ne partent PAS dans une direction totalement aléatoire :
     * ils suivent l'axe des rues, avec un léger flottement. Sans cela, ils
     * passeraient leur temps le nez dans les façades.
     */
    headingJitter: 0.35,

    /**
     * Rayon laissé vide autour du point de départ, à la naissance.
     *
     * Sans lui, un mortel apparaissait parfois sous les pieds de la divinité
     * et était converti à la première image : la partie commençait à « 1
     * fidèle » au lieu de zéro.
     */
    spawnClearance: 7,

    /**
     * Sur combien d'images étaler la déambulation des mortels HORS CHAMP.
     *
     * La caméra ne cadre qu'une trentaine de mortels sur 450. Les autres
     * n'ont aucune raison d'avancer 60 fois par seconde : ils avancent une
     * image sur 4, d'un pas quatre fois plus long. Ils parcourent exactement
     * la même distance — le temps qui leur est dû est accumulé, pas perdu —
     * et se retrouvent au bon endroit quand le joueur arrive.
     *
     * ⚠️ Ne pas monter beaucoup plus haut. À 4, un mortel hors champ avance
     * par pas de 17 cm ; c'est ce qui garantit qu'il ne traverse pas une
     * façade (le pas doit rester très inférieur à l'épaisseur d'un mur), et
     * qu'il ne « saute » pas visiblement en entrant dans le champ.
     */
    offscreenSlices: 4,

    /** Graine du placement initial : la même cité peuplée à chaque lancement. */
    seed: 77,
  },

  /**
   * La conversion : ce qui se passe quand le joueur touche un mortel.
   */
  conversion: {
    /**
     * Distance sous laquelle un mortel rejoint le cortège, mesurée de centre
     * à centre. Somme des deux rayons (0,6 + 0,45 = 1,05) plus une marge de
     * confort : sur un téléphone, exiger le contact exact est frustrant.
     */
    radius: 1.9,
    /**
     * Un mortel converti est remplacé par un nouveau, ailleurs dans la cité,
     * pour qu'elle ne se vide jamais. Ce nouveau naît au moins à cette
     * distance du joueur, sinon on le verrait apparaître sous ses yeux.
     */
    respawnMinDistance: 70,
  },

  /**
   * Le cortège : les fidèles qui suivent le joueur.
   *
   * Deux mécanismes, indépendants, se combinent :
   *
   * 1. **Le chemin** (`trail*`, `lag*`) — chaque fidèle vise un point situé à
   *    N mètres derrière le joueur SUR SON CHEMIN, pas sa position. C'est ce
   *    qui empêche les traînards de se coincer derrière un immeuble.
   * 2. **L'écartement** (`separation*`) — les fidèles se repoussent, ce qui
   *    transforme la file indienne en foule.
   */
  retinue: {
    /**
     * Taille maximale. Un `InstancedMesh` réserve ses emplacements une fois
     * pour toutes : c'est le plafond dur du cortège.
     */
    maxSize: 600,
    color: 0x7dd3fc,
    /** Les fidèles vont un peu plus vite que le joueur, sinon ils décrochent. */
    speedFactor: 1.12,

    /** Un point de chemin tous les 35 cm : assez fin, et le tableau reste court. */
    trailPointSpacing: 0.35,
    /**
     * Longueur de chemin mémorisée, en unités. Doit couvrir le retard du
     * dernier fidèle : `lagMin + lagStep × √maxSize` ≈ 2,4 + 0,55 × 24 ≈ 16,
     * avec une marge confortable.
     */
    trailMaxLength: 60,

    /**
     * Retard du premier fidèle sur le chemin du joueur.
     *
     * ⚠️ Ne pas descendre : trop court, les fidèles collent la divinité au
     * point de la cacher dans sa propre foule (constaté en capture).
     */
    lagMin: 2.4,
    /**
     * Étalement du cortège le long du chemin. La racine carrée du rang évite
     * qu'un cortège de 500 s'étire sur 250 mètres.
     */
    lagStep: 0.55,

    /**
     * Distance à la cible en dessous de laquelle un fidèle **cesse de la
     * chasser**.
     *
     * ⚠️ Réglage clé. Sans elle, chaque fidèle se posait exactement sur son
     * point du chemin — et comme les rangs voisins partagent presque le même
     * point, ils s'empilaient : 121 paires superposées, mesurées. En les
     * laissant s'arrêter « à peu près » à leur place, la répulsion a la place
     * de les étaler en foule.
     */
    arriveRadius: 0.75,

    /** Distance en dessous de laquelle deux fidèles se repoussent. */
    separation: 1.05,
    /**
     * Part du chevauchement corrigée par frame (0 à 1). Trop haut, la foule
     * vibre ; trop bas, elle s'interpénètre.
     */
    separationStrength: 1,
    /**
     * Nombre de passes de répulsion par frame. Deux passes valent bien mieux
     * qu'une force doublée : la foule se démêle sans vibrer.
     */
    separationPasses: 2,
  },

  /**
   * La foule — ce que coûte UNE silhouette, mortels et fidèles confondus.
   *
   * ⚠️ Le poste de dépense numéro un du jeu. Une capsule de 4 × 8 segments
   * pèse 272 triangles ; à 450 mortels plus 600 fidèles, cela fait 286 000
   * triangles envoyés au GPU à chaque image, soit 99 % de la scène (la ville
   * entière n'en compte que 2 500). C'est ici, et nulle part ailleurs, que se
   * gagne le budget d'affichage.
   */
  crowd: {
    /**
     * Découpage des silhouettes de foule (mortels et fidèles).
     *
     * ⚠️ Le poste de dépense numéro un du jeu. En 4 × 8 segments, une capsule
     * pèse **272 triangles** ; à 450 mortels plus 600 fidèles, cela fait
     * 286 000 triangles envoyés au GPU à chaque image, soit 99 % de la scène
     * (la ville entière n'en compte que 3 200).
     *
     * Les deux réglages ne se valent pas. La caméra plonge de haut, donc
     * c'est le découpage RADIAL qui dessine le contour visible ; les
     * calottes, vues de dessus, ne coûtent que des triangles. D'où 2 calottes
     * au lieu de 4, mais 8 côtés conservés : **144 triangles**, sans perte
     * visible.
     *
     * ⚠️ Descendre le radial à 6, et plus encore à 5, transforme les mortels
     * proches de la caméra en cailloux à facettes (constaté en capture). Le
     * gain ne valait que sur le GPU **logiciel** du banc de test ; un GPU de
     * téléphone avale ces triangles-là sans sourciller.
     */
    capSegments: 2,
    radialSegments: 8,

    /**
     * Marge, en unités, ajoutée au champ de la caméra pour décider ce qu'on
     * dessine (voir `ViewCulling`).
     *
     * Elle absorbe le fait qu'une silhouette a une épaisseur, et que la
     * caméra bouge entre le test et l'affichage. Trop petite, on verrait des
     * mortels apparaître en bord d'écran ; trop grande, on redessine pour
     * rien. 4 unités = deux fois la largeur d'un personnage.
     *
     * > Une VÉRIFICATION utile, si tu doutes du tri : avec un recul de 18,
     * > une hauteur de 40 et 60° de champ, le point le plus lointain visible
     * > est à 38 unités devant le joueur, et la demi-largeur du champ y vaut
     * > 15 — soit 40 unités en diagonale sur un téléphone tenu à la verticale.
     * > Le tronc de vision retrouve ce chiffre tout seul, et l'adapte quand
     * > l'écran change de format ; c'est pour cela qu'aucune distance n'est
     * > écrite en dur ici.
     */
    cullMargin: 4,
  },

  player: {
    /** Unités par seconde. Monte à 30 pour voir la différence. */
    speed: 18,
    /** Le joueur est une capsule : rayon et hauteur du corps. */
    radius: 0.6,
    height: 1.6,
    color: 0x4ade80,
    /**
     * Temps (en secondes) pour atteindre la pleine vitesse.
     * 0 = démarrage sec, 0.3 = démarrage souple. C'est du "game feel".
     */
    acceleration: 0.12,
  },

  camera: {
    /**
     * Position de la caméra RELATIVE au joueur (vue 3/4 arrière).
     *
     * ⚠️ Le rapport y/z fixe l'inclinaison, et donc ce qui peut passer
     * DEVANT le joueur : ici la ligne de visée monte de 40 pour 18, soit
     * 2,2 unités de hauteur par unité de recul. Un immeuble situé 5 unités
     * derrière le joueur devrait donc dépasser 11 de haut pour le cacher —
     * c'est pour cela que `city.height.max` reste bas.
     */
    offset: { x: 0, y: 40, z: 18 },
    /** Souplesse du suivi : 0 = collée, 1 = très molle. */
    smoothing: 0.12,
    /**
     * Champ de vision. Plus élevé sur téléphone (écran étroit tenu à la
     * verticale) pour qu'on voie assez de ville autour du joueur.
     */
    fov: 60,
    /**
     * Anticipation : la caméra vise un peu DEVANT le joueur, proportion-
     * nellement à sa vitesse. On voit ainsi où l'on va, pas d'où l'on vient.
     * 0 = désactivé. Exprimé en unités de monde à pleine vitesse.
     *
     * ⚠️ Le coût d'un demi-tour est le DOUBLE de cette valeur. À 7, faire
     * droite puis gauche balayait 14 unités à 65 u/s — presque quatre fois
     * la vitesse du joueur : l'image se bousculait.
     */
    lookAhead: 3.5,
    /**
     * Souplesse propre à l'anticipation. Même convention que `smoothing` :
     * c'est la part de l'écart qui RESTE à chaque frame, donc plus c'est
     * proche de 1, plus c'est mou. Elle doit rester nettement plus molle que
     * le suivi, sinon la caméra part avant le joueur.
     */
    lookAheadSmoothing: 0.965,
    /**
     * En dessous de cette intensité de mouvement, on ne change plus la
     * cible d'anticipation : elle est simplement CONSERVÉE. Sans ça,
     * relâcher le doigt recentrait la caméra, et repartir dans l'autre sens
     * la relançait — deux mouvements parasites pour un simple aller-retour.
     */
    lookAheadDeadZone: 0.15,
  },

  /**
   * Réglages de rendu — le sujet de la Milestone 7.
   *
   * Mesure de départ (banc de test, 600 fidèles + 450 mortels) : **288 798
   * triangles par image**, 187 ms de temps d'image dont **186 ms de dessin**
   * contre 1,13 ms de calcul. Tout le coût était donc dans la géométrie
   * envoyée au GPU, pas dans notre code.
   */
  render: {
    /**
     * Anticrénelage. Il lisse les contours, mais fait travailler le GPU sur
     * chaque pixel de l'écran — c'est cher sur mobile, où l'écran est déjà
     * très dense. À réactiver seulement si les bords paraissent trop durs.
     *
     * ⚠️ Sur iOS, il ne suffit PAS de le couper ici : `GLView` applique de son
     * côté un anticrénelage matériel à 4 échantillons, coupé dans `App.tsx`
     * par `msaaSamples={0}`. Le banc de test web ne peut mesurer ni l'un ni
     * l'autre — c'est un réglage à juger sur un vrai téléphone.
     */
    antialias: false,
  },

  /**
   * Outils de développement. À couper avant publication (Milestone 13).
   */
  debug: {
    /**
     * Affiche images/seconde et coût de chaque étape dans un coin de l'écran.
     *
     * C'est l'outil de la Milestone 7 : le banc de mesure tourne sur une
     * machine de développement et ne dit rien des performances réelles. La
     * seule mesure qui compte se prend sur un vrai téléphone, donc le jeu
     * doit savoir se mesurer lui-même.
     *
     * Éteint par défaut, parce qu'il n'y a plus besoin de recompiler pour le
     * voir : **toucher le compteur de fidèles l'allume et l'éteint**, dans
     * Expo Go comme au banc web. Mettre `true` ici le montre dès le
     * lancement.
     */
    showStats: false,
  },

  /** L'interface : ce qui est posé PAR-DESSUS la 3D. */
  hud: {
    /**
     * Intervalle minimal entre deux publications du score, en millisecondes.
     *
     * ⚠️ Le cœur du problème de la Milestone 6. Le jeu tourne à 60 images par
     * seconde ; prévenir React à chaque image déclencherait 60 rendus
     * d'interface par seconde pour afficher un nombre. On ne publie donc que
     * si le score a CHANGÉ, et au plus toutes les 120 ms — soit 8 fois par
     * seconde, ce que l'œil lit déjà comme instantané.
     */
    scorePublishInterval: 120,
  },

  /**
   * Le profileur : ce que coûte une image, étape par étape (Milestone 7).
   *
   * Il est branché en permanence — son coût est de huit lectures d'horloge
   * par image — mais n'affiche rien tant qu'on ne le lui demande pas.
   * **Touche le compteur de fidèles pour faire apparaître les mesures**, y
   * compris sur le téléphone : c'est le seul moyen de savoir ce que coûte le
   * jeu sur l'appareil du joueur plutôt que sur une machine de développement.
   * (Pour qu'elles soient visibles dès le lancement : `debug.showStats`.)
   */
  profiler: {
    /** Nombre d'images agrégées avant de publier une moyenne. */
    windowFrames: 30,
    /** Intervalle minimal entre deux publications vers l'interface, en ms. */
    publishInterval: 500,
  },

  joystick: {
    /** Rayon du joystick en points. Au-delà, l'intensité est au maximum. */
    radius: 60,
    /**
     * Sous ce déplacement du doigt (en points), on considère qu'on n'a pas
     * bougé. Sans cette zone morte, le personnage tremblote sur place.
     */
    deadZone: 8,
  },
} as const;
