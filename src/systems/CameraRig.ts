/**
 * CameraRig.ts — la caméra qui suit le joueur.
 *
 * "Rig" = support de caméra. On ne bouge jamais la caméra à la main :
 * on lui donne une cible, elle s'en approche doucement chaque frame.
 * Ce petit retard est ce qui rend un suivi agréable plutôt que rigide.
 */

import * as THREE from 'three';
import { CONFIG } from '../config';

export class CameraRig {
  private readonly camera: THREE.PerspectiveCamera;
  private readonly desired = new THREE.Vector3();
  private readonly lookAt = new THREE.Vector3();

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
  }

  update(targetX: number, targetZ: number, deltaTime: number): void {
    const { offset, smoothing } = CONFIG.camera;

    this.desired.set(targetX + offset.x, offset.y, targetZ + offset.z);

    // Formule de lissage indépendante du framerate : sans ce calcul, la
    // caméra suivrait plus vite sur un écran 144 Hz que sur un 60 Hz.
    const t = 1 - Math.pow(smoothing, deltaTime * 60);
    this.camera.position.lerp(this.desired, t);

    this.lookAt.set(targetX, 0, targetZ);
    this.camera.lookAt(this.lookAt);
  }

  /** Place la caméra instantanément (démarrage et restart, sans glissement). */
  snapTo(targetX: number, targetZ: number): void {
    const { offset } = CONFIG.camera;
    this.camera.position.set(targetX + offset.x, offset.y, targetZ + offset.z);
    this.camera.lookAt(targetX, 0, targetZ);
  }
}
