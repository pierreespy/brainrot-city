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
import type { ViewCulling } from '../systems/ViewCulling';
import { primeInstances, uploadInstances, writeInstance } from '../core/instancing';

/**
 * Les cases à examiner autour d'un fidèle : la sienne, puis quatre voisines
 * seulement — et non les huit.
 *
 * Une paire de fidèles se gêne, ou pas ; l'examiner deux fois ne sert à rien.
 * En ne regardant que « vers l'avant » (droite, et la rangée du dessus), deux
 * cases voisines ne se rencontrent qu'une fois : la moitié des recherches
 * disparaît sans qu'aucun contact ne soit oublié.
 *
 * Rangées à plat, par paires (dx, dz), pour ne rien allouer en les parcourant.
 */
const NEIGHBOURS = [0, 0, 1, 0, -1, 1, 0, 1, 1, 1];

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

  /** Le tableau de matrices du mesh, écrit directement (voir `instancing.ts`). */
  private readonly matrices: Float32Array;
  /** Hauteur du centre d'une silhouette : la même pour tout le monde. */
  private readonly meshY: number;
  /** Combien de silhouettes ont réellement été envoyées au GPU. */
  private drawn = 0;

  private readonly probe = new THREE.Vector2();
  /** Objets de travail réutilisés : rien ne doit être alloué par frame. */
  private readonly target = { x: 0, z: 0 };
  private readonly grid = new Map<number, number[]>();
  /**
   * Les cases réellement occupées à la passe précédente.
   *
   * ⚠️ Sans cette liste, vider la grille signifiait parcourir **toutes** les
   * cases jamais utilisées depuis le début de la partie — et la grille garde
   * une case pour chaque mètre carré que le cortège a traversé. Le jeu
   * ralentissait donc à mesure qu'on visitait la cité : 2 500 cases à vider
   * deux fois par image après 4 secondes de course, et cela ne faisait que
   * monter. On ne vide plus que ce qu'on a rempli.
   */
  private readonly usedCells: number[] = [];

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
    this.meshY = citizen.height / 2 + citizen.radius;
    this.mesh = new THREE.InstancedMesh(
      new THREE.CapsuleGeometry(
        citizen.radius,
        citizen.height,
        CONFIG.crowd.capSegments,
        CONFIG.crowd.radialSegments,
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

    primeInstances(this.mesh);
    this.matrices = this.mesh.instanceMatrix.array as Float32Array;
    this.mesh.count = 0;
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
  }

  /**
   * @param trail   le chemin parcouru par la divinité (voir `PlayerTrail`)
   * @param culling le champ de la caméra, pour ne dessiner que ce qui se voit
   */
  update(
    deltaTime: number,
    playerX: number,
    playerZ: number,
    trail: PlayerTrail,
    culling: ViewCulling | null = null,
  ): void {
    this.followPath(deltaTime, trail);
    this.separate();
    this.settle(playerX, playerZ);
    this.syncMeshes(culling);
  }

  /** 1. Chacun rejoint le point du chemin qui correspond à son rang. */
  private followPath(deltaTime: number, trail: PlayerTrail): void {
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
      // `Math.hypot` protège d'un dépassement de capacité dont nos distances
      // — quelques dizaines d'unités — sont très loin. Mesuré : 13,6 fois
      // plus lent que la racine carrée, pour 600 appels par image.
      const distance = Math.sqrt(dx * dx + dz * dz);

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

    // 1. Vider la grille — seulement les cases occupées la fois précédente.
    for (const key of this.usedCells) {
      const bucket = this.grid.get(key);
      if (bucket !== undefined) bucket.length = 0;
    }
    this.usedCells.length = 0;

    // 2. Ranger chaque fidèle dans sa case.
    for (let i = 0; i < this.followers.length; i += 1) {
      const follower = this.followers[i];
      const key = this.cellKey(
        Math.floor(follower.x / separation),
        Math.floor(follower.z / separation),
      );
      const bucket = this.grid.get(key);
      if (bucket === undefined) {
        this.grid.set(key, [i]);
        this.usedCells.push(key);
      } else {
        // Première arrivée dans cette case : elle sera à vider tout à l'heure.
        if (bucket.length === 0) this.usedCells.push(key);
        bucket.push(i);
      }
    }

    // 3. Écarter les voisins trop proches.
    const minDistanceSq = separation * separation;

    for (let i = 0; i < this.followers.length; i += 1) {
      const a = this.followers[i];
      const cx = Math.floor(a.x / separation);
      const cz = Math.floor(a.z / separation);

      for (let n = 0; n < NEIGHBOURS.length; n += 2) {
        const bucket = this.grid.get(this.cellKey(cx + NEIGHBOURS[n], cz + NEIGHBOURS[n + 1]));
        if (bucket === undefined) continue;

        // Dans sa PROPRE case, un fidèle ne regarde que les rangs suivants :
        // sans cela, chaque paire serait traitée deux fois. Dans les cases
        // « en avant », au contraire, tout le monde est à comparer — leurs
        // occupants ne regarderont jamais en arrière (voir `NEIGHBOURS`).
        const onlyAfter = NEIGHBOURS[n] === 0 && NEIGHBOURS[n + 1] === 0;

        for (const j of bucket) {
          if (onlyAfter && j <= i) continue;
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

          // Les deux fidèles s'écartent d'autant : personne n'a la priorité.
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

      const dx = follower.x - playerX;
      const dz = follower.z - playerZ;
      const reach = dx * dx + dz * dz;
      if (reach > spread) spread = reach;
    }

    // Une seule racine carrée pour tout le cortège, à la toute fin : la
    // comparaison de distances se fait très bien au carré.
    this.spread = Math.sqrt(spread);
  }

  /**
   * 4. Envoyer au GPU les silhouettes que la caméra cadre, et elles seules.
   *
   * Le cortège colle au joueur, donc la plupart sont à l'écran — mais pas
   * toutes : un cortège de 600 traîne sur une quinzaine d'unités, et la
   * caméra n'en montre qu'une vingtaine derrière le joueur. Ce qui dépasse
   * dans son dos ne coûte plus rien.
   */
  private syncMeshes(culling: ViewCulling | null): void {
    const radius = CONFIG.mortals.types.citizen.radius;
    let drawn = 0;

    for (let i = 0; i < this.followers.length; i += 1) {
      const follower = this.followers[i];
      if (
        culling !== null &&
        !culling.isVisible(follower.x, this.meshY, follower.z, radius)
      ) {
        continue;
      }
      writeInstance(this.matrices, drawn, follower.x, this.meshY, follower.z, follower.angle);
      drawn += 1;
    }

    this.drawn = drawn;
    uploadInstances(this.mesh, drawn);
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

  /** Silhouettes réellement soumises au GPU cette image (banc de mesure). */
  get drawnCount(): number {
    return this.drawn;
  }

  getPositions(): { x: number; z: number }[] {
    return this.followers.map((f) => ({ x: f.x, z: f.z }));
  }

  clear(): void {
    for (const key of this.usedCells) {
      const bucket = this.grid.get(key);
      if (bucket !== undefined) bucket.length = 0;
    }
    this.usedCells.length = 0;
    this.followers.length = 0;
    this.faithful = 0;
    this.spread = 0;
    this.drawn = 0;
    this.mesh.count = 0;
  }

  dispose(): void {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
    this.mesh.dispose();
  }
}
