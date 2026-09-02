/**
 * ViewCulling.ts — « qu'est-ce qui est réellement à l'écran ? »
 *
 * La cité fait 198 × 198 unités. La caméra, elle, est haute de 40 et penchée :
 * elle ne cadre qu'un **couloir d'une quarantaine d'unités devant le joueur**
 * et d'une vingtaine derrière. Autrement dit, la quasi-totalité des 450
 * mortels est calculée, transformée et envoyée au GPU… pour finir hors champ.
 *
 * Cette classe répond à une seule question — « ce point est-il dans le champ
 * de la caméra ? » — et c'est elle qui décide :
 *
 * - **ce qu'on dessine** : seules les silhouettes visibles prennent une place
 *   dans le mesh instancié ;
 * - **ce qu'on simule à pleine vitesse** : un mortel hors champ n'a pas
 *   besoin d'avancer 60 fois par seconde, personne ne le regarde.
 *
 * Pourquoi le champ de la caméra plutôt qu'un simple rayon autour du joueur ?
 * Parce que le rayon devrait être calculé pour le pire écran : sur un
 * téléphone tenu à la verticale, le champ est étroit ; sur le banc de test
 * web en fenêtre large, il est trois fois plus ouvert. Le tronc de vision,
 * lui, s'adapte tout seul, et ne se trompe jamais.
 *
 * ⚠️ Three.js sait déjà écarter un OBJET hors champ (`frustumCulled`), mais
 * pas une INSTANCE : la foule entière ne forme qu'un seul objet, toujours à
 * l'écran. C'est pour cela que ce test doit être fait par nous.
 */

import * as THREE from 'three';

export class ViewCulling {
  private readonly frustum = new THREE.Frustum();
  private readonly matrix = new THREE.Matrix4();
  private readonly sphere = new THREE.Sphere();

  /**
   * Marge de sécurité, en unités, ajoutée à chaque test.
   *
   * Elle absorbe deux imprécisions : la silhouette est traitée comme un point
   * alors qu'elle a une épaisseur, et la caméra bouge entre le moment où l'on
   * teste et celui où l'on affiche. Sans elle, un mortel pourrait apparaître
   * en bord d'écran plutôt qu'y entrer.
   */
  private readonly margin: number;

  constructor(margin: number) {
    this.margin = margin;
    this.sphere.radius = margin;
  }

  /** À appeler une fois par image, APRÈS avoir bougé la caméra. */
  refresh(camera: THREE.PerspectiveCamera): void {
    // La caméra vient d'être déplacée : sa matrice monde n'est pas encore à
    // jour (le moteur de rendu ne le fera qu'au moment de dessiner).
    camera.updateMatrixWorld();
    this.matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.matrix);
  }

  /**
   * Ce personnage est-il dans le champ ?
   *
   * @param y hauteur du centre de la silhouette (elles ont toutes la même)
   */
  isVisible(x: number, y: number, z: number, radius = 0): boolean {
    this.sphere.center.set(x, y, z);
    this.sphere.radius = radius + this.margin;
    return this.frustum.intersectsSphere(this.sphere);
  }
}
