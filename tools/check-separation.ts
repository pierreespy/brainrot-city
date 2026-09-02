/**
 * check-separation.ts — la grille de répulsion n'oublie-t-elle personne ?
 *
 * `Retinue.separationPass()` ne regarde que **cinq** cases autour d'un
 * fidèle — la sienne et quatre voisines « en avant » — au lieu des neuf qui
 * l'entourent. L'argument est que chaque paire de cases adjacentes se
 * rencontre alors exactement une fois : celle qu'on ne regarde pas nous
 * regardera.
 *
 * Un raisonnement de ce genre est juste… jusqu'à ce qu'il ne le soit plus, et
 * le symptôme serait discret : des fidèles qui se traversent dans une seule
 * direction. On le vérifie donc, plutôt que d'y croire — on pose deux fidèles
 * dans des cases voisines, dans les huit directions, et on exige qu'ils se
 * repoussent à chaque fois.
 */

import * as THREE from 'three';
import { CONFIG } from '../src/config';
import { City } from '../src/world/City';
import { Retinue } from '../src/entities/Retinue';

const DIRECTIONS: [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

/** @returns les directions dans lesquelles le contact a été manqué. */
export function checkSeparationGrid(): string[] {
  const scene = new THREE.Scene();
  const city = new City(scene);
  const separation = CONFIG.retinue.separation;
  const missed: string[] = [];

  for (const [dx, dz] of DIRECTIONS) {
    const retinue = new Retinue(scene, city);
    // On force les positions : `add()` disperse volontairement les nouveaux
    // venus, or ce test a besoin de placements exacts.
    const inner = retinue as unknown as {
      followers: { x: number; z: number }[];
      separationPass(): void;
    };
    retinue.add('citizen', 0, 0);
    retinue.add('citizen', 0, 0);

    // Le premier au centre d'une case, le second dans la case voisine mais à
    // 60 % de la distance de répulsion : ils doivent s'écarter.
    const base = 60 * separation + separation / 2;
    inner.followers[0].x = base;
    inner.followers[0].z = base;
    inner.followers[1].x = base + dx * separation * 0.6;
    inner.followers[1].z = base + dz * separation * 0.6;

    const beforeX = inner.followers[1].x;
    const beforeZ = inner.followers[1].z;
    inner.separationPass();

    const moved =
      Math.abs(inner.followers[1].x - beforeX) > 1e-9 ||
      Math.abs(inner.followers[1].z - beforeZ) > 1e-9;
    if (!moved) missed.push(`(${dx}, ${dz})`);

    retinue.dispose();
  }

  return missed;
}
