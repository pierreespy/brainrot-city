/**
 * Loop.ts — la boucle de jeu.
 *
 * Un jeu, c'est une fonction appelée ~60 fois par seconde. À chaque appel on
 * calcule le temps écoulé depuis la frame précédente (le "delta time") et on
 * fait avancer le monde de cette durée.
 */

export type TickCallback = (deltaTime: number) => void;

export class Loop {
  private readonly onTick: TickCallback;
  private lastTime = 0;
  private frameId = 0;
  private running = false;

  constructor(onTick: TickCallback) {
    this.onTick = onTick;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.frameId = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.frameId);
  }

  private readonly tick = (now: number): void => {
    if (!this.running) return;
    this.frameId = requestAnimationFrame(this.tick);

    // Si on change d'onglet, `now - lastTime` peut valoir plusieurs secondes.
    // Sans ce plafond à 0.1 s, le joueur se téléporterait au retour.
    const deltaTime = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    this.onTick(deltaTime);
  };
}
