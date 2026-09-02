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
import { CONFIG } from '../config';
import { GameScene } from './Scene';
import { Loop } from './Loop';
import { InputManager } from '../systems/input/InputManager';
import { CameraRig } from '../systems/CameraRig';
import { Player } from '../entities/Player';
import { City } from '../world/City';
import { Mortals } from '../entities/Mortals';

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
  private readonly city: City;
  private readonly cameraRig: CameraRig;
  private readonly player: Player;
  private readonly mortals: Mortals;
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
    // La ville est construite AVANT le joueur : c'est elle qui lui dit
    // contre quoi il bute.
    this.city = new City(this.gameScene.scene);
    this.cameraRig = new CameraRig(this.gameScene.camera);
    this.player = new Player(this.gameScene.scene, this.city);
    // Les mortels naissent dans les rues : ils ont besoin de la ville pour
    // savoir où elle n'est pas.
    this.mortals = new Mortals(this.gameScene.scene, this.city);

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

    // 3. Faire vivre les mortels.
    this.mortals.update(deltaTime);

    // --- Milestone 4  : this.conversion.update()          (recrutement au contact)
    // --- Milestone 5  : this.retinue.update(deltaTime)    (le cortège)
    // --- Milestone 10 : this.ability.update(deltaTime)    (la capacité divine)
    //     Thème et contenu : voir UNIVERS.md

    // 4. Suivre avec la caméra, en visant un peu devant le joueur.
    const { speed } = CONFIG.player;
    this.cameraRig.update(
      this.player.position.x,
      this.player.position.y,
      deltaTime,
      this.player.velocity.x / speed,
      this.player.velocity.y / speed,
    );

    // 5. Dessiner, puis envoyer l'image à l'écran du téléphone.
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

  /** Les mortels — exposés pour le banc de test automatisé. */
  getMortalCount(): number {
    return this.mortals.count;
  }

  getMortalPositions(): { x: number; z: number }[] {
    return this.mortals.getPositions();
  }

  /** Combien de mortels sont dans un immeuble. Doit toujours valoir 0. */
  countMortalsInsideBuildings(): number {
    return this.mortals.countInsideBuildings();
  }

  /** Nombre d'immeubles générés — pratique pour les tests automatisés. */
  getBuildingCount(): number {
    return this.city.obstacles.length;
  }

  /**
   * Vrai si le joueur se retrouve DANS un immeuble — ne doit jamais arriver.
   * Sert au banc de test automatisé (marge de 10 % pour tolérer le contact).
   */
  isPlayerInsideBuilding(): boolean {
    return !this.city.isFree(
      this.player.position.x,
      this.player.position.y,
      CONFIG.player.radius * 0.9,
    );
  }

  /** Position de la caméra — pratique pour les tests automatisés. */
  getCameraPosition(): { x: number; y: number; z: number } {
    const c = this.gameScene.camera.position;
    return { x: c.x, y: c.y, z: c.z };
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
    this.mortals.dispose();
    this.city.dispose();
    this.gameScene.dispose();
  }
}
