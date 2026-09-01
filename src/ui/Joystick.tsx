/**
 * Joystick.tsx — le joystick virtuel tactile.
 *
 * Fonctionnement : on pose le doigt n'importe où dans la zone du bas, un
 * joystick apparaît sous le doigt. On glisse dans une direction, le
 * personnage y va. On lève le doigt, il s'arrête.
 *
 * Ce composant ne fait QUE traduire un geste en direction (x, z). Il ne sait
 * rien du jeu : il écrit dans `TouchInput`, et c'est tout.
 */

import { useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import type { TouchInput } from '../systems/input/TouchInput';
import { CONFIG } from '../config';

interface Props {
  touch: TouchInput;
}

/** Position du doigt et du centre, en points, pour dessiner le joystick. */
interface Knob {
  originX: number;
  originY: number;
  dx: number;
  dy: number;
}

export function Joystick({ touch }: Props) {
  const [knob, setKnob] = useState<Knob | null>(null);
  // useRef plutôt que useState : on veut lire cette valeur pendant le geste
  // sans provoquer de re-rendu à chaque micro-mouvement du doigt.
  const origin = useRef({ x: 0, y: 0 });

  const { radius, deadZone } = CONFIG.joystick;

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (event) => {
        const { locationX, locationY } = event.nativeEvent;
        origin.current = { x: locationX, y: locationY };
        setKnob({ originX: locationX, originY: locationY, dx: 0, dy: 0 });
      },

      onPanResponderMove: (_event, gesture) => {
        // On borne le déplacement au rayon du joystick : au-delà, la
        // direction reste la même et l'intensité est déjà au maximum.
        const distance = Math.hypot(gesture.dx, gesture.dy);
        const scale = distance > radius ? radius / distance : 1;
        const dx = gesture.dx * scale;
        const dy = gesture.dy * scale;

        setKnob({
          originX: origin.current.x,
          originY: origin.current.y,
          dx,
          dy,
        });

        // Zone morte : sous ce seuil on considère que le doigt n'a pas
        // vraiment bougé. Sans elle, le personnage tremblote sur place.
        if (distance < deadZone) {
          touch.clear();
          return;
        }

        // On divise par le rayon pour obtenir une valeur entre -1 et 1.
        // L'axe Y de l'écran (vers le bas) correspond à l'axe Z du monde 3D.
        touch.setIntent(dx / radius, dy / radius);
      },

      onPanResponderRelease: () => {
        touch.clear();
        setKnob(null);
      },
      onPanResponderTerminate: () => {
        touch.clear();
        setKnob(null);
      },
    }),
  ).current;

  return (
    <View style={styles.zone} {...responder.panHandlers}>
      {knob && (
        <>
          <View
            pointerEvents="none"
            style={[
              styles.base,
              {
                left: knob.originX - radius,
                top: knob.originY - radius,
                width: radius * 2,
                height: radius * 2,
                borderRadius: radius,
              },
            ]}
          />
          <View
            pointerEvents="none"
            style={[
              styles.knob,
              {
                left: knob.originX + knob.dx - radius / 2.5,
                top: knob.originY + knob.dy - radius / 2.5,
                width: (radius / 2.5) * 2,
                height: (radius / 2.5) * 2,
                borderRadius: radius / 2.5,
              },
            ]}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  /** Toute la moitié basse de l'écran est tactile : pas besoin de viser. */
  zone: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
  },
  base: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  knob: {
    position: 'absolute',
    backgroundColor: 'rgba(74, 222, 128, 0.85)',
  },
});
