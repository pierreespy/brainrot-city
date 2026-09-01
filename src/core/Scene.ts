/**
 * Scene.ts — le "décor technique" : ce qu'on voit, mais qui ne bouge pas.
 * Renderer, scène, lumières, sol.
 */

import * as THREE from 'three';
import { CONFIG } from '../config';

export class GameScene {
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;

  private readonly canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x12141c);
    // Le brouillard cache le bord du monde et allègera le rendu lointain.
    this.scene.fog = new THREE.Fog(0x12141c, 60, 160);

    this.camera = new THREE.PerspectiveCamera(CONFIG.camera.fov, 1, 0.1, 400);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    // Sur mobile, un devicePixelRatio de 3 triplerait le nombre de pixels à
    // calculer pour un gain visuel minime. On plafonne à 2.
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = false; // Milestone 1 : pas d'ombres, c'est coûteux.

    this.addLights();
    this.addGround();
    this.resize();

    window.addEventListener('resize', this.resize);
  }

  private addLights(): void {
    // Lumière ambiante : éclaire tout uniformément, évite les zones noires.
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.75));

    // Lumière directionnelle : simule le soleil, donne du relief aux volumes.
    const sun = new THREE.DirectionalLight(0xffffff, 1.1);
    sun.position.set(30, 60, 20);
    this.scene.add(sun);
  }

  private addGround(): void {
    const size = CONFIG.world.halfSize * 2;
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(size, size),
      new THREE.MeshLambertMaterial({ color: CONFIG.world.groundColor }),
    );
    // Un plan est vertical par défaut ; on le couche à l'horizontale.
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);

    // Grille de repère : indispensable pour SENTIR le déplacement quand la
    // ville n'existe pas encore. Elle disparaîtra en Milestone 2.
    const grid = new THREE.GridHelper(size, size / 4, 0x5a638c, 0x3d4560);
    grid.position.y = 0.01; // Légèrement au-dessus du sol pour éviter le clignotement.
    this.scene.add(grid);
  }

  private readonly resize = (): void => {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  };

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    window.removeEventListener('resize', this.resize);
    this.renderer.dispose();
  }
}
