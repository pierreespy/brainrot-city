/**
 * Retinue.ts — le cortège : les fidèles qui suivent la divinité.
 *
 * Un mortel converti quitte le vivier (`Mortals`) et arrive ici. Le cortège
 * détient donc deux choses : **le score** (le nombre de fidèles) et **les
 * silhouettes** qui courent derrière le joueur.
 *
 * ⚠️ **Le suivi ci-dessous est provisoire.** Chaque fidèle vise simplement le
 * joueur et s'arrête à une distance qui dépend de son rang, ce qui produit un
 * disque grossier. C'est assez pour rendre la conversion visible, mais ce
 * n'est pas une formation : la vraie, avec cohésion et évitement, est le
 * sujet de la Milestone 5. **Seule cette méthode `update()` sera remplacée** —
 * le reste du fichier (score, arrivée, mesh) tiendra tel quel.
 */

import * as THREE from 'three';
import { CONFIG } from '../config';
import type { Collider } from '../world/Collider';
import type { MortalTypeId } from './Mortals';

interface Follower {
  readonly type: MortalTypeId;
  x: number;
  z: number;
  /**
   * Angle propre à ce fidèle, tiré à son arrivée. Sans lui, tous viseraient
   * le même point et se superposeraient exactement.
   */
  readonly bearing: number;
  angle: number;
}

export class Retinue {
  private readonly scene: THREE.Scene;
  private readonly city: Collider;
  private readonly followers: Follower[] = [];
  private readonly mesh: THREE.InstancedMesh;

  private readonly dummy = new THREE.Object3D();
  private readonly probe = new THREE.Vector2();

  /** Le score : la somme des VALEURS des fidèles, pas leur nombre. */
  private faithful = 0;

  constructor(scene: THREE.Scene, city: Collider) {
    this.scene = scene;
    this.city = city;

    const citizen = CONFIG.mortals.types.citizen;
    this.mesh = new THREE.InstancedMesh(
      new THREE.CapsuleGeometry(citizen.radius, citizen.height, 4, 8),
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
   * Il apparaît à la position du joueur : il vient d'y être touché, et il
   * rattrapera sa place en quelques frames.
   */
  add(type: MortalTypeId, x: number, z: number): void {
    this.faithful += CONFIG.mortals.types[type].value;

    if (this.followers.length >= CONFIG.retinue.maxSize) return;

    this.followers.push({
      type,
      x,
      z,
      bearing: Math.random() * Math.PI * 2,
      angle: 0,
    });
    this.mesh.count = this.followers.length;
  }

  /** ⚠️ Suivi provisoire — remplacé par la vraie formation en Milestone 5. */
  update(deltaTime: number, playerX: number, playerZ: number): void {
    const { speedFactor, minDistance, spacing } = CONFIG.retinue;
    const citizen = CONFIG.mortals.types.citizen;
    const speed = CONFIG.player.speed * speedFactor;
    const limit = CONFIG.world.halfSize - citizen.radius;

    for (let i = 0; i < this.followers.length; i += 1) {
      const follower = this.followers[i];

      // Chacun a sa place dans le disque : plus il est arrivé tard, plus il
      // est loin. La racine carrée répartit les fidèles en surface plutôt
      // qu'en anneaux de plus en plus larges.
      const wanted = minDistance + spacing * Math.sqrt(i);
      const targetX = playerX + Math.sin(follower.bearing) * wanted;
      const targetZ = playerZ + Math.cos(follower.bearing) * wanted;

      const dx = targetX - follower.x;
      const dz = targetZ - follower.z;
      const distance = Math.hypot(dx, dz);
      if (distance > 0.05) {
        // On ne dépasse jamais sa cible : sinon le fidèle oscille autour.
        const step = Math.min(speed * deltaTime, distance);
        follower.x += (dx / distance) * step;
        follower.z += (dz / distance) * step;
        follower.angle = Math.atan2(dx, dz);
      }

      // Le cortège reste dans la cité et hors des murs, comme tout le monde.
      follower.x = THREE.MathUtils.clamp(follower.x, -limit, limit);
      follower.z = THREE.MathUtils.clamp(follower.z, -limit, limit);
      this.probe.set(follower.x, follower.z);
      if (this.city.resolve(this.probe, citizen.radius)) {
        follower.x = this.probe.x;
        follower.z = this.probe.y;
      }
    }

    this.syncMeshes();
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
    this.mesh.count = 0;
  }

  dispose(): void {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
    this.mesh.dispose();
  }
}
