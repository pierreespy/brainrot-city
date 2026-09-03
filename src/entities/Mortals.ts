/**
 * Mortals.ts — les habitants de la cité.
 *
 * Ce sont les PNJ que l'on convertit au contact. Ils marchent, suivent les
 * rues et évitent les immeubles.
 *
 * Quatre principes, hérités de ce qui a déjà été posé :
 *
 * 1. **Données d'un côté, affichage de l'autre.** Un mortel est une ligne de
 *    chiffres (position, cap, minuterie) ; le mesh n'est qu'un reflet. C'est
 *    ce qui permet d'en afficher des centaines.
 *
 * 2. **Un seul InstancedMesh.** 450 mortels = 1 appel GPU, comme les 124
 *    immeubles de la Milestone 3.
 *
 * 3. **Un TYPE par mortel dès maintenant**, même s'il n'y a que des citoyens.
 *    Hoplites, prêtresses et philosophes sont prévus (voir UNIVERS.md) et
 *    n'auront qu'une ligne à ajouter au catalogue de `config.ts`.
 *
 * 4. **On ne paie que ce qui se voit** (Milestone 9). La caméra ne cadre
 *    qu'une quarantaine d'unités devant le joueur : sur 450 mortels, une
 *    trentaine seulement sont à l'écran. Les autres ne sont ni dessinés, ni
 *    déplacés à chaque image — voir `update()`.
 */

import * as THREE from 'three';
import { CONFIG } from '../config';
import type { Collider } from '../world/Collider';
import type { Population } from '../world/Population';
import type { ViewCulling } from '../systems/ViewCulling';
import { primeInstances, uploadInstances, writeInstance } from '../core/instancing';

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
  /**
   * Temps écoulé depuis son dernier déplacement.
   *
   * Un mortel hors champ n'avance pas à chaque image : il accumule ici les
   * secondes qui lui sont dues, et les dépense d'un coup quand vient son
   * tour. Il parcourt exactement la même distance, en moins d'étapes.
   */
  pending: number;
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
  private readonly city: Collider & Population;
  private readonly mortals: Mortal[] = [];
  private readonly mesh: THREE.InstancedMesh;
  /** Le tableau de matrices du mesh, écrit directement (voir `instancing.ts`). */
  private readonly matrices: Float32Array;
  /** Hauteur du centre d'une silhouette : la même pour tout le monde. */
  private readonly meshY: number;

  private readonly random: () => number;

  /** Numéro d'image, pour répartir les mortels hors champ sur N tours. */
  private frame = 0;
  /** Combien de silhouettes ont réellement été envoyées au GPU. */
  private drawn = 0;

  /**
   * Objets de travail réutilisés d'une image à l'autre.
   *
   * Rien ne doit être alloué dans la boucle de jeu : 60 tableaux jetables par
   * seconde finissent par déclencher le ramasse-miettes, et une pause du
   * ramasse-miettes se voit à l'écran.
   */
  private readonly probe = new THREE.Vector2();
  private readonly spot = { x: 0, z: 0 };
  private readonly taken: MortalTypeId[] = [];

  constructor(scene: THREE.Scene, city: Collider & Population) {
    this.scene = scene;
    this.city = city;
    this.random = createRandom(CONFIG.mortals.seed);

    const citizen = CONFIG.mortals.types.citizen;
    this.meshY = citizen.height / 2 + citizen.radius;
    this.mesh = new THREE.InstancedMesh(
      new THREE.CapsuleGeometry(
        citizen.radius,
        citizen.height,
        CONFIG.crowd.capSegments,
        CONFIG.crowd.radialSegments,
      ),
      new THREE.MeshLambertMaterial({ color: citizen.color }),
      CONFIG.mortals.count,
    );
    // Ils bougent : Three.js doit relire les matrices à chaque image.
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    // Le tri par objet ne peut plus rien écarter : nous faisons désormais le
    // nôtre, instance par instance (voir `ViewCulling`), et ce mesh unique
    // couvre de toute façon la cité entière.
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);

    primeInstances(this.mesh);
    this.matrices = this.mesh.instanceMatrix.array as Float32Array;

    this.spawnAll();
    // Rien n'est encore cadré (la caméra n'existe peut-être pas) : pour cette
    // toute première image, on affiche tout le monde.
    this.sync(null);
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
        pending: 0,
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
   * repousse à la première image.
   *
   * ⚠️ Le résultat est un objet REUTILISÉ : il faut le lire tout de suite,
   * pas le conserver.
   */
  private findFreeSpot(awayFrom?: { x: number; z: number; distance: number }): {
    x: number;
    z: number;
  } {
    const radius = CONFIG.mortals.types.citizen.radius;

    for (let attempt = 0; attempt < 40; attempt += 1) {
      // Le tirage n'est PAS uniforme : il suit la densité des quartiers, si
      // bien que l'agora grouille et que le bois sacré reste désert.
      this.city.pickPopulatedSpot(this.random, this.spot);

      // Naître sous les yeux du joueur casserait l'illusion : on s'éloigne.
      if (awayFrom !== undefined) {
        const dx = this.spot.x - awayFrom.x;
        const dz = this.spot.z - awayFrom.z;
        if (dx * dx + dz * dz < awayFrom.distance * awayFrom.distance) continue;
      }

      this.probe.set(this.spot.x, this.spot.z);
      if (!this.city.resolve(this.probe, radius)) break;
    }

    return this.spot;
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
   * Une image de vie citadine — et le poste où la Milestone 9 a le plus gagné.
   *
   * Un seul parcours du tableau fait les trois choses d'un coup, parce que
   * les trois dépendent de la même question : **ce mortel est-il à l'écran ?**
   *
   * - **à l'écran** — il avance à chaque image, et sa silhouette est envoyée
   *   au GPU ;
   * - **hors champ** — il n'est pas dessiné du tout, et il n'avance qu'une
   *   image sur `mortals.offscreenSlices`, en rattrapant d'un coup le temps
   *   qu'il a accumulé. Il parcourt la même distance, personne ne le voit
   *   sautiller, et il est là où il doit être quand on arrive.
   *
   * Pourquoi le champ de la caméra et non un rayon autour du joueur ? Parce
   * qu'un rayon devrait être taillé pour le pire écran (voir `ViewCulling`).
   *
   * @param culling le champ de la caméra, rafraîchi juste avant l'appel
   */
  update(deltaTime: number, culling: ViewCulling | null = null): void {
    const citizen = CONFIG.mortals.types.citizen;
    const limit = CONFIG.world.halfSize - citizen.radius;
    const slices = CONFIG.mortals.offscreenSlices;

    this.frame += 1;
    const slice = this.frame % slices;

    let drawn = 0;

    for (let i = 0; i < this.mortals.length; i += 1) {
      const mortal = this.mortals[i];
      const visible =
        culling === null || culling.isVisible(mortal.x, this.meshY, mortal.z, citizen.radius);

      mortal.pending += deltaTime;
      if (visible || i % slices === slice) {
        this.step(mortal, mortal.pending, citizen.speed, limit, citizen.radius);
        mortal.pending = 0;
      }

      if (visible) {
        writeInstance(this.matrices, drawn, mortal.x, this.meshY, mortal.z, mortal.angle);
        drawn += 1;
      }
    }

    this.drawn = drawn;
    uploadInstances(this.mesh, drawn);
  }

  /** Un pas de marche : avancer, buter, repartir ailleurs si l'on a buté. */
  private step(
    mortal: Mortal,
    deltaTime: number,
    speed: number,
    limit: number,
    radius: number,
  ): void {
    mortal.timer -= deltaTime;
    if (mortal.timer <= 0) {
      mortal.angle = this.pickHeading();
      mortal.timer = this.pickDuration();
    }

    const step = speed * deltaTime;
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
    if (this.city.resolve(this.probe, radius)) {
      mortal.x = this.probe.x;
      mortal.z = this.probe.y;
      blocked = true;
    }

    // Buter contre quelque chose remet la minuterie à zéro : sans ça, un
    // mortel resterait planté contre la façade jusqu'à la fin de son cap.
    if (blocked) {
      mortal.angle = this.pickHeading();
      mortal.timer = this.pickDuration();
    }
  }

  /**
   * Recopie les positions logiques dans le mesh instancié.
   *
   * Utilisé hors de la boucle de jeu (première image, remise à zéro) : là,
   * on affiche tout le monde, la caméra décidera dès l'image suivante.
   */
  private sync(culling: ViewCulling | null): void {
    const radius = CONFIG.mortals.types.citizen.radius;
    let drawn = 0;
    for (const mortal of this.mortals) {
      if (culling !== null && !culling.isVisible(mortal.x, this.meshY, mortal.z, radius)) {
        continue;
      }
      writeInstance(this.matrices, drawn, mortal.x, this.meshY, mortal.z, mortal.angle);
      drawn += 1;
    }
    this.drawn = drawn;
    uploadInstances(this.mesh, drawn);
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
   * @returns le type de chaque mortel converti (un hoplite vaudra 3 fidèles).
   *          ⚠️ Tableau REUTILISÉ d'une image à l'autre : à consommer tout de
   *          suite, jamais à conserver.
   */
  takeNear(
    x: number,
    z: number,
    radius: number,
    alsoTouchedBy?: (mortalX: number, mortalZ: number) => boolean,
  ): MortalTypeId[] {
    const taken = this.taken;
    taken.length = 0;
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
      mortal.pending = 0;
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
      mortal.pending = 0;
    }
    this.sync(null);
  }

  // ---------------------------------------------------------------- lecture

  get count(): number {
    return this.mortals.length;
  }

  /** Silhouettes réellement soumises au GPU cette image (banc de mesure). */
  get drawnCount(): number {
    return this.drawn;
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
