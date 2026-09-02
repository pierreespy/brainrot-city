/**
 * Conversion.ts — le contact qui fait grandir le cortège.
 *
 * Un mortel est converti quand il est touché par **la divinité OU par un
 * fidèle déjà converti**. C'est ce second cas qui fait la boule de neige du
 * genre : plus le cortège est large, plus il ratisse.
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
    /**
     * Comparer 450 mortels à 600 fidèles ferait 270 000 tests par frame.
     *
     * On procède donc en deux temps. Le cortège reste groupé autour du
     * joueur : au-delà de son étalement (plus le rayon de conversion), aucun
     * fidèle ne peut toucher personne. Ce filtre grossier — une soustraction
     * par mortel — écarte la quasi-totalité de la cité, et seuls les rares
     * mortels qui le passent sont comparés aux fidèles un par un.
     */
    const reach = this.retinue.spreadRadius + radius;
    const reachSq = reach * reach;

    const taken = this.mortals.takeNear(x, z, radius, (mortalX, mortalZ) => {
      const dx = mortalX - x;
      const dz = mortalZ - z;
      if (dx * dx + dz * dz > reachSq) return false;
      return this.retinue.hasFollowerNear(mortalX, mortalZ, radius);
    });
    for (const type of taken) {
      this.retinue.add(type, x, z);
    }
    return taken.length;
  }
}
