# assets/models

Les modèles 3D importés (dieux, foule, décor) — par opposition à la
géométrie procédurale du jeu (capsules, boîtes, cylindres colorés) qui reste
générée en code. Voir `src/core/AssetLoader.ts` pour le chargement, et le
pipeline complet dans `UNIVERS.md` (M14, M40).

Ce dossier est **empaqueté par Metro**, comme `assets/wallpaper.jpg` : tout
ce qui est déposé ici part dans l'app. Les fichiers de travail (exports
bruts, itérations non retenues, concept art) vont dans `images/`, jamais ici.

## Format

**`.glb` uniquement** — binaire, texture embarquée, lu nativement par
`GLTFLoader` (three.js). Pas de `.gltf` + `.bin` + textures séparés : ça
complique le bundling pour un gain nul ici.

## Dossiers

| Dossier | Contenu | Convention de nom |
|---|---|---|
| `gods/` | Un modèle par dieu, joué en solo (1 seule instance affichée) | `<GodId>.glb` — voir `src/entities/gods/roster.ts` (`hermes.glb`, `zeus.glb`, …) |
| `crowd/` | Silhouettes de mortels/cortège, **instanciées par milliers** | `<type>.glb` — un type par silhouette (`citizen.glb`, `hoplite.glb`…) |
| `city/` | Décor non collidant (statues, ornements) — la ville elle-même reste procédurale (`src/world/City.ts`) | libre, descriptif |

## Budget (voir le plan d'intégration pour le détail)

- **`gods/`** : le seul mesh « haut détail » du jeu — quelques milliers de
  triangles (~3-8k) acceptables, texture 512-1024px.
- **`crowd/`** : affiché par milliers d'instances simultanées → 200-500
  triangles **maximum** par silhouette, texture unique ou couleurs plates
  (`vertexColors`/`instanceColor`, comme les primitives actuelles). Une
  texture par instance ou un matériau par instance multiplierait les draw
  calls — à éviter absolument.
- Échelle du modèle normalisée à **1** dans son propre espace à l'export
  (voir la note sur l'échelle dans `src/core/instancing.ts`).

Valider tout ajout avec `npm run bench` (`GameStats.triangles`) avant/après.
