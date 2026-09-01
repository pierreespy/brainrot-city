/**
 * Player.ts — le personnage contrôlé par le joueur.
 *
 * Le joueur n'est qu'une POSITION (x, z) que l'on déplace, plus un mesh
 * qu'on recopie à cette position pour l'afficher. Séparer les deux
 * (données / affichage) est l'idée qui rendra la foule performante plus tard.
 */

import * as THREE from 'three';
import { CONFIG } from '../config';
import type { MoveIntent } from '../systems/input/InputSource';

export class Player {
  /** Position au sol. Y n'existe pas : le jeu est en 2D vue de dessus. */
  readonly position = new THREE.Vector2(0, 0);

  readonly mesh: THREE.Mesh;

  /** Vitesse actuelle : sert à accélérer/freiner progressivement. */
  private readonly velocity = new THREE.Vector2(0, 0);

  constructor(scene: THREE.Scene) {
    const { radius, height, color } = CONFIG.player;

    const geometry = new THREE.CapsuleGeometry(radius, height, 4, 12);
    const material = new THREE.MeshLambertMaterial({ color });
    this.mesh = new THREE.Mesh(geometry, material);
    scene.add(this.mesh);

    this.syncMesh();
  }

  /**
   * @param intent    direction voulue (-1..1), fournie par Input
   * @param deltaTime durée de la frame en secondes
   */
  update(intent: MoveIntent, deltaTime: number): void {
    const { speed, acceleration } = CONFIG.player;

    const targetVx = intent.x * speed;
    const targetVz = intent.z * speed;

    // Interpolation vers la vitesse voulue = démarrage et arrêt en douceur.
    // Le calcul avec Math.min garde le résultat stable même si une frame
    // dure anormalement longtemps (onglet en arrière-plan).
    const t = acceleration > 0 ? Math.min(1, deltaTime / acceleration) : 1;
    this.velocity.x += (targetVx - this.velocity.x) * t;
    this.velocity.y += (targetVz - this.velocity.y) * t;

    // Multiplier par deltaTime : le jeu avance à la même vitesse réelle
    // que l'écran soit à 60 Hz ou à 144 Hz.
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;

    this.clampToWorld();
    this.faceMovementDirection();
    this.syncMesh();
  }

  /** Empêche de sortir du terrain. Sera remplacé par les murs de la ville. */
  private clampToWorld(): void {
    const limit = CONFIG.world.halfSize - CONFIG.player.radius;
    this.position.x = THREE.MathUtils.clamp(this.position.x, -limit, limit);
    this.position.y = THREE.MathUtils.clamp(this.position.y, -limit, limit);
  }

  /** Oriente le personnage vers là où il court (uniquement s'il bouge). */
  private faceMovementDirection(): void {
    if (this.velocity.lengthSq() < 0.5) return;
    const targetAngle = Math.atan2(this.velocity.x, this.velocity.y);
    // Rotation progressive plutôt qu'instantanée : plus agréable à l'œil.
    this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, targetAngle, 0.2);
  }

  /** Recopie la position logique (x, z) dans le monde 3D. */
  private syncMesh(): void {
    const y = CONFIG.player.height / 2 + CONFIG.player.radius;
    this.mesh.position.set(this.position.x, y, this.position.y);
  }

  /** Remet le joueur au centre (utilisé par le restart en Milestone 6). */
  reset(): void {
    this.position.set(0, 0);
    this.velocity.set(0, 0);
    this.syncMesh();
  }
}
