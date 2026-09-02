/**
 * Mortals.ts — les habitants de la cité.
 *
 * Ce sont les PNJ que l'on convertira au contact en Milestone 4. Pour
 * l'instant ils se contentent de vivre : ils marchent, suivent les rues et
 * évitent les immeubles.
 *
 * Trois principes, hérités de ce qui a déjà été posé :
 *
 * 1. **Données d'un côté, affichage de l'autre.** Un mortel est une ligne de
 *    chiffres (position, cap, minuterie) ; le mesh n'est qu'un reflet. C'est
 *    ce qui permettra d'en afficher des milliers.
 *
 * 2. **Un seul InstancedMesh.** 100 mortels = 1 appel GPU, comme les 124
 *    immeubles de la Milestone 2.
 *
 * 3. **Un TYPE par mortel dès maintenant**, même s'il n'y a que des citoyens.
 *    Hoplites, prêtresses et philosophes sont prévus (voir UNIVERS.md) et
 *    n'auront qu'une ligne à ajouter au catalogue de `config.ts`.
 */

import * as THREE from 'three';
import { CONFIG } from '../config';
import type { Collider } from '../world/Collider';

/** Les types existants, déduits du catalogue : aujourd'hui « citizen ». */
export type MortalTypeId = keyof typeof CONFIG.mortals.types;

/** Un habitant. Volontairement plat : ce sont des chiffres, pas des objets. */
interface Mortal {
  readonly type: MortalTypeId;
  x: number;
  z: number;
  /** Cap actuel, en radians. 0 = vers Z+. */
  angle: number;
  /** Secondes restantes avant de changer de cap. */
  timer: number;
}

/** Générateur déterministe (mulberry32) — même principe que pour la ville. */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Zone tenue libre autour du point de départ, à la naissance de la cité. */
const START_CLEARANCE = {
  x: 0,
  z: 0,
  distance: CONFIG.mortals.spawnClearance,
};

export class Mortals {
  private readonly scene: THREE.Scene;
  private readonly city: Collider;
  private readonly mortals: Mortal[] = [];
  private readonly mesh: THREE.InstancedMesh;

  private readonly random: () => number;

  /** Objets réutilisés à chaque frame : en créer 100 par frame ferait ramer. */
  private readonly dummy = new THREE.Object3D();
  private readonly probe = new THREE.Vector2();
  /** Dernière position observée : le centre de ce que la caméra voit. */
  private viewX = 0;
  private viewZ = 0;

  constructor(scene: THREE.Scene, city: Collider) {
    this.scene = scene;
    this.city = city;
    this.random = createRandom(CONFIG.mortals.seed);

    const citizen = CONFIG.mortals.types.citizen;
    this.mesh = new THREE.InstancedMesh(
      new THREE.CapsuleGeometry(
        citizen.radius,
        citizen.height,
        CONFIG.render.bodyCapSegments,
        CONFIG.render.bodyRadialSegments,
      ),
      new THREE.MeshLambertMaterial({ color: citizen.color }),
      CONFIG.mortals.count,
    );
    // Ils bougent : Three.js doit relire les matrices à chaque frame.
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(this.mesh);

    this.spawnAll();
    this.syncMeshes();
    // La sphère englobante sert au test « est-ce à l'écran ? ». On la calcule
    // une fois les mortels placés : elle couvre alors toute la cité, ce qui
    // reste vrai puisqu'ils ne sortent jamais de ses limites.
    this.mesh.computeBoundingSphere();
  }

  // ---------------------------------------------------------------- naissance

  private spawnAll(): void {
    for (let i = 0; i < CONFIG.mortals.count; i += 1) {
      const spot = this.findFreeSpot(START_CLEARANCE);
      this.mortals.push({
        type: 'citizen',
        x: spot.x,
        z: spot.z,
        angle: this.pickHeading(),
        timer: this.pickDuration(),
      });
    }
  }

  /**
   * Cherche un point de la cité qui ne soit pas dans un immeuble.
   *
   * On tire au hasard et on réessaie : les rues occupent une bonne part de la
   * carte, donc quelques essais suffisent presque toujours. Le plafond de 40
   * essais évite la boucle infinie si un jour la ville devenait très dense —
   * dans ce cas on accepte le dernier point, quitte à ce que la collision le
   * repousse à la première frame.
   */
  private findFreeSpot(awayFrom?: { x: number; z: number; distance: number }): {
    x: number;
    z: number;
  } {
    const limit = CONFIG.world.halfSize - 2;
    const radius = CONFIG.mortals.types.citizen.radius;

    let x = 0;
    let z = 0;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      x = (this.random() * 2 - 1) * limit;
      z = (this.random() * 2 - 1) * limit;

      // Naître sous les yeux du joueur casserait l'illusion : on s'éloigne.
      if (awayFrom && Math.hypot(x - awayFrom.x, z - awayFrom.z) < awayFrom.distance) {
        continue;
      }

      this.probe.set(x, z);
      if (!this.city.resolve(this.probe, radius)) return { x, z };
    }
    return { x, z };
  }

  /**
   * Un cap proche de l'un des quatre axes de la cité.
   *
   * Les rues sont perpendiculaires : un mortel qui partirait dans une
   * direction quelconque buterait sans arrêt sur les façades. En le lançant
   * le long d'un axe, avec un léger flottement, il descend la rue.
   */
  private pickHeading(): number {
    const quarter = Math.floor(this.random() * 4) * (Math.PI / 2);
    const jitter = (this.random() * 2 - 1) * CONFIG.mortals.headingJitter;
    return quarter + jitter;
  }

  private pickDuration(): number {
    const { minSeconds, maxSeconds } = CONFIG.mortals.wander;
    return minSeconds + this.random() * (maxSeconds - minSeconds);
  }

  // ---------------------------------------------------------------- vie

  /**
   * @param viewX/viewZ position de la caméra (celle du joueur) : sert à ne
   *                    dessiner que les mortels visibles
   */
  update(deltaTime: number, viewX: number, viewZ: number): void {
    this.viewX = viewX;
    this.viewZ = viewZ;
    const citizen = CONFIG.mortals.types.citizen;
    const limit = CONFIG.world.halfSize - citizen.radius;

    for (const mortal of this.mortals) {
      mortal.timer -= deltaTime;
      if (mortal.timer <= 0) {
        mortal.angle = this.pickHeading();
        mortal.timer = this.pickDuration();
      }

      const step = citizen.speed * deltaTime;
      mortal.x += Math.sin(mortal.angle) * step;
      mortal.z += Math.cos(mortal.angle) * step;

      // Le bord du monde et les immeubles font demi-tour, pas mur.
      let blocked = false;
      if (mortal.x < -limit || mortal.x > limit) {
        mortal.x = THREE.MathUtils.clamp(mortal.x, -limit, limit);
        blocked = true;
      }
      if (mortal.z < -limit || mortal.z > limit) {
        mortal.z = THREE.MathUtils.clamp(mortal.z, -limit, limit);
        blocked = true;
      }

      this.probe.set(mortal.x, mortal.z);
      if (this.city.resolve(this.probe, citizen.radius)) {
        mortal.x = this.probe.x;
        mortal.z = this.probe.y;
        blocked = true;
      }

      // Buter contre quelque chose remet la minuterie à zéro : sans ça, un
      // mortal resterait planté contre la façade jusqu'à la fin de son cap.
      if (blocked) {
        mortal.angle = this.pickHeading();
        mortal.timer = this.pickDuration();
      }
    }

    this.syncMeshes();
  }

  /**
   * Recopie les positions logiques dans le mesh instancié.
   *
   * ⚠️ Seuls les mortels **proches** y sont écrits. Les autres continuent de
   * vivre — ils marchent, ils sont convertissables — mais leur géométrie
   * n'est pas envoyée au GPU : la caméra ne voit qu'une soixantaine d'unités,
   * et dessiner les 450 revenait à en dessiner 400 hors de l'écran.
   *
   * Les emplacements du mesh sont remplis **en continu** (0, 1, 2…) sans
   * rapport avec le rang du mortel, et `count` dit où s'arrêter : c'est ce
   * qui permet d'en sauter sans laisser de trous.
   */
  private syncMeshes(): void {
    const citizen = CONFIG.mortals.types.citizen;
    const y = citizen.height / 2 + citizen.radius;
    const maxDistance = CONFIG.render.mortalDrawDistance;
    const maxDistanceSq = maxDistance * maxDistance;

    let drawn = 0;
    for (const mortal of this.mortals) {
      const dx = mortal.x - this.viewX;
      const dz = mortal.z - this.viewZ;
      if (dx * dx + dz * dz > maxDistanceSq) continue;

      this.dummy.position.set(mortal.x, y, mortal.z);
      this.dummy.rotation.set(0, mortal.angle, 0);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(drawn, this.dummy.matrix);
      drawn += 1;
    }

    this.mesh.count = drawn;
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  /** Combien de mortels sont réellement dessinés (banc de test). */
  get drawnCount(): number {
    return this.mesh.count;
  }

  // ---------------------------------------------------------------- conversion

  /**
   * Retire les mortels assez proches de (x, z) et renvoie leurs types.
   *
   * Le vivier ne se vide jamais : chaque mortel converti est **immédiatement
   * remplacé** par un nouveau, né loin du joueur. Le nombre d'habitants est
   * donc constant, et le nombre d'emplacements du mesh instancié aussi — ce
   * qui évite d'avoir à le reconstruire en pleine partie.
   *
   * @param alsoTouchedBy test optionnel : un fidèle du cortège touche-t-il ce
   *                      mortel ? (c'est ce qui fait boule de neige)
   * @returns le type de chaque mortel converti (un hoplite vaudra 3 fidèles)
   */
  takeNear(
    x: number,
    z: number,
    radius: number,
    alsoTouchedBy?: (mortalX: number, mortalZ: number) => boolean,
  ): MortalTypeId[] {
    const taken: MortalTypeId[] = [];
    const radiusSq = radius * radius;

    for (const mortal of this.mortals) {
      const dx = mortal.x - x;
      const dz = mortal.z - z;
      // Touché par la divinité elle-même, ou — si l'appelant fournit ce
      // test — par l'un de ses fidèles.
      const touched =
        dx * dx + dz * dz <= radiusSq ||
        (alsoTouchedBy !== undefined && alsoTouchedBy(mortal.x, mortal.z));
      if (!touched) continue;

      taken.push(mortal.type);

      // On ne SUPPRIME pas la ligne, on la recycle : c'est un nouvel habitant
      // qui prend la place de celui qui vient de rejoindre le cortège.
      const spot = this.findFreeSpot({
        x,
        z,
        distance: CONFIG.conversion.respawnMinDistance,
      });
      mortal.x = spot.x;
      mortal.z = spot.z;
      mortal.angle = this.pickHeading();
      mortal.timer = this.pickDuration();
    }

    return taken;
  }

  /** Repeuple la cité de zéro (utilisé par le restart). */
  reset(): void {
    for (const mortal of this.mortals) {
      const spot = this.findFreeSpot(START_CLEARANCE);
      mortal.x = spot.x;
      mortal.z = spot.z;
      mortal.angle = this.pickHeading();
      mortal.timer = this.pickDuration();
    }
    this.syncMeshes();
  }

  // ---------------------------------------------------------------- lecture

  get count(): number {
    return this.mortals.length;
  }

  /** Copie des positions — pour le banc de test uniquement. */
  getPositions(): { x: number; z: number }[] {
    return this.mortals.map((m) => ({ x: m.x, z: m.z }));
  }

  /** Combien de mortels sont DANS un immeuble. Doit toujours valoir 0. */
  countInsideBuildings(): number {
    const radius = CONFIG.mortals.types.citizen.radius * 0.9;
    let count = 0;
    for (const mortal of this.mortals) {
      this.probe.set(mortal.x, mortal.z);
      if (this.city.resolve(this.probe, radius)) count += 1;
    }
    return count;
  }

  dispose(): void {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
    this.mesh.dispose();
  }
}
