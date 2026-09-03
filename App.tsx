/**
 * App.tsx — l'enveloppe Expo : le seul fichier qui connaît la plateforme.
 *
 * Son rôle reste volontairement mince :
 *   1. tenir la surface de dessin 3D (GLView) et le jeu posé dessus ;
 *   2. décider de ce qu'on regarde — le MENU ou la PARTIE ;
 *   3. faire passer la progression (drachmes, dieux, parures) de l'un à l'autre.
 *
 * ⚠️ La surface 3D reste MONTÉE quand le menu est affiché ; seule la boucle
 * de jeu s'arrête (`game.pause()`). Démonter la GLView détruirait le contexte
 * graphique, et il faudrait reconstruire la ville et ses quatre cent
 * cinquante mortels à chaque aller-retour vers le magasin. Le menu, opaque,
 * la recouvre entièrement.
 *
 * Tout le reste du jeu vit dans src/ et ignore totalement React Native.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl';
import { PixelRatio } from 'react-native';

import { CONFIG } from './src/config';
import { Game, type GameStats } from './src/core/Game';
import { createRenderer } from './src/core/createRenderer';
import { InputManager } from './src/systems/input/InputManager';
import { godById } from './src/entities/gods/roster';
import { appearanceOf } from './src/meta/progression';
import { useProgression } from './src/meta/useProgression';
import { Joystick } from './src/ui/Joystick';
import { Hud } from './src/ui/Hud';
import { Stats } from './src/ui/Stats';
import { MenuScreen } from './src/ui/menu/MenuScreen';

export default function App() {
  const gameRef = useRef<Game | null>(null);
  const { width, height } = useWindowDimensions();

  /** Ce que le joueur regarde. Le jeu tourne uniquement en `partie`. */
  const [screen, setScreen] = useState<'menu' | 'partie'>('menu');

  // La même information, lisible depuis une fonction qui ne doit PAS changer
  // d'identité (voir `onContextCreate`). Sans elle, une rotation d'écran en
  // pleine partie recréerait le jeu... et le mettrait en pause.
  const screenRef = useRef(screen);
  screenRef.current = screen;

  const progression = useProgression();

  // Le seul état React de l'app pendant la partie. Le jeu le pousse ici quand
  // il change, au plus 8 fois par seconde (voir `hud.scorePublishInterval`).
  const [faithful, setFaithful] = useState(0);
  const [district, setDistrict] = useState('');

  // L'affichage de debug (Milestone 7). Il n'est pas alimenté par le jeu : au
  // contraire, c'est LUI qui vient chercher les mesures, deux fois par
  // seconde, et seulement quand il est visible. Tant qu'il est éteint, il ne
  // coûte donc rigoureusement rien.
  const [showStats, setShowStats] = useState<boolean>(CONFIG.debug.showStats);
  const [stats, setStats] = useState<GameStats | null>(null);

  useEffect(() => {
    if (!showStats || screen !== 'partie') {
      setStats(null);
      return;
    }
    const id = setInterval(() => {
      setStats(gameRef.current?.getStats() ?? null);
    }, CONFIG.profiler.publishInterval);
    return () => clearInterval(id);
  }, [showStats, screen]);

  // L'entrée existe AVANT le jeu : le joystick est donc utilisable dès la
  // première image, même si la surface 3D n'est pas encore initialisée.
  // (Motif « lazy ref » : on ne construit l'objet qu'une seule fois.)
  const inputRef = useRef<InputManager | null>(null);
  if (inputRef.current === null) inputRef.current = new InputManager();
  const input = inputRef.current;

  /**
   * Habille le jeu du dieu et de la parure choisis au menu.
   *
   * Appelé au lancement d'une partie plutôt qu'à chaque achat : changer de
   * parure pendant qu'on court ferait clignoter le cortège, et personne ne
   * demande cela.
   */
  const applyLoadout = useCallback(() => {
    const game = gameRef.current;
    if (game === null) return;
    const { color, accent } = appearanceOf(progression.state);
    game.setGod(godById(progression.state.selectedGod));
    game.setAppearance(color, accent);
  }, [progression.state]);

  const onPlay = useCallback(() => {
    const game = gameRef.current;
    setFaithful(0);
    setDistrict('');
    setScreen('partie');
    if (game === null) return;
    applyLoadout();
    game.restart();
    game.resume();
  }, [applyLoadout]);

  /**
   * Fin de partie : le cortège devient des drachmes, et le menu revient.
   *
   * ⚠️ On encaisse ici, et nulle part ailleurs. Créditer au fil des
   * conversions obligerait à écrire la sauvegarde en pleine boucle de jeu.
   */
  const onQuit = useCallback(() => {
    gameRef.current?.pause();
    progression.finishRun(gameRef.current?.getFaithfulCount() ?? faithful);
    setScreen('menu');
  }, [faithful, progression]);

  const onRestart = useCallback(() => {
    gameRef.current?.restart();
    setFaithful(0);
  }, []);

  const onToggleStats = useCallback(() => setShowStats((visible) => !visible), []);

  const onContextCreate = useCallback(
    (gl: ExpoWebGLRenderingContext) => {
      // Évite de recréer un second jeu si la surface est réinitialisée
      // (rechargement à chaud pendant le développement).
      gameRef.current?.dispose();

      const pixelRatio = PixelRatio.get();
      const { renderer, width: w, height: h, presentFrame } = createRenderer(gl, pixelRatio);

      const game = new Game(renderer, w, h, presentFrame, input);
      game.onFaithfulChange = setFaithful;
      game.onDistrictChange = setDistrict;
      gameRef.current = game;

      // La boucle ne démarre QUE si une partie est en cours. Au premier
      // lancement on est au menu : la ville est construite, prête, et
      // n'avance pas.
      game.start();
      if (screenRef.current === 'menu') game.pause();

      // Pratique pour déboguer et pour les tests automatisés sur le banc web.
      (globalThis as unknown as { game: Game }).game = game;
    },
    // Une seule dépendance, à dessein : cette fonction ne doit pas changer
    // d'identité, sinon la GLView recréerait son contexte à chaque
    // aller-retour vers le menu. D'où le `screenRef` ci-dessus.
    [input],
  );

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <StatusBar style="light" />

        {/* La surface 3D. `key` force une recréation propre si l'écran
            change de taille (rotation du téléphone). */}
        <GLView
          key={`${Math.round(width)}x${Math.round(height)}`}
          style={StyleSheet.absoluteFill}
          onContextCreate={onContextCreate}
          // ⚠️ Réglage MOBILE que le banc de test web ne peut pas montrer :
          // sur iOS, GLView applique par défaut un anticrénelage matériel à
          // 4 échantillons, qui fait travailler le GPU sur chaque pixel d'un
          // écran déjà très dense. On le coupe.
          msaaSamples={0}
        />

        {screen === 'partie' ? (
          <>
            {/* Le joystick écrit directement dans l'entrée du jeu. Il est posé
                AVANT le HUD pour que les boutons de celui-ci restent cliquables :
                en React Native, la dernière couche déclarée reçoit le doigt. */}
            <Joystick touch={input.touch} />

            <Hud
              faithful={faithful}
              district={district}
              onRestart={onRestart}
              onQuit={onQuit}
              onToggleStats={onToggleStats}
            />

            <Stats stats={stats} />
          </>
        ) : (
          <View style={StyleSheet.absoluteFill}>
            <MenuScreen
              state={progression.state}
              onPlay={onPlay}
              onBuyGod={progression.buyGod}
              onBuySkin={progression.buySkin}
              onSelectGod={progression.selectGod}
              onEquipSkin={progression.equipSkin}
              onResetProgression={progression.reset}
              showStats={showStats}
              onToggleStats={setShowStats}
            />
          </View>
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#12141c' },
});
