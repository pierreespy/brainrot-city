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

import { useCallback, useRef } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl';
import { PixelRatio } from 'react-native';

import { Game } from './src/core/Game';
import { createRenderer } from './src/core/createRenderer';
import { InputManager } from './src/systems/input/InputManager';
import { Joystick } from './src/ui/Joystick';

export default function App() {
  const gameRef = useRef<Game | null>(null);
  const { width, height } = useWindowDimensions();

  // L'entrée existe AVANT le jeu : le joystick est donc utilisable dès la
  // première image, même si la surface 3D n'est pas encore initialisée.
  // (Motif « lazy ref » : on ne construit l'objet qu'une seule fois.)
  const inputRef = useRef<InputManager | null>(null);
  if (inputRef.current === null) inputRef.current = new InputManager();
  const input = inputRef.current;

  const onContextCreate = useCallback((gl: ExpoWebGLRenderingContext) => {
    // Évite de recréer un second jeu si la surface est réinitialisée
    // (rechargement à chaud pendant le développement).
    gameRef.current?.dispose();

    const pixelRatio = PixelRatio.get();
    const { renderer, width: w, height: h, presentFrame } = createRenderer(gl, pixelRatio);

    const game = new Game(renderer, w, h, presentFrame, input);
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
        />

        {/* Couche d'interface, posée par-dessus la 3D. */}
        <SafeAreaView style={styles.hud} pointerEvents="box-none">
          <View style={styles.panel} pointerEvents="none">
            <Text style={styles.title}>Olympus</Text>
            <Text style={styles.hint}>
              Glisse ton doigt en bas de l&apos;écran pour te déplacer
            </Text>
          </View>
        </SafeAreaView>

        {/* Le joystick écrit directement dans l'entrée du jeu. */}
        <Joystick touch={input.touch} />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#12141c' },
  hud: { ...StyleSheet.absoluteFillObject },
  panel: {
    alignSelf: 'flex-start',
    margin: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  title: { color: '#fff', fontSize: 15, fontWeight: '700' },
  hint: { color: 'rgba(255, 255, 255, 0.75)', fontSize: 12, marginTop: 3 },
});
