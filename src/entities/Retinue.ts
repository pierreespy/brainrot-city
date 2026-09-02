/**
 * Retinue.ts — le cortège : les fidèles qui suivent la divinité.
 *
 * Un mortel converti quitte le vivier (`Mortals`) et arrive ici. Le cortège
 * détient donc deux choses : **le score** (le nombre de fidèles) et **les
 * silhouettes** qui courent derrière le joueur.
 *
 * La formation repose sur deux mécanismes indépendants :
 *
 * 1. **Suivre le chemin, pas le joueur** (`PlayerTrail`). Chaque fidèle vise
 *    un point situé à N mètres derrière le dieu SUR SON CHEMIN. Le cortège
 *    emprunte donc les mêmes rues et contourne les mêmes angles : plus aucun
 *    fidèle ne pousse contre une façade en ligne droite.
 * 2. **Se repousser entre voisins.** Sans cela, tous viseraient le même point
 *    et se superposeraient : on aurait une file, pas une foule. La répulsion
 *    élargit naturellement la colonne en un cortège.
 */

import * as THREE from 'three';
import { CONFIG } from '../config';
import type { Collider } from '../world/Collider';
import type { MortalTypeId } from './Mortals';
import type { PlayerTrail } from '../systems/PlayerTrail';

interface Follower {
  readonly type: MortalTypeId;
  x: number;
  z: number;
  /** Orientation affichée, alignée sur le déplacement. */
  angle: number;
}

export class Retinue {
  private readonly scene: THREE.Scene;
  private readonly city: Collider;
  private readonly followers: Follower[] = [];
  private readonly mesh: THREE.InstancedMesh;

  private readonly dummy = new THREE.Object3D();
  private readonly probe = new THREE.Vector2();
  /** Objets de travail réutilisés : rien ne doit être alloué par frame. */
  private readonly target = { x: 0, z: 0 };
  private readonly grid = new Map<number, number[]>();

  /** Même encodage que la grille de la ville : un entier, pas une chaîne. */
  private cellKey(cx: number, cz: number): number {
    return (cx + 4096) * 8192 + (cz + 4096);
  }

  /** Le score : la somme des VALEURS des fidèles, pas leur nombre. */
  private faithful = 0;

  /**
   * Distance du fidèle le plus éloigné du joueur, mise à jour à chaque frame.
   *
   * Elle sert de **filtre grossier** à la conversion : un mortel hors de ce
   * rayon ne peut être touché par personne, on n'a donc pas à le comparer aux
   * centaines de fidèles un par un.
   */
  private spread = 0;

  constructor(scene: THREE.Scene, city: Collider) {
    this.scene = scene;
    this.city = city;

    const citizen = CONFIG.mortals.types.citizen;
    this.mesh = new THREE.InstancedMesh(
      new THREE.CapsuleGeometry(
        citizen.radius,
        citizen.height,
        CONFIG.render.bodyCapSegments,
        CONFIG.render.bodyRadialSegments,
      ),
      new THREE.MeshLambertMaterial({ color: CONFIG.retinue.color }),
      CONFIG.retinue.maxSize,
    );
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    // `count` dit à Three.js combien d'emplacements dessiner réellement :
    // le cortège commence vide, la réservation mémoire est faite d'avance.
    this.mesh.count = 0;

    // ⚠️ Sans cette ligne, le cortège est INVISIBLE dès qu'on s'éloigne du
    // centre de la carte. Three.js calcule une sphère englobante pour décider
    // si un objet est à l'écran ; il la calcule ici alors que le cortège est
    // encore VIDE, puis la garde en cache. Les fidèles ajoutés ensuite
    // tombent hors de cette sphère périmée et l'objet entier est écarté du
    // rendu. Le compteur montait, l'écran restait vide (constaté en capture).
    //
    // On désactive donc le test : le cortège colle au joueur, il est de
    // toute façon toujours à l'écran, et ce test ne pouvait rien économiser.
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
  }

  /**
   * Un mortel rejoint le cortège.
   *
   * Il apparaît près du joueur — il vient d'y être touché — et rattrapera sa
   * place en quelques frames.
   *
   * ⚠️ Le léger écart aléatoire n'est pas cosmétique : sans lui, plusieurs
   * conversions simultanées naissaient au **même point exact**, et la
   * répulsion, qui a besoin d'une direction pour agir, n'en avait aucune.
   */
  add(type: MortalTypeId, x: number, z: number): void {
    this.faithful += CONFIG.mortals.types[type].value;

    if (this.followers.length >= CONFIG.retinue.maxSize) return;

    const scatter = CONFIG.retinue.separation;
    this.followers.push({
      type,
      x: x + (Math.random() - 0.5) * scatter,
      z: z + (Math.random() - 0.5) * scatter,
      angle: 0,
    });
    this.mesh.count = this.followers.length;
  }

  /**
   * @param trail le chemin parcouru par la divinité (voir `PlayerTrail`)
   */
  update(deltaTime: number, playerX: number, playerZ: number, trail: PlayerTrail): void {
    this.followPath(deltaTime, playerX, playerZ, trail);
    this.separate();
    this.settle(playerX, playerZ);
    this.syncMeshes();
  }

  /** 1. Chacun rejoint le point du chemin qui correspond à son rang. */
  private followPath(
    deltaTime: number,
    playerX: number,
    playerZ: number,
    trail: PlayerTrail,
  ): void {
    const { speedFactor, lagMin, lagStep, arriveRadius } = CONFIG.retinue;
    const speed = CONFIG.player.speed * speedFactor;

    // Le curseur évite de reparcourir le chemin pour chaque fidèle : les
    // retards vont croissant, donc une seule traversée suffit au cortège
    // entier. Sans lui, un cortège de 600 relirait 600 fois le même tableau.
    let cursor = Number.MAX_SAFE_INTEGER;

    for (let i = 0; i < this.followers.length; i += 1) {
      const follower = this.followers[i];

      // La racine carrée du rang : un cortège de 500 doit s'épaissir, pas
      // s'étirer sur 250 mètres.
      const lag = lagMin + lagStep * Math.sqrt(i);
      cursor = trail.sample(lag, cursor, this.target);

      const dx = this.target.x - follower.x;
      const dz = this.target.z - follower.z;
      const distance = Math.hypot(dx, dz);

      // Arrivé « à peu près » : on le laisse tranquille. C'est ce qui donne
      // à la répulsion la place d'étaler le cortège en foule plutôt qu'en
      // pile de fidèles superposés sur le même point du chemin.
      if (distance > arriveRadius) {
        // On ne dépasse jamais sa cible, sinon le fidèle oscille autour.
        const step = Math.min(speed * deltaTime, distance - arriveRadius * 0.5);
        follower.x += (dx / distance) * step;
        follower.z += (dz / distance) * step;
        follower.angle = Math.atan2(dx, dz);
      }
    }

    // Utilisé par la conversion : jusqu'où le cortège ratisse-t-il ?
    let spread = 0;
    for (const follower of this.followers) {
      const reach = Math.hypot(follower.x - playerX, follower.z - playerZ);
      if (reach > spread) spread = reach;
    }
    this.spread = spread;
  }

  /**
   * 2. Les fidèles trop proches se repoussent.
   *
   * Comparer chacun à tous ferait 180 000 paires pour 600 fidèles. On range
   * donc le cortège dans une grille dont la case vaut exactement la distance
   * de répulsion : deux fidèles qui se gênent sont forcément dans la même
   * case ou dans une case voisine, et il suffit d'examiner 9 cases.
   *
   * La grille et ses seaux sont RÉUTILISÉS d'une frame à l'autre — on vide
   * les tableaux au lieu d'en créer, sinon on produirait des centaines
   * d'objets à ramasser à chaque image.
   */
  private separate(): void {
    const { separationPasses } = CONFIG.retinue;
    if (this.followers.length < 2) return;
    for (let pass = 0; pass < separationPasses; pass += 1) this.separationPass();
  }

  private separationPass(): void {
    const { separation, separationStrength } = CONFIG.retinue;

    for (const bucket of this.grid.values()) bucket.length = 0;

    for (let i = 0; i < this.followers.length; i += 1) {
      const follower = this.followers[i];
      const key = this.cellKey(
        Math.floor(follower.x / separation),
        Math.floor(follower.z / separation),
      );
      const bucket = this.grid.get(key);
      if (bucket) bucket.push(i);
      else this.grid.set(key, [i]);
    }

    const minDistanceSq = separation * separation;

    for (let i = 0; i < this.followers.length; i += 1) {
      const a = this.followers[i];
      const cx = Math.floor(a.x / separation);
      const cz = Math.floor(a.z / separation);

      for (let ox = -1; ox <= 1; ox += 1) {
        for (let oz = -1; oz <= 1; oz += 1) {
          const bucket = this.grid.get(this.cellKey(cx + ox, cz + oz));
          if (!bucket) continue;

          for (const j of bucket) {
            // Chaque paire n'est traitée qu'une fois, et les deux fidèles
            // s'écartent d'autant : personne n'a la priorité.
            if (j <= i) continue;
            const b = this.followers[j];

            let dx = b.x - a.x;
            let dz = b.z - a.z;
            const distanceSq = dx * dx + dz * dz;
            if (distanceSq >= minDistanceSq) continue;

            let distance = Math.sqrt(distanceSq);
            if (distance < 0.0001) {
              // Exactement superposés (deux conversions au même endroit) :
              // on les décolle dans une direction arbitraire mais stable.
              dx = (i % 2 === 0 ? 1 : -1) * 0.01;
              dz = 0.01;
              distance = 0.014;
            }

            const push = ((separation - distance) / distance) * separationStrength * 0.5;
            const px = dx * push;
            const pz = dz * push;
            a.x -= px;
            a.z -= pz;
            b.x += px;
            b.z += pz;
          }
        }
      }
    }
  }

  /** 3. Personne ne finit dans un mur ni hors de la cité. */
  private settle(playerX: number, playerZ: number): void {
    const citizen = CONFIG.mortals.types.citizen;
    const limit = CONFIG.world.halfSize - citizen.radius;
    let spread = 0;

    for (const follower of this.followers) {
      follower.x = THREE.MathUtils.clamp(follower.x, -limit, limit);
      follower.z = THREE.MathUtils.clamp(follower.z, -limit, limit);

      this.probe.set(follower.x, follower.z);
      if (this.city.resolve(this.probe, citizen.radius)) {
        follower.x = this.probe.x;
        follower.z = this.probe.y;
      }

      const reach = Math.hypot(follower.x - playerX, follower.z - playerZ);
      if (reach > spread) spread = reach;
    }

    this.spread = spread;
  }

  private syncMeshes(): void {
    const citizen = CONFIG.mortals.types.citizen;
    const y = citizen.height / 2 + citizen.radius;

    for (let i = 0; i < this.followers.length; i += 1) {
      const follower = this.followers[i];
      this.dummy.position.set(follower.x, y, follower.z);
      this.dummy.rotation.set(0, follower.angle, 0);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  // ---------------------------------------------------------------- lecture

  /** Distance du fidèle le plus éloigné du joueur (filtre de conversion). */
  get spreadRadius(): number {
    return this.spread;
  }

  /**
   * Un fidèle se trouve-t-il à portée de ce point ?
   *
   * Appelé uniquement pour les rares mortels que le filtre grossier n'a pas
   * écartés — d'où le parcours linéaire, parfaitement acceptable ici.
   */
  hasFollowerNear(x: number, z: number, radius: number): boolean {
    const radiusSq = radius * radius;
    for (const follower of this.followers) {
      const dx = follower.x - x;
      const dz = follower.z - z;
      if (dx * dx + dz * dz <= radiusSq) return true;
    }
    return false;
  }

  /** Le score affiché au joueur (Milestone 6). */
  get faithfulCount(): number {
    return this.faithful;
  }

  /** Le nombre de silhouettes réellement affichées. */
  get size(): number {
    return this.followers.length;
  }

  getPositions(): { x: number; z: number }[] {
    return this.followers.map((f) => ({ x: f.x, z: f.z }));
  }

  clear(): void {
    this.followers.length = 0;
    this.faithful = 0;
    this.spread = 0;
    this.mesh.count = 0;
  }

  dispose(): void {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
    this.mesh.dispose();
  }
}
