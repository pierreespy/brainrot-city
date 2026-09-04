/**
 * AssetLoader.ts — le pont entre un `.glb` bundlé par Metro et une
 * `geometry`/`material` THREE utilisables par le jeu.
 *
 * Pourquoi ce détour et pas un simple `new GLTFLoader().load(path)` ?
 * `require('../../assets/models/x.glb')` renvoie un identifiant de module
 * Metro, pas un chemin de fichier — sur iOS/Android il n'existe encore nulle
 * part sur le disque tant qu'on ne l'a pas explicitement téléchargé.
 * `expo-asset` fait ce pont : `Asset.fromModule(...).downloadAsync()` donne
 * une URI locale (`file://…` sur mobile, une URL statique sur web) que
 * `GLTFLoader` sait lire.
 *
 * Ce module ne connaît AUCUN dieu ni aucun type de mortel : il sait charger
 * un `.glb` générique, et extraire la première géométrie/le premier matériau
 * qu'il contient pour les cas d'instancing (`City.ts`, `Mortals.ts`,
 * `Retinue.ts`). La table qui associe un id à un fichier vit à côté de ses
 * données (`entities/gods/roster.ts`), pas ici.
 */

import { Asset } from 'expo-asset';
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

/**
 * Résout un `.glb` importé par `require(...)` en URI locale chargeable.
 *
 * `require()` doit rester statique à l'appel (Metro doit voir le chemin
 * littéral pour bundler le fichier) — c'est donc l'appelant qui écrit
 * `require('../../assets/models/gods/hermes.glb')`, jamais ce module.
 */
async function resolveModuleUri(module: number): Promise<string> {
  const asset = Asset.fromModule(module);
  await asset.downloadAsync();
  const uri = asset.localUri ?? asset.uri;
  if (!uri) {
    throw new Error(`AssetLoader: impossible de résoudre l'asset ${module}`);
  }
  return uri;
}

/** Charge un `.glb` bundlé et renvoie la scène glTF complète (ex : le dieu joué). */
export async function loadGLTF(module: number): Promise<GLTF> {
  const uri = await resolveModuleUri(module);
  return new Promise((resolve, reject) => {
    loader.load(uri, resolve, undefined, reject);
  });
}

/**
 * Ce qu'un `InstancedMesh` (ville, foule) peut réutiliser d'un `.glb` :
 * une seule géométrie et un seul matériau, partagés par toutes les
 * instances — jamais un `.glb` chargé par instance.
 */
export interface GLTFPrimitive {
  readonly geometry: THREE.BufferGeometry;
  readonly material: THREE.Material;
}

/**
 * Charge un `.glb` et en extrait le premier maillage trouvé, pour l'injecter
 * dans le pipeline d'instancing existant (`addInstanced()` dans `City.ts`,
 * et l'équivalent dans `Mortals.ts`/`Retinue.ts`) à la place d'une primitive
 * procédurale (`BoxGeometry`, `CapsuleGeometry`…).
 *
 * Suppose un modèle exporté avec une échelle de 1 dans son propre espace
 * (voir la note de `instancing.ts` sur l'échelle par instance) — normaliser
 * à l'export plutôt que de compenser ici.
 */
export async function loadGLTFPrimitive(module: number): Promise<GLTFPrimitive> {
  const gltf = await loadGLTF(module);
  let found: THREE.Mesh | null = null;
  gltf.scene.traverse((child) => {
    if (!found && (child as THREE.Mesh).isMesh) {
      found = child as THREE.Mesh;
    }
  });
  if (!found) {
    throw new Error('AssetLoader: aucun maillage trouvé dans ce .glb');
  }
  const mesh = found as THREE.Mesh;
  const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
  return { geometry: mesh.geometry, material };
}
