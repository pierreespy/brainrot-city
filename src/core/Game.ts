/**
 * Game.ts — le chef d'orchestre.
 *
 * C'est LE fichier à lire pour comprendre le jeu entier : la méthode
 * update() ci-dessous décrit, dans l'ordre, tout ce qui se passe en une frame.
 * Chaque milestone ajoutera une ligne ou deux ici, pas plus.
 *
 * Ce fichier est 100 % indépendant de la plateforme : il est identique sur
 * iOS, Android et web.
 */

import * as THREE from 'three';
import { GameScene } from './Scene';
import { Loop } from './Loop';
import { InputManager } from '../systems/input/InputManager';
import { CameraRig } from '../systems/CameraRig';
import { Player } from '../entities/Player';

export class Game {
  /**
   * L'entrée est CRÉÉE À L'EXTÉRIEUR et injectée ici.
   *
   * Pourquoi ? Parce que le joystick doit exister dès l'affichage de l'app,
   * alors que le jeu, lui, n'est créé qu'une fois la surface 3D prête. En
   * les séparant, le joystick a toujours quelque chose où écrire.
   */
  readonly input: InputManager;

  private readonly gameScene: GameScene;
  private readonly cameraRig: CameraRig;
  private readonly player: Player;
  private readonly loop: Loop;
  private readonly presentFrame: () => void;

  constructor(
    renderer: THREE.WebGLRenderer,
    width: number,
    height: number,
    presentFrame: () => void,
    input: InputManager,
  ) {
    this.input = input;
    this.presentFrame = presentFrame;
    this.gameScene = new GameScene(renderer, width, height);
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
    // 1. Que veut le joueur ? (joystick sur mobile, clavier sur le banc web)
    const intent = this.input.getMoveIntent();

    // 2. Déplacer le joueur.
    this.player.update(intent, deltaTime);

    // --- Milestone 3 : this.npcs.update(deltaTime)
    // --- Milestone 4 : this.recruitment.update()
    // --- Milestone 5 : this.crowd.update(deltaTime)

    // 3. Suivre avec la caméra.
    this.cameraRig.update(this.player.position.x, this.player.position.y, deltaTime);

    // 4. Dessiner, puis envoyer l'image à l'écran du téléphone.
    this.gameScene.render();
    this.presentFrame();
  }

  resize(width: number, height: number): void {
    this.gameScene.resize(width, height);
  }

  /** Remet la partie à zéro (sera branché sur le bouton en Milestone 6). */
  restart(): void {
    this.player.reset();
    this.cameraRig.snapTo(this.player.position.x, this.player.position.y);
  }

  /** Position du joueur — pratique pour les tests automatisés. */
  getPlayerPosition(): { x: number; z: number } {
    return { x: this.player.position.x, z: this.player.position.y };
  }

  /**
   * On ne libère PAS `input` ici : il ne nous appartient pas, il survit au
   * jeu (rechargement à chaud, changement de taille d'écran).
   */
  dispose(): void {
    this.loop.stop();
    this.gameScene.dispose();
  }
}
