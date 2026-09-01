/**
 * main.ts — point d'entrée. Trouve le canvas, crée le jeu, le démarre.
 */

import { Game } from './core/Game';

const canvas = document.getElementById('game-canvas');
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("Canvas #game-canvas introuvable dans index.html");
}

const game = new Game(canvas);
game.start();

// Pratique pour déboguer : tape `game.restart()` dans la console du navigateur.
(window as unknown as { game: Game }).game = game;
