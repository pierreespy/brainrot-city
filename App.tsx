/**
 * App.tsx — l'enveloppe Expo : le seul fichier qui connaît la plateforme.
 *
 * Son rôle est volontairement minuscule :
 *   1. afficher une surface de dessin 3D (GLView) ;
 *   2. créer le jeu dessus quand elle est prête ;
 *   3. poser le joystick et le HUD par-dessus.
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
import { Joystick } from './src/ui/Joystick';
import { Hud } from './src/ui/Hud';
import { Stats } from './src/ui/Stats';

export default function App() {
  const gameRef = useRef<Game | null>(null);
  const { width, height } = useWindowDimensions();

  // Le seul état React de l'app. Le jeu le pousse ici quand il change, au
  // plus 8 fois par seconde (voir `hud.scorePublishInterval`).
  const [faithful, setFaithful] = useState(0);
  const [district, setDistrict] = useState('');

  // L'affichage de debug (Milestone 7). Il n'est pas alimenté par le jeu : au
  // contraire, c'est LUI qui vient chercher les mesures, deux fois par
  // seconde, et seulement quand il est visible. Tant qu'il est éteint, il ne
  // coûte donc rigoureusement rien.
  const [showStats, setShowStats] = useState<boolean>(CONFIG.debug.showStats);
  const [stats, setStats] = useState<GameStats | null>(null);

  useEffect(() => {
    if (!showStats) {
      setStats(null);
      return;
    }
    const id = setInterval(() => {
      setStats(gameRef.current?.getStats() ?? null);
    }, CONFIG.profiler.publishInterval);
    return () => clearInterval(id);
  }, [showStats]);

  const onToggleStats = useCallback(() => setShowStats((visible) => !visible), []);

  // L'entrée existe AVANT le jeu : le joystick est donc utilisable dès la
  // première image, même si la surface 3D n'est pas encore initialisée.
  // (Motif « lazy ref » : on ne construit l'objet qu'une seule fois.)
  const inputRef = useRef<InputManager | null>(null);
  if (inputRef.current === null) inputRef.current = new InputManager();
  const input = inputRef.current;

  const onRestart = useCallback(() => {
    gameRef.current?.restart();
    setFaithful(0);
  }, []);

  const onContextCreate = useCallback((gl: ExpoWebGLRenderingContext) => {
    // Évite de recréer un second jeu si la surface est réinitialisée
    // (rechargement à chaud pendant le développement).
    gameRef.current?.dispose();

    const pixelRatio = PixelRatio.get();
    const { renderer, width: w, height: h, presentFrame } = createRenderer(gl, pixelRatio);

    const game = new Game(renderer, w, h, presentFrame, input);
    game.onFaithfulChange = setFaithful;
    game.onDistrictChange = setDistrict;
    gameRef.current = game;
    game.start();

    // Pratique pour déboguer et pour les tests automatisés sur le banc web.
    (globalThis as unknown as { game: Game }).game = game;
  }, [input]);

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

        {/* Le joystick écrit directement dans l'entrée du jeu. Il est posé
            AVANT le HUD pour que les boutons de celui-ci restent cliquables :
            en React Native, la dernière couche déclarée reçoit le doigt. */}
        <Joystick touch={input.touch} />

        <Hud
          faithful={faithful}
          district={district}
          onRestart={onRestart}
          onToggleStats={onToggleStats}
        />

        <Stats stats={stats} />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#12141c' },
});
