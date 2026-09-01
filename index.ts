/**
 * index.ts — point d'entrée de l'application Expo.
 *
 * `registerRootComponent` fait deux choses : il enregistre App comme
 * composant racine, et il configure l'environnement (que l'on tourne dans
 * Expo Go ou dans un build natif). C'est du code standard Expo, on n'y
 * touche jamais.
 */

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
