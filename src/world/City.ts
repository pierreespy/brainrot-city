/**
 * City.ts — la ville : les rues, les trottoirs et les immeubles.
 *
 * Trois idées à retenir :
 *
 * 1. **Un motif régulier.** Rues et pâtés de maisons alternent tous les
 *    `blockSize + roadWidth`. Les rues sont centrées sur les multiples de ce
 *    pas, donc (0, 0) est toujours un carrefour : le joueur ne démarre
 *    jamais dans un mur.
 *
 * 2. **Deux InstancedMesh, deux appels GPU.** Tous les immeubles partagent
 *    UNE géométrie et UN matériau ; seule leur matrice (position, taille) et
 *    leur couleur changent. Afficher 200 immeubles coûte donc autant qu'en
 *    afficher un. C'est exactement la technique qui servira à la foule.
 *
 * 3. **La ville est aussi la carte de collision.** En construisant les
 *    immeubles on note leur rectangle au sol, rangé dans une grille : savoir
 *    contre quoi on bute ne demande alors de tester que 4 cases, jamais les
 *    200 immeubles.
 */

import * as THREE from 'three';
import { CONFIG } from '../config';
import type { Box2, Collider } from './Collider';

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

export class City implements Collider {
  /** Rectangles au sol des immeubles — la vérité pour les collisions. */
  readonly obstacles: Box2[] = [];

  /** Distance d'un motif complet (une rue + un pâté de maisons). */
  readonly pitch = CONFIG.city.blockSize + CONFIG.city.roadWidth;

  private readonly scene: THREE.Scene;
  private readonly meshes: THREE.InstancedMesh[] = [];

  /**
   * Index spatial : les obstacles rangés par case de `pitch` unités
   * (soit une case par pâté de maisons). La clé est "colonne,ligne".
   */
  private readonly grid = new Map<string, Box2[]>();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.build();
  }

  // ---------------------------------------------------------------- construction

  private build(): void {
    const { halfSize } = CONFIG.world;
    const { blockSize, lotsPerBlock, lotDepth, height, emptyLotChance, seed } = CONFIG.city;

    const random = createRandom(seed);

    // Centres des pâtés de maisons : décalés d'un demi-pas par rapport aux
    // rues, qui elles passent sur les multiples de `pitch`.
    const lastBlock = Math.floor((halfSize - blockSize / 2) / this.pitch);

    const sidewalks: THREE.Matrix4[] = [];
    const buildings: { matrix: THREE.Matrix4; color: THREE.Color }[] = [];

    const lotSize = blockSize / lotsPerBlock;

    for (let bx = -lastBlock - 1; bx <= lastBlock; bx += 1) {
      for (let bz = -lastBlock - 1; bz <= lastBlock; bz += 1) {
        const blockX = bx * this.pitch + this.pitch / 2;
        const blockZ = bz * this.pitch + this.pitch / 2;

        // Un pâté entier hors du monde ne sert à rien : on le saute.
        if (Math.abs(blockX) + blockSize / 2 > halfSize) continue;
        if (Math.abs(blockZ) + blockSize / 2 > halfSize) continue;

        sidewalks.push(this.plateMatrix(blockX, blockZ, blockSize));

        for (let lx = 0; lx < lotsPerBlock; lx += 1) {
          for (let lz = 0; lz < lotsPerBlock; lz += 1) {
            if (random() < emptyLotChance) continue;

            // Coin EXTÉRIEUR de la parcelle : celui qui touche la rue.
            const lotX = blockX - blockSize / 2 + lotSize * (lx + 0.5);
            const lotZ = blockZ - blockSize / 2 + lotSize * (lz + 0.5);
            const outX = Math.sign(lotX - blockX);
            const outZ = Math.sign(lotZ - blockZ);

            // L'immeuble est PLAQUÉ contre la rue et déborde vers la cour.
            //
            // Ce détail change tout. Si chaque immeuble était centré dans sa
            // parcelle avec un recul, les reculs s'aligneraient d'un pâté à
            // l'autre et ouvriraient des couloirs rectilignes à travers
            // toute la ville : on la traverserait au lieu de la contourner
            // (constaté au banc de test). Plaqués sur la rue et débordant
            // vers l'intérieur, les immeubles forment une façade continue,
            // et c'est la COUR — invisible — qui absorbe les variations.
            const sizeX = lotSize * lerp(lotDepth.min, lotDepth.max, random());
            const sizeZ = lotSize * lerp(lotDepth.min, lotDepth.max, random());
            const tall = lerp(height.min, height.max, random() ** 1.7);

            const cx = blockX + outX * (blockSize / 2 - sizeX / 2);
            const cz = blockZ + outZ * (blockSize / 2 - sizeZ / 2);

            const matrix = new THREE.Matrix4()
              .makeScale(sizeX, tall, sizeZ)
              .setPosition(cx, tall / 2 + CONFIG.city.sidewalkHeight, cz);

            const palette = CONFIG.city.palette;
            const color = new THREE.Color(
              palette[Math.floor(random() * palette.length)],
            );

            buildings.push({ matrix, color });
            this.addObstacle({ x: cx, z: cz, halfX: sizeX / 2, halfZ: sizeZ / 2 });
          }
        }
      }
    }

    this.addSidewalks(sidewalks);
    this.addBuildings(buildings);
    this.addRoadMarkings(lastBlock);
  }

  /** Le trottoir : une dalle plate, à peine surélevée, sous tout le pâté. */
  private plateMatrix(x: number, z: number, size: number): THREE.Matrix4 {
    const h = CONFIG.city.sidewalkHeight;
    return new THREE.Matrix4()
      .makeScale(size, h, size)
      .setPosition(x, h / 2, z);
  }

  private addSidewalks(matrices: THREE.Matrix4[]): void {
    const mesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshLambertMaterial({ color: CONFIG.city.sidewalkColor }),
      matrices.length,
    );
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
    this.register(mesh);
  }

  private addBuildings(items: { matrix: THREE.Matrix4; color: THREE.Color }[]): void {
    const mesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshLambertMaterial(),
      items.length,
    );
    items.forEach(({ matrix, color }, i) => {
      mesh.setMatrixAt(i, matrix);
      mesh.setColorAt(i, color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    this.register(mesh);
  }

  /**
   * Les bandes blanches au milieu des rues.
   *
   * Elles ne servent pas qu'à décorer : sans repère au sol, l'asphalte est
   * uni et on ne SENT plus qu'on avance. C'est ce que faisait la grille de
   * la Milestone 1, que ces bandes remplacent.
   */
  private addRoadMarkings(lastBlock: number): void {
    const { halfSize } = CONFIG.world;
    const dash = 3.2;
    const gap = 3.2;
    const width = 0.35;

    const matrices: THREE.Matrix4[] = [];
    const count = Math.floor(halfSize / (dash + gap));

    for (let road = -lastBlock - 1; road <= lastBlock + 1; road += 1) {
      const axis = road * this.pitch;
      if (Math.abs(axis) > halfSize) continue;

      for (let i = -count; i <= count; i += 1) {
        const along = i * (dash + gap);
        if (Math.abs(along) > halfSize) continue;

        // Une bande sur la rue verticale, une sur l'horizontale.
        matrices.push(
          new THREE.Matrix4().makeScale(width, 1, dash).setPosition(axis, 0.02, along),
        );
        matrices.push(
          new THREE.Matrix4().makeScale(dash, 1, width).setPosition(along, 0.02, axis),
        );
      }
    }

    const mesh = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x8b90a8 }),
      matrices.length,
    );
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
    this.register(mesh);
  }

  private register(mesh: THREE.InstancedMesh): void {
    // Les immeubles ne bougent jamais : Three.js peut sauter le calcul de
    // leurs matrices à chaque frame.
    mesh.matrixAutoUpdate = false;
    this.meshes.push(mesh);
    this.scene.add(mesh);
  }

  // ---------------------------------------------------------------- collisions

  private addObstacle(box: Box2): void {
    this.obstacles.push(box);
    // Un immeuble peut chevaucher deux cases : on l'inscrit dans toutes
    // celles que son rectangle touche.
    const x0 = Math.floor((box.x - box.halfX) / this.pitch);
    const x1 = Math.floor((box.x + box.halfX) / this.pitch);
    const z0 = Math.floor((box.z - box.halfZ) / this.pitch);
    const z1 = Math.floor((box.z + box.halfZ) / this.pitch);
    for (let cx = x0; cx <= x1; cx += 1) {
      for (let cz = z0; cz <= z1; cz += 1) {
        const key = `${cx},${cz}`;
        const bucket = this.grid.get(key);
        if (bucket) bucket.push(box);
        else this.grid.set(key, [box]);
      }
    }
  }

  /**
   * Repousse le joueur hors des immeubles.
   *
   * Méthode classique du cercle contre rectangle : on regarde de combien on
   * chevauche sur X et sur Z, et on ressort par le côté où l'on est le moins
   * enfoncé. Résultat : on GLISSE le long des façades au lieu de s'y coller,
   * ce qui est indispensable au confort dans une ville en couloirs.
   */
  resolve(position: THREE.Vector2, radius: number): boolean {
    let moved = false;

    // Le joueur ne peut toucher que les cases adjacentes à la sienne.
    const cx = Math.floor(position.x / this.pitch);
    const cz = Math.floor(position.y / this.pitch);

    for (let ix = cx - 1; ix <= cx + 1; ix += 1) {
      for (let iz = cz - 1; iz <= cz + 1; iz += 1) {
        const bucket = this.grid.get(`${ix},${iz}`);
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

  /** Vrai si un point est libre (utile aux NPC en Milestone 3). */
  isFree(x: number, z: number, radius = 0): boolean {
    const probe = new THREE.Vector2(x, z);
    return !this.resolve(probe, radius);
  }

  dispose(): void {
    for (const mesh of this.meshes) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      mesh.dispose();
    }
    this.meshes.length = 0;
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
