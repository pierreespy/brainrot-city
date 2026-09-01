/**
 * Game.ts — le chef d'orchestre.
 *
 * C'est LE fichier à lire pour comprendre le jeu entier : la méthode
 * update() ci-dessous décrit, dans l'ordre, tout ce qui se passe en une frame.
 * Chaque milestone ajoutera une ligne ou deux ici, pas plus.
 */

import { GameScene } from './Scene';
import { Loop } from './Loop';
import { Input } from '../systems/Input';
import { CameraRig } from '../systems/CameraRig';
import { Player } from '../entities/Player';

export class Game {
  private readonly gameScene: GameScene;
  private readonly input: Input;
  private readonly cameraRig: CameraRig;
  private readonly player: Player;
  private readonly loop: Loop;

  constructor(canvas: HTMLCanvasElement) {
    this.gameScene = new GameScene(canvas);
    this.input = new Input();
    this.cameraRig = new CameraRig(this.gameScene.camera);
    this.player = new Player(this.gameScene.scene);

    this.cameraRig.snapTo(this.player.position.x, this.player.position.y);

    this.loop = new Loop((deltaTime) => this.update(deltaTime));
  }

  start(): void {
    this.loop.start();
  }

  /** Une frame de jeu, du début à la fin. */
  private update(deltaTime: number): void {
    // 1. Que veut le joueur ?
    const intent = this.input.getMoveIntent();

    // 2. Déplacer le joueur.
    this.player.update(intent, deltaTime);

    // --- Milestone 3 : this.npcs.update(deltaTime)
    // --- Milestone 4 : this.recruitment.update()
    // --- Milestone 5 : this.crowd.update(deltaTime)

    // 3. Suivre avec la caméra.
    this.cameraRig.update(this.player.position.x, this.player.position.y, deltaTime);

    // 4. Dessiner.
    this.gameScene.render();
  }

  /** Remet la partie à zéro (sera branché sur le bouton en Milestone 6). */
  restart(): void {
    this.player.reset();
    this.cameraRig.snapTo(this.player.position.x, this.player.position.y);
  }

  dispose(): void {
    this.loop.stop();
    this.input.dispose();
    this.gameScene.dispose();
  }
}
