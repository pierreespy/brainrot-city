/**
 * Conversion.ts — le contact qui fait grandir le cortège.
 *
 * Ce système ne contient presque rien, et c'est voulu : il ne fait que
 * brancher deux mondes qui s'ignorent. Le vivier de mortels ne connaît pas le
 * cortège ; le cortège ne sait pas d'où viennent ses fidèles. Ce fichier est
 * le seul endroit où les deux se rencontrent.
 *
 * C'est aussi ici que viendront se greffer les capacités divines qui
 * convertissent (la Foudre de Zeus, le Charme d'Aphrodite) : elles ne feront
 * que changer le rayon ou le point de conversion.
 */

import { CONFIG } from '../config';
import type { Mortals } from '../entities/Mortals';
import type { Retinue } from '../entities/Retinue';

export class Conversion {
  private readonly mortals: Mortals;
  private readonly retinue: Retinue;

  constructor(mortals: Mortals, retinue: Retinue) {
    this.mortals = mortals;
    this.retinue = retinue;
  }

  /**
   * @param x/z    position de la divinité
   * @param radius rayon de conversion — la capacité divine le fera varier
   * @returns le nombre de mortels convertis pendant cette frame
   */
  update(x: number, z: number, radius = CONFIG.conversion.radius): number {
    const taken = this.mortals.takeNear(x, z, radius);
    for (const type of taken) {
      this.retinue.add(type, x, z);
    }
    return taken.length;
  }
}
