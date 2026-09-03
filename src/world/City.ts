/**
 * City.ts — la cité grecque : ses quartiers, ses rues et ce qu'on y bâtit.
 *
 * Quatre idées à retenir :
 *
 * 1. **Un motif régulier.** Rues et pâtés de maisons alternent tous les
 *    `blockSize + roadWidth`. Les rues sont centrées sur les multiples de ce
 *    pas, donc (0, 0) est toujours un carrefour : le joueur ne démarre
 *    jamais dans un mur.
 *
 * 2. **Un quartier par pâté** (Milestone 11). Le plan de la cité vit dans
 *    `districts.ts` ; ici on ne fait que *bâtir* ce qu'il annonce. Chaque
 *    quartier a sa couleur de sol, ses façades et sa façon d'occuper le
 *    terrain — c'est ce qui rend la cité lisible plutôt qu'uniforme.
 *
 * 3. **Un InstancedMesh par matériau, pas un objet par bâtiment.** Toute la
 *    cité tient en sept appels GPU : dalles de quartier, murs, toits,
 *    colonnes, troncs, feuillages, pavés. Un immeuble de plus ne coûte
 *    qu'une matrice.
 *
 * 4. **La cité est aussi la carte de collision.** En construisant, on note le
 *    rectangle au sol de ce qui bloque, rangé dans une grille : savoir contre
 *    quoi on bute ne teste que les cases qu'on touche, jamais tous les
 *    obstacles.
 *
 * ⚠️ **Ce qui bloque et ce qui ne bloque pas.** Murs, plateformes, gradins et
 * entrepôts sont des obstacles. **Colonnes et oliviers n'en sont pas** : ce
 * sont des décors qu'on traverse. Ce n'est pas un oubli — un cortège de 600
 * fidèles se coince sur les obstacles fins (mesuré en Milestone 9 : un fidèle
 * bloqué contre une façade décroche de 40 unités). Semer une forêt de poteaux
 * dans les rues coûterait bien plus en jouabilité que ça ne rapporte en
 * réalisme.
 */

import * as THREE from 'three';
import { CONFIG } from '../config';
import type { Box2, Collider } from './Collider';
import { DISTRICTS, districtAt, districtAtPoint, type District, type DistrictId } from './districts';

/**
 * Générateur pseudo-aléatoire déterministe (mulberry32, ~10 lignes).
 *
 * Pourquoi ne pas utiliser Math.random ? Parce qu'une ville différente à
 * chaque lancement est intestable, et impossible à équilibrer. Ici la même
 * graine redonne toujours exactement la même ville.
 */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Une instance à poser : sa matrice, et sa couleur quand elle en a une. */
interface Piece {
  matrix: THREE.Matrix4;
  color?: THREE.Color;
}

/** Tout ce que la construction accumule, avant d'en faire des meshes. */
interface Yard {
  plates: Piece[];
  walls: Piece[];
  roofs: Piece[];
  columns: Piece[];
  trunks: Piece[];
  foliage: Piece[];
  paving: Piece[];
}

export class City implements Collider {
  /** Rectangles au sol de ce qui bloque — la vérité pour les collisions. */
  readonly obstacles: Box2[] = [];

  /** Distance d'un motif complet (une rue + un pâté de maisons). */
  readonly pitch = CONFIG.city.blockSize + CONFIG.city.roadWidth;

  /** Indice du dernier pâté sur un axe. Les pâtés vont de -lastBlock-1 à +lastBlock. */
  readonly lastBlock: number;

  private readonly scene: THREE.Scene;
  private readonly meshes: THREE.Object3D[] = [];

  /**
   * Index spatial : les obstacles rangés par case de `pitch` unités
   * (soit une case par pâté de maisons).
   *
   * La clé est un NOMBRE, pas une chaîne « colonne,ligne » : avec 450 mortels
   * interrogeant la grille à chaque image, la version en chaînes fabriquait
   * des milliers de chaînes par image, à jeter aussitôt. `cellKey()` encode
   * les deux coordonnées dans un entier — même lisibilité, zéro allocation.
   */
  private readonly grid = new Map<number, Box2[]>();

  /** Vecteur de travail de `isFree()` — voir le commentaire de la méthode. */
  private readonly probe = new THREE.Vector2();

  /**
   * Où naissent les mortels : un pâté par entrée, répété selon la densité de
   * son quartier (voir `District.crowd`).
   *
   * C'est ce qui donne une RAISON d'aller quelque part. Avec un tirage
   * uniforme, l'agora et le bois sacré se valaient, donc le choix de la
   * direction n'en était pas un ; ici l'agora reçoit six fois plus de monde
   * que le bois, et cela se voit dès qu'on y met les pieds.
   *
   * Le tirage se fait par somme cumulée : un seul tableau de nombres, une
   * recherche linéaire sur 36 entrées, rien d'alloué.
   */
  private readonly spawnBlocks: { x: number; z: number }[] = [];
  private readonly spawnWeights: number[] = [];
  private spawnTotal = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    const { halfSize } = CONFIG.world;
    this.lastBlock = Math.floor((halfSize - CONFIG.city.blockSize / 2) / this.pitch);
    this.build();
  }

  // ---------------------------------------------------------------- construction

  private build(): void {
    const random = createRandom(CONFIG.city.seed);
    const yard: Yard = {
      plates: [],
      walls: [],
      roofs: [],
      columns: [],
      trunks: [],
      foliage: [],
      paving: [],
    };

    const { blockSize } = CONFIG.city;
    const { halfSize } = CONFIG.world;

    for (let bx = -this.lastBlock - 1; bx <= this.lastBlock; bx += 1) {
      for (let bz = -this.lastBlock - 1; bz <= this.lastBlock; bz += 1) {
        const blockX = bx * this.pitch + this.pitch / 2;
        const blockZ = bz * this.pitch + this.pitch / 2;

        // Un pâté entier hors du monde ne sert à rien : on le saute.
        if (Math.abs(blockX) + blockSize / 2 > halfSize) continue;
        if (Math.abs(blockZ) + blockSize / 2 > halfSize) continue;

        const district = DISTRICTS[districtAt(bx, bz, this.lastBlock)];

        // La dalle du quartier : c'est elle qu'on voit le plus, puisque la
        // caméra plonge. Elle porte la couleur du quartier.
        yard.plates.push({
          matrix: plateMatrix(blockX, blockZ, blockSize),
          color: new THREE.Color(district.ground),
        });

        this.spawnBlocks.push({ x: blockX, z: blockZ });
        this.spawnTotal += district.crowd;
        this.spawnWeights.push(this.spawnTotal);

        this.fillBlock(district, blockX, blockZ, random, yard);
      }
    }

    this.addPaving(yard);
    this.publish(yard);
    this.addSea();
  }

  /** Ce qu'on bâtit sur un pâté dépend entièrement de son quartier. */
  private fillBlock(
    district: District,
    blockX: number,
    blockZ: number,
    random: () => number,
    yard: Yard,
  ): void {
    switch (district.build) {
      case 'houses':
        this.buildHouses(district, blockX, blockZ, random, yard, CONFIG.city.height);
        break;
      case 'warehouses':
        // Le port ne bâtit pas jusqu'à l'eau : la rangée côté mer reste
        // libre, et devient le quai.
        this.buildHouses(district, blockX, blockZ, random, yard, CONFIG.city.warehouseHeight, true);
        break;
      case 'colonnade':
        this.buildColonnade(blockX, blockZ, yard);
        break;
      case 'temple':
        this.buildTemple(district, blockX, blockZ, yard);
        break;
      case 'tiers':
        this.buildTiers(district, blockX, blockZ, yard);
        break;
      case 'grove':
        this.buildGrove(blockX, blockZ, random, yard);
        break;
    }
  }

  /**
   * Le tissu urbain : des maisons plaquées sur la rue, coiffées de tuiles.
   *
   * Ce détail de placement change tout, et date de la Milestone 3. Si chaque
   * maison était centrée dans sa parcelle avec un recul, les reculs
   * s'aligneraient d'un pâté à l'autre et ouvriraient des couloirs
   * rectilignes à travers toute la cité : on la traverserait au lieu de la
   * contourner (constaté au banc de test). Plaquées sur la rue et débordant
   * vers l'intérieur, elles forment une façade continue, et c'est la COUR —
   * invisible — qui absorbe les variations.
   *
   * Le TOIT, lui, est l'apport de la Milestone 11, et ce n'est pas un détail
   * décoratif : vue de 40 unités de haut, une maison est essentiellement un
   * toit. C'est la tuile, pas la façade, qui donne à la cité son air grec.
   */
  private buildHouses(
    district: District,
    blockX: number,
    blockZ: number,
    random: () => number,
    yard: Yard,
    height: { min: number; max: number },
    /** Laisser libre la rangée côté mer — c'est ce qui fait le quai. */
    quayside = false,
  ): void {
    const { blockSize, lotsPerBlock, lotDepth, emptyLotChance } = CONFIG.city;
    const lotSize = blockSize / lotsPerBlock;

    // ⚠️ Une parcelle du pourtour est TOUJOURS laissée vide : c'est la
    // venelle qui ouvre la cour sur la rue.
    //
    // Sans elle, une cour sur cinq se retrouvait entièrement ceinturée de
    // maisons. Un fidèle poussé là-dedans par ses voisins n'en ressortait
    // jamais : il restait derrière à perpétuité (étalement du cortège mesuré
    // à 82 unités au banc) et se faisait enfoncer dans les murs par ceux qui
    // arrivaient après. Une cité qui enferme est une cité qui triche.
    const rimLots = lotsPerBlock * lotsPerBlock - (lotsPerBlock - 2) ** 2;
    const gate = Math.floor(random() * rimLots);
    let rimIndex = -1;

    for (let lx = 0; lx < lotsPerBlock; lx += 1) {
      for (let lz = 0; lz < lotsPerBlock; lz += 1) {
        // ⚠️ Le quai n'est pas qu'un décor. Sans lui, la rue du bord ne
        // faisait que 5,5 unités entre les entrepôts et la mer : un cortège
        // de 600 fidèles s'y écrasait, et la répulsion en poussait dans les
        // murs (mesuré au banc, 5 fidèles sur 600 — la règle est zéro). Une
        // bande libre de 13 unités le long de l'eau règle les deux à la fois.
        if (quayside && lz === lotsPerBlock - 1) continue;

        // ⚠️ Le pâté est un ANNEAU de maisons autour d'une cour, jamais un
        // bloc plein. Ce n'est pas qu'une justesse d'époque — c'est ce qui
        // borne l'épaisseur de ce dans quoi on peut se coincer.
        //
        // La collision ressort un personnage de la maison où il est, par le
        // côté le plus court. Si les maisons sont mitoyennes, en sortir
        // d'une le fait entrer dans la suivante, et il fait la navette entre
        // les deux : aucune passe ne l'en tire. Un anneau d'une seule
        // parcelle d'épaisseur garantit que l'air libre — la rue ou la cour —
        // n'est jamais qu'à une demi-maison.
        const onRim = lx === 0 || lz === 0 || lx === lotsPerBlock - 1 || lz === lotsPerBlock - 1;
        if (!onRim) continue;

        rimIndex += 1;
        if (rimIndex === gate) continue;
        if (random() < emptyLotChance) continue;

        // Coin EXTÉRIEUR de la parcelle : celui qui touche la rue.
        const lotX = blockX - blockSize / 2 + lotSize * (lx + 0.5);
        const lotZ = blockZ - blockSize / 2 + lotSize * (lz + 0.5);
        const outX = Math.sign(lotX - blockX);
        const outZ = Math.sign(lotZ - blockZ);

        const sizeX = lotSize * lerp(lotDepth.min, lotDepth.max, random());
        const sizeZ = lotSize * lerp(lotDepth.min, lotDepth.max, random());
        const tall = lerp(height.min, height.max, random() ** 1.7);

        const cx = blockX + outX * (blockSize / 2 - sizeX / 2);
        const cz = blockZ + outZ * (blockSize / 2 - sizeZ / 2);

        this.addWall(yard, district, random, cx, cz, sizeX, sizeZ, tall);
      }
    }
  }

  /**
   * L'agora : pas de bâti, une colonnade sur le pourtour.
   *
   * Le joueur démarre au coin commun des quatre pâtés de l'agora — donc au
   * milieu d'une place monumentale, et non dans une ruelle. Les colonnes
   * habillent l'espace sans le fermer (elles ne bloquent pas), et l'autel
   * central, lui, est un vrai obstacle : il donne un point de repère et
   * quelque chose à contourner.
   */
  private buildColonnade(blockX: number, blockZ: number, yard: Yard): void {
    const { blockSize, columnSpacing } = CONFIG.city;
    const inset = blockSize / 2 - 1.6;
    const steps = Math.max(2, Math.round((inset * 2) / columnSpacing));

    for (let i = 0; i <= steps; i += 1) {
      const t = -inset + (i * (inset * 2)) / steps;
      this.addColumn(yard, blockX + t, blockZ - inset);
      this.addColumn(yard, blockX + t, blockZ + inset);
      // Les coins sont déjà posés par la boucle du dessus : on les saute.
      if (i > 0 && i < steps) {
        this.addColumn(yard, blockX - inset, blockZ + t);
        this.addColumn(yard, blockX + inset, blockZ + t);
      }
    }

    // L'autel : deux degrés de marbre au centre de la place.
    const marble = new THREE.Color(0xe6e0d0);
    yard.plates.push({
      matrix: boxMatrix(blockX, 0.35, blockZ, 5.4, 0.7, 5.4),
      color: marble,
    });
    yard.walls.push({
      matrix: boxMatrix(blockX, 1.4, blockZ, 3.4, 1.4, 3.4),
      color: marble,
    });
    this.addObstacle({ x: blockX, z: blockZ, halfX: 1.7, halfZ: 1.7 });
  }

  /**
   * L'Acropole : une plateforme de marbre, sa colonnade et sa cella.
   *
   * ⚠️ **Le temple n'a pas de toit**, et c'est un choix de lisibilité, pas
   * une ruine. Couvert, il ne présentait à la caméra qu'un grand rectangle
   * rouge : le péristyle, qui est tout ce qui dit « temple grec », se cachait
   * dessous (constaté en capture). À ciel ouvert, on lit d'un coup d'œil la
   * plateforme claire, l'anneau de colonnes et la cella au milieu.
   *
   * ⚠️ Il **ne dépasse pas** la hauteur des maisons les plus hautes non plus.
   * Un repère « visible de loin » était l'intention de départ (voir
   * UNIVERS.md), mais la caméra plonge de 40 unités : le haut de l'écran
   * touche le sol à 55 unités, donc **rien ne dépasse l'horizon**, quelle que
   * soit sa taille. Grandir le temple n'aurait rien fait voir de plus — mais
   * l'aurait fait masquer le joueur passant devant. Ce qui rend l'Acropole
   * reconnaissable, c'est sa dalle claire et sa colonnade, pas son altitude.
   */
  private buildTemple(district: District, blockX: number, blockZ: number, yard: Yard): void {
    const halfX = 9;
    const halfZ = 7;
    const baseHeight = 1.6;
    const columnHeight = CONFIG.city.columnHeight * 1.25;

    const marble = new THREE.Color(district.walls[0]);

    // La plateforme : le seul vrai obstacle du temple. On en fait le tour.
    yard.plates.push({
      matrix: boxMatrix(blockX, baseHeight / 2, blockZ, halfX * 2, baseHeight, halfZ * 2),
      color: marble,
    });
    this.addObstacle({ x: blockX, z: blockZ, halfX, halfZ });

    // Le péristyle, posé sur la plateforme.
    const spacing = CONFIG.city.columnSpacing;
    const insetX = halfX - 1;
    const insetZ = halfZ - 1;
    const stepsX = Math.max(2, Math.round((insetX * 2) / spacing));
    const stepsZ = Math.max(2, Math.round((insetZ * 2) / spacing));
    for (let i = 0; i <= stepsX; i += 1) {
      const t = -insetX + (i * insetX * 2) / stepsX;
      this.addColumn(yard, blockX + t, blockZ - insetZ, baseHeight, columnHeight);
      this.addColumn(yard, blockX + t, blockZ + insetZ, baseHeight, columnHeight);
    }
    for (let i = 1; i < stepsZ; i += 1) {
      const t = -insetZ + (i * insetZ * 2) / stepsZ;
      this.addColumn(yard, blockX - insetX, blockZ + t, baseHeight, columnHeight);
      this.addColumn(yard, blockX + insetX, blockZ + t, baseHeight, columnHeight);
    }

    // La cella : la chambre du dieu, au centre du péristyle. Elle seule est
    // couverte, et sa toiture reste assez étroite pour laisser voir les
    // colonnes tout autour.
    const cellaX = halfX - 4;
    const cellaZ = halfZ - 3.4;
    const cellaHeight = columnHeight * 0.8;
    yard.walls.push({
      matrix: boxMatrix(
        blockX,
        baseHeight + cellaHeight / 2,
        blockZ,
        cellaX * 2,
        cellaHeight,
        cellaZ * 2,
      ),
      color: marble,
    });
    yard.roofs.push({
      matrix: boxMatrix(
        blockX,
        baseHeight + cellaHeight + 0.35,
        blockZ,
        cellaX * 2 + 1.2,
        0.7,
        cellaZ * 2 + 1.2,
      ),
      color: new THREE.Color(district.roof ?? 0xc0603f),
    });
  }

  /**
   * Le théâtre : trois anneaux de gradins en demi-cercle.
   *
   * Les gradins BLOQUENT, et c'est ce qui en fait une petite arène : les
   * mortels qui y déambulent y restent, le joueur entre par l'ouverture et
   * ramasse tout le monde d'un coup. C'est le seul quartier où la géométrie
   * fabrique du jeu plutôt que du décor.
   */
  private buildTiers(district: District, blockX: number, blockZ: number, yard: Yard): void {
    const rings = 3;
    const segments = 13;
    // L'ouverture regarde le sud (vers la caméra) : on arrive par là.
    const from = -2.5;
    const to = 2.5;

    for (let ring = 0; ring < rings; ring += 1) {
      const radius = 6.2 + ring * 2.3;
      const height = 1 + ring * 0.9;
      const color = new THREE.Color(district.walls[ring % district.walls.length]);
      const width = ((to - from) * radius) / segments + 0.6;

      for (let s = 0; s < segments; s += 1) {
        const angle = from + ((to - from) * (s + 0.5)) / segments;
        const x = blockX + Math.sin(angle) * radius;
        const z = blockZ + Math.cos(angle) * radius;

        const matrix = new THREE.Matrix4()
          .makeRotationY(angle)
          .scale(new THREE.Vector3(width, height, 1.9))
          .setPosition(x, height / 2, z);
        yard.walls.push({ matrix, color });

        // La boîte de collision reste alignée sur les axes — c'est tout ce
        // que `Collider` sait faire, et c'est assez : un gradin de biais
        // bloque de toute façon un rectangle un peu plus large.
        const half = Math.max(width, 1.9) / 2;
        this.addObstacle({ x, z, halfX: half, halfZ: half });
      }
    }
  }

  /** Le bois sacré : des oliviers, rien d'autre. Une respiration, un raccourci. */
  private buildGrove(blockX: number, blockZ: number, random: () => number, yard: Yard): void {
    const { blockSize, treesPerGrove } = CONFIG.city;
    const spread = blockSize / 2 - 1.5;

    for (let i = 0; i < treesPerGrove; i += 1) {
      const x = blockX + (random() * 2 - 1) * spread;
      const z = blockZ + (random() * 2 - 1) * spread;
      // ⚠️ De petits arbres, et pas trop. Le bois sacré est un RACCOURCI :
      // on le traverse, et les oliviers ne bloquent pas. Une frondaison
      // large passait donc au-dessus du joueur et le cachait (constaté en
      // capture) — sur un jeu où l'on suit sa propre foule, perdre son
      // personnage de vue une seconde est déjà trop.
      const scale = 0.52 + random() * 0.28;
      this.addTree(yard, x, z, scale);
    }
  }

  // ---------------------------------------------------------------- pièces

  private addWall(
    yard: Yard,
    district: District,
    random: () => number,
    cx: number,
    cz: number,
    sizeX: number,
    sizeZ: number,
    tall: number,
  ): void {
    const { sidewalkHeight, roofHeight, roofOverhang } = CONFIG.city;

    yard.walls.push({
      matrix: boxMatrix(cx, tall / 2 + sidewalkHeight, cz, sizeX, tall, sizeZ),
      color: new THREE.Color(district.walls[Math.floor(random() * district.walls.length)]),
    });

    if (district.roof !== null) {
      yard.roofs.push({
        matrix: boxMatrix(
          cx,
          tall + sidewalkHeight + roofHeight / 2,
          cz,
          sizeX + roofOverhang,
          roofHeight,
          sizeZ + roofOverhang,
        ),
        color: new THREE.Color(district.roof),
      });
    }

    this.addObstacle({ x: cx, z: cz, halfX: sizeX / 2, halfZ: sizeZ / 2 });
  }

  private addColumn(
    yard: Yard,
    x: number,
    z: number,
    base = 0,
    height: number = CONFIG.city.columnHeight,
  ): void {
    yard.columns.push({
      matrix: new THREE.Matrix4()
        .makeScale(1, height, 1)
        .setPosition(x, base + height / 2, z),
    });
  }

  private addTree(yard: Yard, x: number, z: number, scale: number): void {
    const trunk = 2.6 * scale;
    yard.trunks.push({
      matrix: new THREE.Matrix4().makeScale(scale, trunk, scale).setPosition(x, trunk / 2, z),
    });
    yard.foliage.push({
      matrix: new THREE.Matrix4()
        .makeScale(scale, scale * 0.8, scale)
        .setPosition(x, trunk + 0.9 * scale, z),
    });
  }

  /**
   * Les dalles au milieu des rues.
   *
   * Elles ne servent pas qu'à décorer : sans repère au sol, une rue est une
   * surface unie et on ne SENT plus qu'on avance. Elles ont remplacé la
   * grille de la Milestone 1, puis les bandes blanches de la Milestone 3 —
   * une cité grecque n'a pas de marquage routier, mais elle a du pavage.
   */
  private addPaving(yard: Yard): void {
    const { halfSize } = CONFIG.world;
    const { pavingSize, pavingGap } = CONFIG.city;
    const color = new THREE.Color(0xbfb49b);
    const step = pavingSize + pavingGap;
    // On s'arrête un peu avant le bord : sinon les dalles du port
    // débordaient DANS la mer et flottaient (constaté en capture).
    const edge = halfSize - pavingSize;
    const count = Math.floor(edge / step);

    for (let road = -this.lastBlock - 1; road <= this.lastBlock + 1; road += 1) {
      const axis = road * this.pitch;
      if (Math.abs(axis) > edge) continue;

      for (let i = -count; i <= count; i += 1) {
        const along = i * step;
        if (Math.abs(along) > edge) continue;

        // Une dalle sur la rue verticale, une sur l'horizontale.
        yard.paving.push({
          matrix: boxMatrix(axis, 0.03, along, pavingSize, 1, pavingSize),
          color,
        });
        yard.paving.push({
          matrix: boxMatrix(along, 0.03, axis, pavingSize, 1, pavingSize),
          color,
        });
      }
    }
  }

  /**
   * La mer, au-delà du port.
   *
   * Elle remplace le mur invisible sur ce bord de la carte : on comprend
   * pourquoi on ne va pas plus loin. Le mur, lui, est toujours là — mais on
   * ne bute plus contre rien, on s'arrête au bord du quai.
   */
  private addSea(): void {
    const { halfSize } = CONFIG.world;
    const depth = 260;
    const sea = new THREE.Mesh(
      new THREE.PlaneGeometry(halfSize * 2 + depth * 2, depth),
      new THREE.MeshLambertMaterial({ color: CONFIG.world.seaColor }),
    );
    sea.rotation.x = -Math.PI / 2;
    // Juste au-dessus du sol, et juste au-delà du bord du monde.
    sea.position.set(0, 0.06, halfSize + depth / 2);
    sea.matrixAutoUpdate = false;
    sea.updateMatrix();
    this.scene.add(sea);
    this.meshes.push(sea);
  }

  // ---------------------------------------------------------------- meshes

  /** Transforme ce qu'on a accumulé en meshes instanciés — un par matériau. */
  private publish(yard: Yard): void {
    const box = new THREE.BoxGeometry(1, 1, 1);

    this.addInstanced(yard.plates, box, new THREE.MeshLambertMaterial());
    this.addInstanced(yard.walls, box.clone(), new THREE.MeshLambertMaterial());
    this.addInstanced(yard.roofs, box.clone(), new THREE.MeshLambertMaterial());
    this.addInstanced(yard.paving, box.clone(), new THREE.MeshLambertMaterial());

    this.addInstanced(
      yard.columns,
      // Six côtés : une colonne fait moins d'une unité de large à l'écran,
      // et la M9 a montré que le radial est le seul découpage qui se voie.
      new THREE.CylinderGeometry(CONFIG.city.columnRadius, CONFIG.city.columnRadius * 1.1, 1, 6),
      new THREE.MeshLambertMaterial({ color: 0xeae4d6 }),
    );
    this.addInstanced(
      yard.trunks,
      new THREE.CylinderGeometry(0.22, 0.3, 1, 5),
      new THREE.MeshLambertMaterial({ color: 0x6b5638 }),
    );
    this.addInstanced(
      yard.foliage,
      new THREE.IcosahedronGeometry(1.5, 0),
      new THREE.MeshLambertMaterial({ color: 0x6f8748 }),
    );
  }

  private addInstanced(
    pieces: Piece[],
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
  ): void {
    if (pieces.length === 0) {
      geometry.dispose();
      material.dispose();
      return;
    }

    const mesh = new THREE.InstancedMesh(geometry, material, pieces.length);
    for (let i = 0; i < pieces.length; i += 1) {
      mesh.setMatrixAt(i, pieces[i].matrix);
      const color = pieces[i].color;
      if (color !== undefined) mesh.setColorAt(i, color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    // La cité ne bouge jamais : Three.js peut sauter le calcul de ses
    // matrices à chaque image.
    mesh.matrixAutoUpdate = false;
    this.meshes.push(mesh);
    this.scene.add(mesh);
  }

  // ---------------------------------------------------------------- collisions

  /**
   * Encode une case (colonne, ligne) en un entier unique.
   *
   * Le décalage de 512 rend les coordonnées négatives positives, et le
   * facteur 1024 laisse assez de place pour que deux cases ne se confondent
   * jamais — la cité en compte moins de dix par axe.
   */
  private cellKey(cx: number, cz: number): number {
    return (cx + 512) * 1024 + (cz + 512);
  }

  private addObstacle(box: Box2): void {
    this.obstacles.push(box);
    // Un obstacle peut chevaucher deux cases : on l'inscrit dans toutes
    // celles que son rectangle touche.
    const x0 = Math.floor((box.x - box.halfX) / this.pitch);
    const x1 = Math.floor((box.x + box.halfX) / this.pitch);
    const z0 = Math.floor((box.z - box.halfZ) / this.pitch);
    const z1 = Math.floor((box.z + box.halfZ) / this.pitch);
    for (let cx = x0; cx <= x1; cx += 1) {
      for (let cz = z0; cz <= z1; cz += 1) {
        const key = this.cellKey(cx, cz);
        const bucket = this.grid.get(key);
        if (bucket) bucket.push(box);
        else this.grid.set(key, [box]);
      }
    }
  }

  /**
   * Repousse le personnage hors des obstacles.
   *
   * Méthode classique du cercle contre rectangle : on regarde de combien on
   * chevauche sur X et sur Z, et on ressort par le côté où l'on est le moins
   * enfoncé. Résultat : on GLISSE le long des façades au lieu de s'y coller,
   * ce qui est indispensable au confort dans une cité en couloirs.
   *
   * ⚠️ Milestone 10 — on n'interroge QUE les cases que le personnage touche
   * vraiment, pas les neuf qui l'entourent.
   *
   * C'est correct, et pas seulement plus rapide : un obstacle est inscrit
   * dans **toutes** les cases que son rectangle touche. Si le cercle du
   * personnage chevauche un obstacle, le point de chevauchement appartient
   * aux deux — donc l'obstacle figure forcément dans une case que le cercle
   * touche. Aucun contact ne peut nous échapper.
   *
   * Et la case fait 33 unités pour un personnage large de 0,9 : il en touche
   * une, parfois deux, jamais neuf. Mesuré : 5 400 recherches par image
   * ramenées à 620 pour un cortège de 600.
   */
  resolve(position: THREE.Vector2, radius: number): boolean {
    let moved = false;

    const minX = Math.floor((position.x - radius) / this.pitch);
    const maxX = Math.floor((position.x + radius) / this.pitch);
    const minZ = Math.floor((position.y - radius) / this.pitch);
    const maxZ = Math.floor((position.y + radius) / this.pitch);

    for (let ix = minX; ix <= maxX; ix += 1) {
      for (let iz = minZ; iz <= maxZ; iz += 1) {
        const bucket = this.grid.get(this.cellKey(ix, iz));
        if (!bucket) continue;
        for (const box of bucket) {
          if (this.pushOut(position, radius, box)) moved = true;
        }
      }
    }

    return moved;
  }

  private pushOut(position: THREE.Vector2, radius: number, box: Box2): boolean {
    const dx = position.x - box.x;
    const dz = position.y - box.z;

    const overlapX = box.halfX + radius - Math.abs(dx);
    if (overlapX <= 0) return false;
    const overlapZ = box.halfZ + radius - Math.abs(dz);
    if (overlapZ <= 0) return false;

    // On sort par le plus court chemin : c'est ce qui produit le glissement.
    if (overlapX < overlapZ) {
      position.x += dx >= 0 ? overlapX : -overlapX;
    } else {
      position.y += dz >= 0 ? overlapZ : -overlapZ;
    }
    return true;
  }

  /**
   * Sort un personnage d'un amas de murs — et pas seulement du premier.
   *
   * ⚠️ `resolve()` ne suffit pas quand les maisons sont MITOYENNES, et c'est
   * le cas depuis la Milestone 11. Sortir d'une maison par le côté le plus
   * court, c'est parfois entrer dans sa voisine ; celle-ci renvoie vers la
   * première, et le personnage fait la navette. Ce n'est pas une convergence
   * lente, c'est un cycle stable : le répéter n'y change rien.
   *
   * Ici on procède autrement. À chaque tour :
   *
   *   1. on cherche l'obstacle où l'on est le PLUS enfoncé ;
   *   2. on essaie ses quatre sorties, et on garde celle qui laisse le moins
   *      d'enfoncement TOTAL, tous obstacles confondus.
   *
   * L'enfoncement total diminue donc strictement à chaque tour, ce qui rend
   * le cycle impossible et garantit la sortie. C'est plus cher qu'un simple
   * `resolve()`, mais on ne l'appelle que pour ceux qui touchent vraiment
   * quelque chose — quelques fidèles sur six cents.
   *
   * @returns true si la position a été corrigée
   */
  extract(position: THREE.Vector2, radius: number): boolean {
    let moved = false;

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const deepest = this.deepestBox(position, radius);
      if (deepest === null) break;

      const dx = position.x - deepest.x;
      const dz = position.y - deepest.z;
      const outX = deepest.halfX + radius - Math.abs(dx);
      const outZ = deepest.halfZ + radius - Math.abs(dz);

      const startX = position.x;
      const startZ = position.y;
      let bestX = startX;
      let bestZ = startZ;
      let bestPenetration = Number.POSITIVE_INFINITY;
      let bestTravel = Number.POSITIVE_INFINITY;

      // Les quatre sorties de cette boîte. On les essaie toutes plutôt que
      // de prendre la plus courte : la plus courte est souvent celle qui
      // mène chez le voisin.
      for (let side = 0; side < 4; side += 1) {
        position.x = startX + (side === 0 ? outX : side === 1 ? -outX : 0);
        position.y = startZ + (side === 2 ? outZ : side === 3 ? -outZ : 0);
        const penetration = this.totalPenetration(position, radius);
        const travel = Math.abs(position.x - startX) + Math.abs(position.y - startZ);

        // À dégagement équivalent, on prend la sortie la plus COURTE. Sans
        // cette préférence, un fidèle enfoncé dans un pâté était parfois
        // renvoyé de l'autre côté du bâtiment : correct, mais il arrivait
        // au milieu de ses voisins et le cortège s'empilait (part de
        // fidèles superposés mesurée à 16 % contre 7 au banc).
        const better =
          penetration < bestPenetration - 0.01 ||
          (penetration < bestPenetration + 0.01 && travel < bestTravel);
        if (better) {
          bestPenetration = Math.min(penetration, bestPenetration);
          bestTravel = travel;
          bestX = position.x;
          bestZ = position.y;
        }
      }

      position.x = bestX;
      position.y = bestZ;
      moved = true;
      if (bestPenetration <= 0) break;
    }

    return moved;
  }

  /** L'obstacle dans lequel ce cercle est le plus enfoncé, s'il y en a un. */
  private deepestBox(position: THREE.Vector2, radius: number): Box2 | null {
    let deepest: Box2 | null = null;
    let best = 0;

    const minX = Math.floor((position.x - radius) / this.pitch);
    const maxX = Math.floor((position.x + radius) / this.pitch);
    const minZ = Math.floor((position.y - radius) / this.pitch);
    const maxZ = Math.floor((position.y + radius) / this.pitch);

    for (let ix = minX; ix <= maxX; ix += 1) {
      for (let iz = minZ; iz <= maxZ; iz += 1) {
        const bucket = this.grid.get(this.cellKey(ix, iz));
        if (!bucket) continue;
        for (const box of bucket) {
          const overlapX = box.halfX + radius - Math.abs(position.x - box.x);
          if (overlapX <= 0) continue;
          const overlapZ = box.halfZ + radius - Math.abs(position.y - box.z);
          if (overlapZ <= 0) continue;
          const depth = Math.min(overlapX, overlapZ);
          if (depth > best) {
            best = depth;
            deepest = box;
          }
        }
      }
    }

    return deepest;
  }

  /** Somme des enfoncements à cet endroit — la quantité qu'on fait décroître. */
  private totalPenetration(position: THREE.Vector2, radius: number): number {
    let total = 0;

    const minX = Math.floor((position.x - radius) / this.pitch);
    const maxX = Math.floor((position.x + radius) / this.pitch);
    const minZ = Math.floor((position.y - radius) / this.pitch);
    const maxZ = Math.floor((position.y + radius) / this.pitch);

    for (let ix = minX; ix <= maxX; ix += 1) {
      for (let iz = minZ; iz <= maxZ; iz += 1) {
        const bucket = this.grid.get(this.cellKey(ix, iz));
        if (!bucket) continue;
        for (const box of bucket) {
          const overlapX = box.halfX + radius - Math.abs(position.x - box.x);
          if (overlapX <= 0) continue;
          const overlapZ = box.halfZ + radius - Math.abs(position.y - box.z);
          if (overlapZ <= 0) continue;
          total += Math.min(overlapX, overlapZ);
        }
      }
    }

    return total;
  }

  /**
   * Vrai si un point est libre.
   *
   * Le vecteur de travail est REUTILISÉ : cette méthode est appelée en boucle
   * par le banc de test, et en fabriquer un par appel donnerait du travail au
   * ramasse-miettes pour rien.
   */
  isFree(x: number, z: number, radius = 0): boolean {
    this.probe.set(x, z);
    return !this.resolve(this.probe, radius);
  }

  // ---------------------------------------------------------------- quartiers

  /** Dans quel quartier se trouve ce point ? (HUD, peuplement, banc de test) */
  districtAt(x: number, z: number): DistrictId {
    return districtAtPoint(x, z, this.pitch, this.lastBlock);
  }

  /**
   * Tire un point de la cité, **pondéré par la densité des quartiers**.
   *
   * Le point tombe dans le carré d'un pâté ET des demi-rues qui l'entourent :
   * il peut donc être dans un mur, et l'appelant doit vérifier. C'est
   * volontaire — refuser ici les points bâtis reviendrait à faire deux fois
   * le test de collision.
   *
   * ⚠️ Écrit dans `out`, ne renvoie rien : appelé des centaines de fois au
   * lancement, et à chaque conversion ensuite.
   */
  pickPopulatedSpot(random: () => number, out: { x: number; z: number }): void {
    const target = random() * this.spawnTotal;
    let index = 0;
    while (index < this.spawnWeights.length - 1 && this.spawnWeights[index] < target) {
      index += 1;
    }

    const block = this.spawnBlocks[index];
    const limit = CONFIG.world.halfSize - 2;
    out.x = clamp(block.x + (random() - 0.5) * this.pitch, -limit, limit);
    out.z = clamp(block.z + (random() - 0.5) * this.pitch, -limit, limit);
  }

  dispose(): void {
    for (const object of this.meshes) {
      this.scene.remove(object);
      const mesh = object as THREE.Mesh;
      mesh.geometry?.dispose();
      (mesh.material as THREE.Material | undefined)?.dispose();
      (mesh as THREE.InstancedMesh).dispose?.();
    }
    this.meshes.length = 0;
  }
}

/** Une dalle plate, à peine surélevée, sous tout le pâté. */
function plateMatrix(x: number, z: number, size: number): THREE.Matrix4 {
  const h = CONFIG.city.sidewalkHeight;
  return boxMatrix(x, h / 2, z, size, h, size);
}

function boxMatrix(
  x: number,
  y: number,
  z: number,
  sizeX: number,
  sizeY: number,
  sizeZ: number,
): THREE.Matrix4 {
  return new THREE.Matrix4().makeScale(sizeX, sizeY, sizeZ).setPosition(x, y, z);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}
