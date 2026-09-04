// metro.config.js — Metro ne bundle par défaut aucun format 3D.
//
// Les modèles des dieux et de la foule (`assets/models/**/*.glb`) doivent
// être chargeables via `require(...)` comme `assets/wallpaper.jpg` l'est
// déjà — sans ça, `require('../../assets/models/gods/hermes.glb')` échoue
// au bundling. `.gltf`/`.bin` sont ajoutés pour le format glTF non binaire,
// au cas où un asset de test n'est pas encore packagé en `.glb`.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('glb', 'gltf', 'bin');

module.exports = config;
