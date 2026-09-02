/**
 * Scene.ts — le "décor technique" : ce qu'on voit, mais qui ne bouge pas.
 * Scène, lumières, sol.
 *
 * Note d'architecture : cette classe ne CRÉE plus le renderer, elle le
 * reçoit. C'est ce qui lui permet d'être identique sur iOS, Android et web —
 * seule l'enveloppe (App.tsx) sait sur quelle plateforme on tourne.
 */

import * as THREE from 'three';
import { CONFIG } from '../config';

export class GameScene {
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;

  constructor(renderer: THREE.WebGLRenderer, width: number, height: number) {
    this.renderer = renderer;
    this.renderer.shadowMap.enabled = false; // Coûteux, inutile à ce stade.

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x12141c);
    // Le brouillard cache le bord du monde et allègera le rendu lointain.
    // Il commence au-delà de ce que la caméra cadre, pour ne jamais voiler
    // les immeubles proches du joueur.
    this.scene.fog = new THREE.Fog(0x12141c, 70, 190);

    this.camera = new THREE.PerspectiveCamera(
      CONFIG.camera.fov,
      width / height,
      0.1,
      400,
    );

    this.addLights();
    this.addGround();
  }

  private addLights(): void {
    // Lumière ambiante : éclaire tout uniformément, évite les zones noires.
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    // Lumière directionnelle : simule le soleil, donne du relief aux volumes.
    // Inclinée : sans cela, les faces verticales des immeubles auraient
    // toutes la même teinte et la ville semblerait plate.
    const sun = new THREE.DirectionalLight(0xffffff, 1.1);
    sun.position.set(60, 90, 30);
    this.scene.add(sun);
  }

  private addGround(): void {
    // BIEN plus large que le monde jouable. La marge de 40 unités ne
    // suffisait pas : arrivé au bord de la cité, le joueur voyait le vide
    // au-delà du sol (constaté en capture). Le brouillard s'occupe de cacher
    // le lointain, et un plan de plus ne coûte rien.
    const size = CONFIG.world.halfSize * 2 + 300;
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(size, size),
      new THREE.MeshLambertMaterial({ color: CONFIG.world.groundColor }),
    );
    // Un plan est vertical par défaut ; on le couche à l'horizontale.
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);

    // Note : la grille de repère de la Milestone 1 a été retirée. Ce sont
    // maintenant les trottoirs et les bandes blanches de la ville
    // (`src/world/City.ts`) qui donnent la sensation de déplacement.
  }

  /** Appelé quand l'écran change de taille (rotation du téléphone, resize web). */
  resize(width: number, height: number): void {
    if (width === 0 || height === 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.renderer.dispose();
  }
}
