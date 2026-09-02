/**
 * Profiler.ts — combien coûte une image, étape par étape.
 *
 * C'est l'outil de la Milestone 7, et il vient AVANT les optimisations :
 * sans mesure, optimiser revient à deviner. Le journal du projet en garde la
 * trace — la grille de collision de la Milestone 2, réécrite pour ne plus
 * fabriquer de chaînes, n'a rien changé aux fps, parce que le coût était
 * ailleurs.
 *
 * L'usage tient en trois appels, dans `Game.update()` :
 *
 *   profiler.frameStart();
 *   ...déplacer le joueur...   profiler.mark('joueur');
 *   ...faire vivre les mortels... profiler.mark('mortels');
 *   profiler.frameEnd();
 *
 * `mark()` mesure le temps écoulé depuis le repère précédent : **un seul**
 * appel à l'horloge par étape, au lieu d'un début et d'une fin.
 *
 * Le coût du profileur lui-même : 8 lectures d'horloge par image, soit
 * quelques microsecondes. Il reste néanmoins débranchable (`enabled`), et il
 * n'alloue rien après la première image — un profileur qui fait travailler le
 * ramasse-miettes mesurerait surtout son propre bruit.
 */

/** Le coût d'une étape, moyenné sur la fenêtre de mesure. */
export interface ProfileStep {
  name: string;
  /** Millisecondes par image. */
  ms: number;
}

export interface ProfileSnapshot {
  /** Images par seconde, mesurées sur la fenêtre. */
  fps: number;
  /**
   * Durée réelle d'une image, du début de l'une au début de la suivante.
   *
   * Elle comprend ce que le navigateur ou le téléphone fait entre deux
   * images : dessiner réellement les pixels, attendre l'écran. C'est
   * l'écart entre cette valeur et `cpuMs` qui dit où est le goulot —
   * mesuré au banc web : 90 ms d'image pour 0,6 ms de calcul, autrement dit
   * un problème d'affichage et non de logique.
   */
  frameMs: number;
  /** Ce que NOTRE code consomme : la somme des étapes ci-dessous. */
  cpuMs: number;
  steps: ProfileStep[];
}

interface Accumulator {
  name: string;
  /** Somme des durées sur la fenêtre en cours. */
  total: number;
  /** Moyenne de la fenêtre précédente — c'est elle qu'on affiche. */
  average: number;
}

export class Profiler {
  /** Débranché = `mark()` retourne aussitôt, coût nul. */
  enabled: boolean;

  /** Nombre d'images agrégées avant de publier une moyenne. */
  private readonly window: number;

  /**
   * Les étapes, DANS L'ORDRE où elles sont marquées.
   *
   * On les retrouve par leur rang, pas par leur nom : la suite des appels est
   * la même à chaque image, donc un index suffit et aucune table de hachage
   * n'est interrogée 8 fois par image.
   */
  private readonly steps: Accumulator[] = [];
  private index = 0;

  private lastMark = 0;
  private framesInWindow = 0;
  private windowStart = 0;

  private frameAverage = 0;
  private cpuAverage = 0;
  private fps = 0;

  constructor(enabled = false, window = 60) {
    this.enabled = enabled;
    this.window = window;
  }

  frameStart(): void {
    if (!this.enabled) return;
    const now = performance.now();
    if (this.windowStart === 0) this.windowStart = now;
    this.lastMark = now;
    this.index = 0;
  }

  /** Referme l'étape en cours et lui impute le temps écoulé. */
  mark(name: string): void {
    if (!this.enabled) return;
    const now = performance.now();
    const elapsed = now - this.lastMark;
    this.lastMark = now;

    let step = this.steps[this.index];
    // Première image, ou suite d'appels modifiée : on (re)crée la ligne.
    if (step === undefined || step.name !== name) {
      step = { name, total: 0, average: 0 };
      this.steps[this.index] = step;
    }
    step.total += elapsed;
    this.index += 1;
  }

  frameEnd(): void {
    if (!this.enabled) return;
    this.framesInWindow += 1;
    if (this.framesInWindow < this.window) return;

    // Fin de fenêtre : on fige les moyennes et on repart de zéro.
    const now = performance.now();
    const frames = this.framesInWindow;

    let cpu = 0;
    for (const step of this.steps) {
      step.average = step.total / frames;
      cpu += step.average;
      step.total = 0;
    }
    this.cpuAverage = cpu;

    // La durée d'une image et les fps se lisent sur l'horloge MURALE, pas sur
    // la somme des étapes : entre deux images, il y a aussi tout ce que nous
    // ne faisons pas nous-mêmes — le dessin des pixels et l'attente de
    // l'écran. C'est justement ce qu'on veut voir.
    const elapsed = now - this.windowStart;
    this.frameAverage = elapsed / frames;
    this.fps = elapsed > 0 ? (frames * 1000) / elapsed : 0;

    this.framesInWindow = 0;
    this.windowStart = now;
  }

  /**
   * Les moyennes de la dernière fenêtre complète.
   *
   * Alloue — c'est voulu : on n'appelle ceci que quelques fois par seconde
   * (l'affichage de debug), jamais dans la boucle de jeu.
   */
  snapshot(): ProfileSnapshot {
    return {
      fps: this.fps,
      frameMs: this.frameAverage,
      cpuMs: this.cpuAverage,
      steps: this.steps.map((step) => ({ name: step.name, ms: step.average })),
    };
  }

  reset(): void {
    for (const step of this.steps) {
      step.total = 0;
      step.average = 0;
    }
    this.framesInWindow = 0;
    this.windowStart = 0;
    this.frameAverage = 0;
    this.cpuAverage = 0;
    this.fps = 0;
  }
}
