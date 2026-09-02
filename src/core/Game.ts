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
import { Retinue } from '../entities/Retinue';
import { Conversion } from '../systems/Conversion';
import { PlayerTrail } from '../systems/PlayerTrail';
import { ViewCulling } from '../systems/ViewCulling';
import { Profiler, type ProfileSnapshot } from './Profiler';
import { DISTRICTS } from '../world/districts';

/**
 * Ce que le jeu sait dire de sa propre performance — lu par l'affichage de
 * debug (Milestone 7) et par le banc de test.
 */
export interface GameStats {
  profile: ProfileSnapshot;
  /** Silhouettes envoyées au GPU, sur le total existant. */
  drawnMortals: number;
  mortals: number;
  drawnFollowers: number;
  followers: number;
  /**
   * Triangles réellement dessinés à la dernière image.
   *
   * Compté par Three.js lui-même (`renderer.info`), pas estimé par nous :
   * c'est le chiffre que le GPU a vraiment reçu, ville comprise.
   */
  triangles: number;
}

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
  private readonly retinue: Retinue;
  private readonly conversion: Conversion;
  private readonly trail: PlayerTrail;
  /** Le champ de la caméra : il décide de ce qu'on dessine et de ce qu'on simule. */
  private readonly culling: ViewCulling;
  /** Le coût d'une image, étape par étape. Voir `Profiler`. */
  private readonly profiler: Profiler;

  /**
   * Prévenue quand le score change — c'est le seul lien du jeu vers
   * l'interface, et il va dans ce sens uniquement : le jeu ne sait pas ce
   * qu'est un HUD, il annonce un nombre.
   */
  onFaithfulChange: ((faithful: number) => void) | null = null;

  /**
   * Prévenue quand le joueur change de quartier (Milestone 8).
   *
   * Elle annonce un **nom**, pas un quartier : le jeu ne sait pas plus ce
   * qu'est un HUD ici qu'ailleurs. C'est le remède au défaut relevé en
   * Milestone 2 — « on s'y perd et on ne mesure pas sa progression » : la
   * couleur du sol dit qu'on a changé d'endroit, ce nom dit lequel.
   */
  onDistrictChange: ((label: string) => void) | null = null;

  /** Dernier quartier annoncé, pour ne parler que quand ça change. */
  private publishedDistrict = '';

  /** Dernier score publié, et quand. Sert à ne pas inonder React. */
  private publishedFaithful = -1;
  private lastPublishTime = 0;
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
    this.retinue = new Retinue(this.gameScene.scene, this.city);
    this.conversion = new Conversion(this.mortals, this.retinue);
    // Le cortège suit le CHEMIN du dieu, pas sa position : c'est ce qui lui
    // fait contourner les immeubles au lieu de s'y coincer.
    this.trail = new PlayerTrail(this.player.position.x, this.player.position.y);
    this.culling = new ViewCulling(CONFIG.crowd.cullMargin);
    this.profiler = new Profiler(true, CONFIG.profiler.windowFrames);

    this.cameraRig.snapTo(this.player.position.x, this.player.position.y);

    this.loop = new Loop((deltaTime) => this.update(deltaTime));
  }

  start(): void {
    this.loop.start();
  }

  /** Une frame de jeu, du début à la fin. */
  private update(deltaTime: number): void {
    this.profiler.frameStart();

    // 1. Que veut le joueur ? (joystick sur mobile, clavier sur le banc web)
    const intent = this.input.getMoveIntent();

    // 2. Déplacer le joueur.
    this.player.update(intent, deltaTime);
    const { x, y: z } = this.player.position;
    this.profiler.mark('joueur');

    // 3. Suivre avec la caméra, en visant un peu devant le joueur, puis
    //    relever ce qu'elle cadre.
    //
    //    ⚠️ La caméra passe AVANT la foule depuis la Milestone 7 : c'est son
    //    champ qui décide des silhouettes à dessiner et à faire marcher. La
    //    calculer après reviendrait à trier avec le cadrage de l'image
    //    précédente. Elle ne lit que la position et la vitesse du joueur,
    //    toutes deux déjà à jour : le résultat est identique.
    const { speed } = CONFIG.player;
    this.cameraRig.update(
      x,
      z,
      deltaTime,
      this.player.velocity.x / speed,
      this.player.velocity.y / speed,
    );
    this.culling.refresh(this.gameScene.camera);
    this.profiler.mark('caméra');

    // 4. Faire vivre les mortels (ceux qu'on voit, surtout).
    this.mortals.update(deltaTime, this.culling);
    this.profiler.mark('mortels');

    // 5. Convertir les mortels au contact, puis faire suivre le cortège.
    this.trail.update(x, z);
    this.conversion.update(x, z);
    this.profiler.mark('conversion');

    this.retinue.update(deltaTime, x, z, this.trail, this.culling);
    this.profiler.mark('cortège');

    // --- Milestone 10 : this.ability.update(deltaTime)    (la capacité divine)
    //     Thème et contenu : voir UNIVERS.md

    // 6. Annoncer le score, s'il a changé et pas trop souvent.
    this.publishFaithful();
    this.publishDistrict(x, z);

    // 7. Dessiner, puis envoyer l'image à l'écran du téléphone.
    this.gameScene.render();
    this.presentFrame();
    this.profiler.mark('rendu');

    this.profiler.frameEnd();
  }

  /**
   * Annonce le quartier traversé.
   *
   * Pas de minuterie ici, contrairement au score : on ne change de quartier
   * qu'en marchant, soit quelques fois par minute. Le test d'égalité suffit
   * à ne réveiller React que pour de vrai.
   */
  private publishDistrict(x: number, z: number): void {
    if (this.onDistrictChange === null) return;
    const label = DISTRICTS[this.city.districtAt(x, z)].label;
    if (label === this.publishedDistrict) return;
    this.publishedDistrict = label;
    this.onDistrictChange(label);
  }

  /** Le quartier où se trouve le joueur — pour le banc de test. */
  getDistrict(): string {
    return DISTRICTS[
      this.city.districtAt(this.player.position.x, this.player.position.y)
    ].label;
  }

  /**
   * Ce que coûte une image, moyenné sur `profiler.windowFrames`.
   *
   * Lu quelques fois par seconde par l'affichage de debug, jamais dans la
   * boucle de jeu.
   */
  getStats(): GameStats {
    return {
      profile: this.profiler.snapshot(),
      drawnMortals: this.mortals.drawnCount,
      mortals: this.mortals.count,
      drawnFollowers: this.retinue.drawnCount,
      followers: this.retinue.size,
      triangles: this.gameScene.renderer.info.render.triangles,
    };
  }

  /**
   * Publie le score vers l'interface.
   *
   * Deux garde-fous : on ne publie que si le nombre a **changé**, et jamais
   * plus souvent que `hud.scorePublishInterval`. Sans eux, chaque image
   * déclencherait un rendu React, pour afficher le même nombre.
   */
  private publishFaithful(): void {
    if (this.onFaithfulChange === null) return;

    const faithful = this.retinue.faithfulCount;
    if (faithful === this.publishedFaithful) return;

    const now = performance.now();
    if (now - this.lastPublishTime < CONFIG.hud.scorePublishInterval) return;

    this.publishedFaithful = faithful;
    this.lastPublishTime = now;
    this.onFaithfulChange(faithful);
  }

  resize(width: number, height: number): void {
    this.gameScene.resize(width, height);
  }

  /** Remet la partie à zéro (sera branché sur le bouton en Milestone 6). */
  restart(): void {
    this.player.reset();
    this.retinue.clear();
    this.mortals.reset();
    this.trail.reset(this.player.position.x, this.player.position.y);
    // Le compteur doit retomber à zéro tout de suite, sans attendre le
    // prochain intervalle de publication.
    this.publishedFaithful = -1;
    this.publishedDistrict = '';
    this.lastPublishTime = 0;
    this.cameraRig.snapTo(this.player.position.x, this.player.position.y);
    this.profiler.reset();
  }

  /** Le score : le nombre de fidèles du cortège (affiché en Milestone 6). */
  getFaithfulCount(): number {
    return this.retinue.faithfulCount;
  }

  /** Les silhouettes réellement affichées derrière le joueur. */
  getRetinueSize(): number {
    return this.retinue.size;
  }

  getRetinuePositions(): { x: number; z: number }[] {
    return this.retinue.getPositions();
  }

  /** Combien de fidèles sont dans un immeuble. Doit toujours valoir 0. */
  countRetinueInsideBuildings(): number {
    return this.retinue
      .getPositions()
      .filter(({ x, z }) => !this.city.isFree(x, z, CONFIG.mortals.types.citizen.radius * 0.9))
      .length;
  }

  /** Les mortels — exposés pour le banc de test automatisé. */
  getMortalCount(): number {
    return this.mortals.count;
  }

  /** Combien de mortels sont réellement dessinés, sur les 450 vivants. */
  getDrawnMortalCount(): number {
    return this.mortals.drawnCount;
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
    this.retinue.dispose();
    this.city.dispose();
    this.gameScene.dispose();
  }
}
