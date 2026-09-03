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

  // ⚠️ expo-gl fait hériter son `WebGL2RenderingContext` de son
  // `WebGLRenderingContext` (« pour coller au spec »), donc `gl instanceof
  // WebGLRenderingContext` vaut TRUE même pour un contexte WebGL2 — voir le
  // CHANGELOG d'expo-gl. Depuis la r163, Three.js refuse justement tout
  // `context` reconnu comme tel, sans vérifier ce qu'il sait réellement
  // faire. Une première version de ce fichier essayait d'effacer le global
  // `WebGLRenderingContext` juste avant : ça n'a pas suffi sur téléphone —
  // vraisemblablement installé non configurable, contrairement à un simple
  // objet JS.
  //
  // Le contournement qui tient, cette fois : cacher la chaîne de
  // prototypes plutôt que le global. Un Proxy dont `getPrototypeOf` ment
  // fait échouer l'`instanceof` (c'est exactement lui que `instanceof`
  // interroge, quoi qu'il arrive au global), et chaque méthode est RELIÉE à
  // `gl`, l'objet natif d'origine — sinon les appels natifs, qui s'attendent
  // à recevoir `gl` comme `this`, casseraient en recevant le Proxy à la
  // place.
  //
  // ⚠️ Ce Proxy devient `_gl` À L'INTÉRIEUR de Three.js : c'est lui qui
  // encaisse CHAQUE appel WebGL de CHAQUE image, pas seulement la
  // construction. On met donc en cache les méthodes déjà liées — sans quoi
  // on créerait une fonction liée par appel de `gl.uniform...` ou
  // `gl.bindTexture`, des milliers de fois par seconde.
  const boundMethods = new Map<PropertyKey, (...args: unknown[]) => unknown>();
  const contextForThree = new Proxy(gl, {
    getPrototypeOf: () => Object.prototype,
    get: (target, prop) => {
      const value = Reflect.get(target, prop, target);
      if (typeof value !== 'function') return value;
      let bound = boundMethods.get(prop);
      if (bound === undefined) {
        bound = (value as (...args: unknown[]) => unknown).bind(target);
        boundMethods.set(prop, bound);
      }
      return bound;
    },
  });

  const renderer = new THREE.WebGLRenderer({
    canvas: canvasShim,
    context: contextForThree as unknown as WebGLRenderingContext,
    // Coupé par défaut : l'anticrénelage fait travailler le GPU sur chaque
    // pixel, et les écrans de téléphone sont assez denses pour s'en passer.
    antialias: CONFIG.render.antialias,
  });

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
