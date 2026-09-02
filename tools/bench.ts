/**
 * bench.ts — le banc de mesure du jeu, sans écran ni carte graphique.
 *
 * Il fait tourner la VRAIE simulation (la ville, les mortels, la conversion,
 * le cortège) pendant quelques milliers d'images et publie ce que chaque
 * étape coûte. Aucun rendu : ce banc mesure le coût PROCESSEUR, celui qui
 * nous appartient et que nous pouvons corriger.
 *
 *   npm run bench
 *
 * Deux scénarios sont joués :
 *
 *   1. « partie réelle »  — 60 secondes depuis zéro, le cortège grandit ;
 *   2. « pire cas »       — cortège plein (600 fidèles), le budget à tenir.
 *
 * Il publie aussi des garde-fous de qualité (personne dans un mur, cortège
 * qui ne décroche pas, fidèles qui ne s'empilent pas) : une optimisation qui
 * casserait le jeu serait visible ici, pas seulement à l'œil.
 */

import * as THREE from 'three';

import { CONFIG } from '../src/config';
import { Profiler } from '../src/core/Profiler';
import { City } from '../src/world/City';
import { Player } from '../src/entities/Player';
import { Mortals } from '../src/entities/Mortals';
import { Retinue } from '../src/entities/Retinue';
import { Conversion } from '../src/systems/Conversion';
import { PlayerTrail } from '../src/systems/PlayerTrail';
import { CameraRig } from '../src/systems/CameraRig';
import { ViewCulling } from '../src/systems/ViewCulling';
import { checkSeparationGrid } from './check-separation';
import type { MoveIntent } from '../src/systems/input/InputSource';

const FPS = 60;
const DT = 1 / FPS;

/** Format du téléphone visé (points), qui décide du champ de la caméra. */
const SCREEN = { width: 390, height: 844 };

/** Le même générateur déterministe que partout ailleurs dans le projet. */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Un joueur automatique : il descend une rue, puis tourne.
 *
 * Il ne joue PAS au hasard dans toutes les directions : il suit les axes,
 * comme un vrai joueur dans une ville en damier. C'est ce qui fait passer le
 * cortège par des angles, donc ce qui met la formation à l'épreuve.
 */
class ScriptedPlayer {
  private readonly random = createRandom(4242);
  private readonly intent: MoveIntent = { x: 0, z: 1 };
  private timer = 0;
  /** Nombre de changements de direction — un repère pour les mesures. */
  turns = 0;

  next(deltaTime: number): MoveIntent {
    this.timer -= deltaTime;
    if (this.timer <= 0) {
      const quarter = Math.floor(this.random() * 4);
      this.intent.x = quarter === 0 ? 1 : quarter === 1 ? -1 : 0;
      this.intent.z = quarter === 2 ? 1 : quarter === 3 ? -1 : 0;
      this.timer = 1 + this.random() * 2;
      this.turns += 1;
    }
    return this.intent;
  }
}

interface Result {
  label: string;
  frames: number;
  /** ms par image, par étape. */
  steps: { name: string; ms: number }[];
  cpuMs: number;
  followers: number;
  faithful: number;
  conversions: number;
  /** Instances de personnages réellement soumises au GPU, en moyenne. */
  drawnMortals: number;
  drawnFollowers: number;
  trianglesPerFrame: number;
  staticTriangles: number;
  /** Distance du fidèle le plus éloigné du joueur, pire cas du parcours. */
  maxSpread: number;
  /** Étalement moyen — la mesure stable, moins sensible à un traînard isolé. */
  meanSpread: number;
  /** Part des fidèles collés à un voisin (empilement). */
  overlapRate: number;
  mortalsInWalls: number;
  followersInWalls: number;
}

function run(label: string, frames: number, preloadFollowers: number): Result {
  const scene = new THREE.Scene();
  const city = new City(scene);
  const player = new Player(scene, city);
  // La ville et le joueur, comptés AVANT que la foule n'existe : le reste des
  // triangles se déduit du nombre de silhouettes réellement dessinées.
  const staticTriangles = sceneTriangles(scene);
  const mortals = new Mortals(scene, city);
  const retinue = new Retinue(scene, city);
  const conversion = new Conversion(mortals, retinue);
  const trail = new PlayerTrail(player.position.x, player.position.y);

  const camera = new THREE.PerspectiveCamera(
    CONFIG.camera.fov,
    SCREEN.width / SCREEN.height,
    0.1,
    400,
  );
  const cameraRig = new CameraRig(camera);
  cameraRig.snapTo(player.position.x, player.position.y);
  const culling = new ViewCulling(CONFIG.crowd.cullMargin);

  // Le pire cas ne s'atteint pas en jouant 60 secondes : on remplit le
  // cortège d'emblée, c'est le budget qui doit tenir quoi qu'il arrive.
  for (let i = 0; i < preloadFollowers; i += 1) {
    retinue.add('citizen', player.position.x, player.position.y);
  }

  const script = new ScriptedPlayer();
  const profiler = new Profiler(true, frames);

  let conversions = 0;
  let maxSpread = 0;
  let spreadTotal = 0;
  let drawnMortals = 0;
  let drawnFollowers = 0;
  let mortalsInWalls = 0;
  let followersInWalls = 0;

  // Images à blanc : le temps que les compilateurs à la volée chauffent, et
  // surtout que le cortège prenne sa formation. Un cortège que l'on vient de
  // remplir d'un coup est encore en tas : mesurer là serait mesurer un
  // moment qui n'arrive jamais en jeu.
  const warmup = preloadFollowers > 0 ? 900 : 120;
  for (let i = 0; i < warmup; i += 1) {
    const intent = script.next(DT);
    player.update(intent, DT);
    const { x, y: z } = player.position;
    cameraRig.update(
      x,
      z,
      DT,
      player.velocity.x / CONFIG.player.speed,
      player.velocity.y / CONFIG.player.speed,
    );
    culling.refresh(camera);
    mortals.update(DT, culling);
    trail.update(x, z);
    conversion.update(x, z);
    retinue.update(DT, x, z, trail, culling);
  }
  profiler.reset();

  for (let frame = 0; frame < frames; frame += 1) {
    profiler.frameStart();

    const intent = script.next(DT);
    player.update(intent, DT);
    const { x, y: z } = player.position;
    profiler.mark('joueur');

    cameraRig.update(
      x,
      z,
      DT,
      player.velocity.x / CONFIG.player.speed,
      player.velocity.y / CONFIG.player.speed,
    );
    culling.refresh(camera);
    profiler.mark('caméra');

    mortals.update(DT, culling);
    profiler.mark('mortels');

    trail.update(x, z);
    conversions += conversion.update(x, z);
    profiler.mark('conversion');

    retinue.update(DT, x, z, trail, culling);
    profiler.mark('cortège');

    profiler.frameEnd();

    if (retinue.spreadRadius > maxSpread) maxSpread = retinue.spreadRadius;
    spreadTotal += retinue.spreadRadius;
    drawnMortals += mortals.drawnCount;
    drawnFollowers += retinue.drawnCount;

    // Les garde-fous ne sont vérifiés que de temps en temps : les compter à
    // chaque image coûterait plus cher que le jeu lui-même.
    if (frame % 60 === 0) {
      mortalsInWalls = Math.max(mortalsInWalls, mortals.countInsideBuildings());
      followersInWalls = Math.max(followersInWalls, countInWalls(retinue.getPositions(), city));
    }
  }

  const snapshot = profiler.snapshot();
  const positions = retinue.getPositions();

  return {
    label,
    frames,
    steps: snapshot.steps,
    cpuMs: snapshot.cpuMs,
    followers: retinue.size,
    faithful: retinue.faithfulCount,
    conversions,
    drawnMortals: drawnMortals / frames,
    drawnFollowers: drawnFollowers / frames,
    staticTriangles,
    trianglesPerFrame:
      (drawnMortals / frames + drawnFollowers / frames) * capsuleTriangles() + staticTriangles,
    maxSpread,
    meanSpread: spreadTotal / frames,
    overlapRate: overlapRate(positions),
    mortalsInWalls,
    followersInWalls,
  };
}

/** Triangles d'une silhouette, tels que la configuration les demande. */
function capsuleTriangles(): number {
  const { radius, height } = CONFIG.mortals.types.citizen;
  const { capSegments, radialSegments } = CONFIG.crowd;
  const geometry = new THREE.CapsuleGeometry(radius, height, capSegments, radialSegments);
  const count = (geometry.index?.count ?? 0) / 3;
  geometry.dispose();
  return count;
}

/** Triangles de tout ce qui est posé dans la scène à cet instant. */
function sceneTriangles(scene: THREE.Scene): number {
  let total = 0;
  scene.traverse((object) => {
    const mesh = object as THREE.Mesh & { count?: number };
    if (!mesh.isMesh) return;
    const index = mesh.geometry.index;
    const tris = index ? index.count / 3 : mesh.geometry.attributes.position.count / 3;
    total += tris * (mesh.count ?? 1);
  });
  return total;
}

function countInWalls(positions: { x: number; z: number }[], city: City): number {
  const radius = CONFIG.mortals.types.citizen.radius * 0.9;
  let count = 0;
  for (const { x, z } of positions) if (!city.isFree(x, z, radius)) count += 1;
  return count;
}

/**
 * Part des fidèles qui ont un voisin à moins de 60 % de la distance de
 * répulsion : c'est la mesure de l'empilement, celle que la Milestone 5 a
 * fait tomber de 30 % à 2,6 %.
 */
function overlapRate(positions: { x: number; z: number }[]): number {
  if (positions.length < 2) return 0;
  // « Superposés » au sens strict : à moins d'un tiers de la distance de
  // répulsion, soit 35 cm, deux silhouettes de 90 cm de large se traversent.
  const limit = CONFIG.retinue.separation / 3;
  const limitSq = limit * limit;
  let stacked = 0;
  for (let i = 0; i < positions.length; i += 1) {
    for (let j = i + 1; j < positions.length; j += 1) {
      const dx = positions[j].x - positions[i].x;
      const dz = positions[j].z - positions[i].z;
      if (dx * dx + dz * dz < limitSq) {
        stacked += 1;
        break;
      }
    }
  }
  return stacked / positions.length;
}

function ms(value: number): string {
  return value.toFixed(3).padStart(7);
}

function report(result: Result): void {
  console.log(`\n### ${result.label} — ${result.frames} images`);
  console.log('');
  console.log('| Étape | ms / image |');
  console.log('|---|---|');
  for (const step of result.steps) {
    console.log(`| ${step.name} | ${ms(step.ms)} |`);
  }
  console.log(`| **total processeur** | **${ms(result.cpuMs)}** |`);
  console.log('');
  console.log(`Budget d'une image à 60 Hz : 16,667 ms — occupé à ${((result.cpuMs / 16.667) * 100).toFixed(1)} %`);
  console.log('');
  console.log('| Ce que voit le GPU | Valeur |');
  console.log('|---|---|');
  console.log(`| Mortels dessinés (moyenne) | ${result.drawnMortals.toFixed(0)} / ${CONFIG.mortals.count} |`);
  console.log(`| Fidèles dessinés (moyenne) | ${result.drawnFollowers.toFixed(0)} / ${result.followers} |`);
  console.log(`| Triangles par image | ${Math.round(result.trianglesPerFrame).toLocaleString('fr-FR')} |`);
  console.log(`| … dont la ville | ${Math.round(result.staticTriangles).toLocaleString('fr-FR')} |`);
  console.log('');
  console.log('| Garde-fou | Valeur | Attendu |');
  console.log('|---|---|---|');
  console.log(`| Fidèles | ${result.followers} (score ${result.faithful}) | — |`);
  console.log(`| Conversions | ${result.conversions} | > 0 |`);
  console.log(`| Étalement moyen du cortège | ${result.meanSpread.toFixed(1)} u | < 20 |`);
  console.log(`| Étalement maximal (traînard) | ${result.maxSpread.toFixed(1)} u | — |`);
  console.log(`| Fidèles superposés | ${(result.overlapRate * 100).toFixed(1)} % | < 10 % |`);
  console.log(`| Mortels dans un mur | ${result.mortalsInWalls} | 0 |`);
  console.log(`| Fidèles dans un mur | ${result.followersInWalls} | 0 |`);
}

function main(): void {
  console.log('# Banc de mesure — Divine City');
  console.log('');
  console.log(`Ville : graine ${CONFIG.city.seed} · ${CONFIG.mortals.count} mortels · écran ${SCREEN.width} × ${SCREEN.height}`);

  report(run('Partie réelle (cortège qui grandit)', 3600, 0));
  report(run('Pire cas (cortège plein)', 1800, CONFIG.retinue.maxSize));

  const missed = checkSeparationGrid();
  console.log('');
  console.log('### Correction de la grille de répulsion');
  console.log('');
  console.log(
    missed.length === 0
      ? 'Les 8 directions sont couvertes : le demi-voisinage n\'oublie aucune paire.'
      : `⚠️ Directions oubliées : ${missed.join(', ')}`,
  );
  console.log('');
}

main();
