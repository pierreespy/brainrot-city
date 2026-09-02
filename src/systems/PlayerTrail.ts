/**
 * PlayerTrail.ts — la trace laissée par la divinité.
 *
 * C'est la pièce qui résout les **traînards**. Jusqu'ici, chaque fidèle
 * visait la POSITION du joueur en ligne droite : quand un immeuble se
 * trouvait entre les deux, le fidèle poussait contre la façade et décrochait
 * (mesuré : jusqu'à 33 unités de retard).
 *
 * Un cortège ne doit pas viser où est son dieu, mais **repasser par où il est
 * passé**. On enregistre donc son chemin, et chaque fidèle vise un point situé
 * à N mètres derrière lui SUR CE CHEMIN. Le cortège emprunte alors les mêmes
 * rues, contourne les mêmes angles, et aucun mur ne se met en travers.
 *
 * C'est aussi ce qui donne au genre sa sensation de serpent qui ondule
 * derrière le joueur.
 */

import { CONFIG } from '../config';

export class PlayerTrail {
  /** Points du chemin, du plus ancien au plus récent. */
  private readonly xs: number[] = [];
  private readonly zs: number[] = [];
  /** Distance parcourue depuis le début de la partie, à chaque point. */
  private readonly travelled: number[] = [];

  /** Premier point encore valide : on ne rogne pas le tableau à chaque frame. */
  private start = 0;
  /** Distance totale parcourue par le joueur. */
  private total = 0;

  constructor(x: number, z: number) {
    this.push(x, z);
  }

  /** À appeler une fois par frame, avec la position du joueur. */
  update(x: number, z: number): void {
    const last = this.xs.length - 1;
    const step = Math.hypot(x - this.xs[last], z - this.zs[last]);

    // On n'enregistre pas chaque frame : un point tous les 35 cm suffit à
    // décrire le chemin, et le tableau reste court.
    if (step < CONFIG.retinue.trailPointSpacing) return;

    this.total += step;
    this.push(x, z);
    this.prune();
  }

  private push(x: number, z: number): void {
    this.xs.push(x);
    this.zs.push(z);
    this.travelled.push(this.total);
  }

  /**
   * Oublie le chemin trop ancien pour intéresser le dernier fidèle.
   *
   * On avance un curseur plutôt que de retirer les éléments un par un —
   * retirer en tête d'un tableau coûte cher — et on compacte de temps en
   * temps, quand le gâchis devient notable.
   */
  private prune(): void {
    const keep = CONFIG.retinue.trailMaxLength;
    while (
      this.start + 1 < this.xs.length &&
      this.total - this.travelled[this.start + 1] > keep
    ) {
      this.start += 1;
    }

    if (this.start > 512) {
      this.xs.splice(0, this.start);
      this.zs.splice(0, this.start);
      this.travelled.splice(0, this.start);
      this.start = 0;
    }
  }

  /**
   * Où était le joueur il y a `back` unités de chemin ?
   *
   * ⚠️ Le curseur `from` sert à enchaîner les appels : les fidèles étant
   * interrogés du plus proche au plus lointain, on parcourt le chemin **une
   * seule fois** pour tout le cortège au lieu d'une fois par fidèle.
   *
   * @returns la position, et l'indice où reprendre la recherche
   */
  sample(back: number, from: number, out: { x: number; z: number }): number {
    const targetDistance = this.total - back;

    let i = Math.min(from, this.xs.length - 1);
    while (i > this.start && this.travelled[i] > targetDistance) i -= 1;

    // Chemin plus court que demandé (début de partie) : on renvoie le point
    // le plus ancien connu, le fidèle s'y rendra en ligne droite.
    if (i <= this.start) {
      out.x = this.xs[this.start];
      out.z = this.zs[this.start];
      return this.start;
    }

    // Interpolation entre deux points, pour un rendu continu plutôt que
    // saccadé de 35 cm en 35 cm.
    const span = this.travelled[i + 1] - this.travelled[i];
    const t = span > 0 ? (targetDistance - this.travelled[i]) / span : 0;
    out.x = this.xs[i] + (this.xs[i + 1] - this.xs[i]) * t;
    out.z = this.zs[i] + (this.zs[i + 1] - this.zs[i]) * t;
    return i;
  }

  /** Longueur de chemin réellement disponible. */
  get length(): number {
    return this.total - this.travelled[this.start];
  }

  reset(x: number, z: number): void {
    this.xs.length = 0;
    this.zs.length = 0;
    this.travelled.length = 0;
    this.start = 0;
    this.total = 0;
    this.push(x, z);
  }
}
