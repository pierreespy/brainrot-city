/**
 * createRenderer.ts — le pont entre Expo et Three.js.
 *
 * C'est LE seul fichier vraiment technique de l'app, et tu n'auras jamais
 * besoin d'y toucher. Voici le problème qu'il résout :
 *
 * Three.js a été écrit pour le web. Il s'attend à recevoir un élément
 * <canvas> de navigateur, et il appelle dessus des méthodes comme
 * `addEventListener` ou `clientWidth`. Sur téléphone, il n'y a pas de
 * navigateur : expo-gl nous donne juste un contexte OpenGL brut.
 *
 * La solution est un "shim" (une cale) : un faux objet canvas qui possède
 * exactement les propriétés que Three.js va chercher. Three.js est content,
 * dessine normalement, et le résultat part sur le GPU du téléphone.
 */

import * as THREE from 'three';
import type { ExpoWebGLRenderingContext } from 'expo-gl';
import { CONFIG } from '../config';

export interface RendererSetup {
  renderer: THREE.WebGLRenderer;
  width: number;
  height: number;
  /**
   * À appeler après chaque rendu sur mobile : c'est ce qui envoie réellement
   * l'image à l'écran. N'existe pas sur le web, d'où la vérification.
   */
  presentFrame: () => void;
}

export function createRenderer(
  gl: ExpoWebGLRenderingContext,
  pixelRatio: number,
): RendererSetup {
  const width = gl.drawingBufferWidth;
  const height = gl.drawingBufferHeight;

  // Le faux canvas décrit plus haut. On ment à Three.js, mais poliment.
  const canvasShim = {
    width,
    height,
    clientWidth: width,
    clientHeight: height,
    style: {},
    addEventListener: () => {},
    removeEventListener: () => {},
    getContext: () => gl,
  } as unknown as HTMLCanvasElement;

  // ⚠️ expo-gl installe un global `WebGLRenderingContext` (nom hérité de
  // avant son passage à WebGL2), et le contexte qu'il donne EST une
  // instance de ce global — alors qu'il implémente déjà l'API WebGL2
  // (`ExpoWebGLRenderingContext extends WebGL2RenderingContext`). Depuis la
  // r163, Three.js refuse tout `context` reconnu comme `WebGLRenderingContext`,
  // sans vérifier ce qu'il sait réellement faire. On efface ce global, rien
  // que le temps de construire le renderer, pour ne pas déclencher ce faux
  // positif — le contexte, lui, ne change pas.
  const legacyWebGL1Global = (globalThis as { WebGLRenderingContext?: unknown })
    .WebGLRenderingContext;
  delete (globalThis as { WebGLRenderingContext?: unknown }).WebGLRenderingContext;

  const renderer = new THREE.WebGLRenderer({
    canvas: canvasShim,
    context: gl as unknown as WebGLRenderingContext,
    // Coupé par défaut : l'anticrénelage fait travailler le GPU sur chaque
    // pixel, et les écrans de téléphone sont assez denses pour s'en passer.
    antialias: CONFIG.render.antialias,
  });

  // On remet le global en place : seul le constructeur de Three.js avait
  // besoin de ne pas le voir, le reste de l'app (et le web, qui n'y touche
  // jamais) doit le retrouver intact.
  if (legacyWebGL1Global !== undefined) {
    (globalThis as { WebGLRenderingContext?: unknown }).WebGLRenderingContext =
      legacyWebGL1Global;
  }

  // drawingBufferWidth est DÉJÀ en pixels physiques. Si on laissait Three.js
  // appliquer en plus le pixelRatio, on rendrait 2 à 3 fois trop de pixels
  // et le jeu ramerait. On force donc 1 ici.
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);

  // Sur mobile, expo-gl fournit endFrameEXP. Sur le web, GLView utilise un
  // vrai <canvas> et cette méthode n'existe pas : on ne fait rien.
  const present =
    typeof gl.endFrameEXP === 'function' ? () => gl.endFrameEXP() : () => {};

  return {
    renderer,
    // Les dimensions rendues au joueur sont exprimées en points, pas en
    // pixels physiques : on divise pour que la caméra ait le bon ratio.
    width: width / pixelRatio,
    height: height / pixelRatio,
    presentFrame: present,
  };
}
