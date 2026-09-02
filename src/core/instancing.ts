/**
 * instancing.ts — écrire une silhouette dans un `InstancedMesh`, vite.
 *
 * Mortels et fidèles partagent exactement le même besoin : poser un
 * personnage à (x, z), tourné d'un angle autour de l'axe vertical. Jusqu'ici
 * chacun le faisait avec un `THREE.Object3D` de service :
 *
 *     dummy.position.set(x, y, z);
 *     dummy.rotation.set(0, angle, 0);   // → conversion en quaternion
 *     dummy.updateMatrix();              // → recomposition des 16 nombres
 *     mesh.setMatrixAt(i, dummy.matrix); // → recopie des 16 nombres
 *
 * Soit, pour 1 050 personnages à 60 images par seconde, 63 000 conversions
 * d'angle en quaternion par seconde — pour une rotation autour d'UN seul axe,
 * dont la matrice s'écrit à la main en deux lignes.
 *
 * On écrit donc directement dans le tableau du mesh. Une matrice de rotation
 * autour de Y ne contient que quatre nombres variables (cos, sin, -sin, cos)
 * et la position : le reste est un 0 ou un 1, écrit UNE FOIS pour toutes par
 * `primeInstances()`.
 *
 * ⚠️ Ce raccourci suppose une **échelle de 1** et une rotation **autour de Y
 * uniquement**. Le jour où un hoplite sera plus grand qu'un citoyen
 * (Milestone 8), il faudra aussi écrire les termes d'échelle : ce sont les
 * cases 0, 5 et 10, multipliées par le facteur voulu.
 */

import type * as THREE from 'three';

/**
 * Prépare le tableau de matrices : tout le monde à l'identité.
 *
 * Indispensable, car `writeInstance()` ne réécrit ensuite que les cases qui
 * changent. Sans cette mise à zéro, les autres contiendraient n'importe quoi.
 */
export function primeInstances(mesh: THREE.InstancedMesh): void {
  const array = mesh.instanceMatrix.array as Float32Array;
  array.fill(0);
  for (let offset = 0; offset < array.length; offset += 16) {
    array[offset] = 1;
    array[offset + 5] = 1;
    array[offset + 10] = 1;
    array[offset + 15] = 1;
  }
  mesh.instanceMatrix.needsUpdate = true;
}

/**
 * Pose le personnage `slot` à (x, y, z), tourné de `angle` autour de Y.
 *
 * Les matrices de Three.js sont rangées **par colonnes** : la position occupe
 * les cases 12, 13, 14 et la rotation autour de Y les cases 0, 2, 8 et 10.
 */
export function writeInstance(
  array: Float32Array,
  slot: number,
  x: number,
  y: number,
  z: number,
  angle: number,
): void {
  const offset = slot * 16;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  array[offset] = cos;
  array[offset + 2] = -sin;
  array[offset + 8] = sin;
  array[offset + 10] = cos;
  array[offset + 12] = x;
  array[offset + 13] = y;
  array[offset + 14] = z;
}

/**
 * Annonce au GPU les `used` premières silhouettes, et elles seules.
 *
 * `needsUpdate` seul renverrait TOUT le tableau à chaque image — 38 ko pour
 * un cortège de 600, dont l'immense majorité n'a pas changé quand la foule
 * est petite. En déclarant la plage utile, Three.js ne transfère que celle-là.
 */
export function uploadInstances(mesh: THREE.InstancedMesh, used: number): void {
  const attribute = mesh.instanceMatrix;
  attribute.clearUpdateRanges();
  attribute.addUpdateRange(0, used * 16);
  attribute.needsUpdate = true;
  mesh.count = used;
}
