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
  /** Décalage d'anticipation courant, lissé frame après frame. */
  private readonly ahead = new THREE.Vector2(0, 0);

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
  }

  /**
   * @param targetX/targetZ position du joueur
   * @param deltaTime       durée de la frame
   * @param intentX/intentZ direction de course (-1..1), pour l'anticipation
   */
  update(
    targetX: number,
    targetZ: number,
    deltaTime: number,
    intentX = 0,
    intentZ = 0,
  ): void {
    const { offset, smoothing, lookAhead, lookAheadSmoothing } = CONFIG.camera;

    // Anticipation : on décale la cible DEVANT le joueur, d'autant plus
    // qu'il va vite. Lissée à part, plus mollement que le suivi, pour que la
    // caméra ne sursaute pas à chaque changement de direction.
    const aheadT = 1 - Math.pow(lookAheadSmoothing, deltaTime * 60);
    this.ahead.x += (intentX * lookAhead - this.ahead.x) * aheadT;
    this.ahead.y += (intentZ * lookAhead - this.ahead.y) * aheadT;

    targetX += this.ahead.x;
    targetZ += this.ahead.y;

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
    this.ahead.set(0, 0);
    this.camera.position.set(targetX + offset.x, offset.y, targetZ + offset.z);
    this.camera.lookAt(targetX, 0, targetZ);
  }
}
