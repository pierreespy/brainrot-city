/**
 * Population.ts — le contrat de « où naissent les mortels ».
 *
 * Même idée que `Collider` juste à côté : le vivier de mortels ne sait pas ce
 * qu'est un quartier, ni même une cité. Il demande seulement « donne-moi un
 * endroit où quelqu'un pourrait habiter », et la cité répond selon son plan.
 *
 * C'est ce qui permet à `Mortals` de rester une boucle de chiffres, et à la
 * densité des quartiers de changer sans qu'il en sache rien.
 */

export interface Population {
  /**
   * Tire un point de la cité, pondéré par la densité de son quartier.
   *
   * Le point peut tomber dans un mur : c'est à l'appelant de vérifier et de
   * retirer. Écrit dans `out` plutôt que de renvoyer un objet, parce que
   * cette méthode est appelée des centaines de fois au lancement.
   */
  pickPopulatedSpot(random: () => number, out: { x: number; z: number }): void;
}
