# Audit des références graphiques — 24 octobre 2026

Sources publiques téléchargées dans `/tmp` et examinées avant la création du rendu. Aucun jeu tiers, asset ou module tiers n'a été copié dans le projet. Le moteur de simulation et les règles du brief restent indépendants de Phaser.

## 1. micro-racers

Dépôt : https://github.com/AlexanderBiba/micro-racers
Commit examiné : `b0c9a46ef21072a91c135d471ed09193e6c7d787`.

Fichiers examinés : `src/core/Path2.ts`, `src/art/textures.ts`, `src/race/Fx.ts`, `src/race/TrackRuntime.ts`, `package.json`, `README.md`.

- `Path2` échantillonne une spline Catmull-Rom, construit une table de longueurs cumulées et recherche une position par recherche binaire. Ses tangentes/normales servent également aux bordures et décors.
- `textures.ts` fabrique les surfaces avec Canvas et les voitures avec Graphics, puis les convertit en textures réutilisées.
- `Fx` recycle ses images et limite le nombre de particules. `TrackRuntime` sépare les couches et génère les surfaces depuis le même tracé.
- Stack directement compatible : Phaser 3.90, TypeScript 5.7, Vite 6. Les scènes doivent être montées/détruites par un composant React.
- Licence : aucun fichier LICENSE ni déclaration explicite de licence trouvé dans l'arbre suivi, le README ou le package. Le caractère public ne vaut pas autorisation de copie. Concepts uniquement ; implémentation originale.
- Mobile : précalcul et recyclage pertinents. Sa simulation 120 Hz, ses collisions, objets interactifs et caméra dynamique seraient des coûts inutiles ici. Pas de mesure physique sur smartphone effectuée sur ce dépôt.

Retenu : tracé unique, abscisse curviligne, génération des textures au démarrage. Non retenu : physique, pilotage, collisions, caméra de poursuite, objets et raccourcis.

## 2. hotwheels

Dépôt : https://github.com/itsbirdo/hotwheels
Commit examiné : `d7dbaee870b50afde252f9f659de619977bd39b0`.

Fichiers examinés : `src/sprites/SpriteGenerator.js`, `src/track/TrackRenderer.js`, `src/entities/PlayerCar.js`, `package.json`, `README.md`.

- Générateur de voitures à partir de roues, carrosserie, bandes, vitrages et feux ; une texture par modèle.
- Émetteurs de fumée/étincelles/nitro indépendants. La position d'échappement doit suivre la rotation ; un décalage fixe à l'écran ne convient pas aux courbes.
- Le circuit repose sur une grille de tuiles et de nombreux objets Phaser. Cela produit une ville, mais correspond moins à notre piste continue arrondie.
- Compatible Phaser 3.90 et Vite ; le JavaScript serait convertible en TypeScript et intégrable dans une scène React.
- Licence ISC déclarée par `package.json` et README ; leur lien LICENSE ne correspond à aucun fichier dédié dans le commit. Pas de reprise littérale ; pas de musique ou autre fichier importé.
- Mobile : textures de voitures adaptées. Éviter les nombreux objets par tuile, la physique et les émetteurs permanents. Aucune mesure physique sur smartphone de ce dépôt.

Retenu : construction visuelle par couches et émission pendant le turbo. Non retenu : contrôles manuels, IA de direction, rubber-banding, bonus ou tilemap.

## 3. RivalTracker

Dépôt : https://github.com/SamHazim/RivalTracker
Commit examiné : `2019230e641b950273312613e67597b23f61c439`.

Fichiers examinés : `js/RivalTracker.1.0.js`, README et exemple HTML.

- Convertit le pourcentage d'avancement en position SVG via `getTotalLength` et `getPointAtLength`.
- Met les données de télémétrie en file, interpole entre mises à jour et prévoit une extrapolation plafonnée en l'absence de données.
- Corrige le retour de 100 % à 0 % pour empêcher un mouvement à contresens au passage de la ligne.
- Bibliothèque DOM globale de 2013, sans TypeScript, avec sa propre boucle d'animation ; intégration directe peu pertinente dans Phaser/React.
- Licence GPLv3 déclarée dans la section Credits du README. Aucun code ni tracé SVG repris.
- Mobile : deux marqueurs SVG sont simples, mais ses remarques sur Firefox/IE sont historiques et ne constituent pas un benchmark mobile actuel. Sa file de données et sa boucle indépendante demanderaient aussi une gestion du démontage React.

Retenu pour la future intégration réseau : snapshots horodatés, interpolation et progression totale non bornée avant conversion en fraction de tour. Le prototype local lit directement la simulation locale ; il ne prétend pas simuler une connexion réseau.

## 4. Phaser Examples

Dépôt : https://github.com/phaserjs/examples
Commit examiné : `68140eca72525d5034b783a262270715ddc17b78`.

Le README actuel cible Phaser 4. Les fichiers consultés sont volontairement ceux du sous-dossier historique `public/3.86/src`, et leurs appels ont été compilés contre Phaser 3.90 :

- `game objects/graphics/generate texture to sprite.js` : Graphics hors scène, `generateTexture`, puis image réutilisable.
- `paths/followers/rotate to path.js` : spline et orientation selon le tracé. Ne pas employer son tween autonome pour déterminer la distance de course : celle-ci reste issue du moteur.
- `scalemanager/fit and snap.js` : configuration `Scale.FIT` et centrage. Notre rendu reste lissé plutôt que pixel art.
- Parcours des exemples de `game objects/particle emitter` pour les configurations d'émetteurs ; les types installés de Phaser 3.90 valident l'API employée.
- Licence : README indiquant MIT pour le code, excluant explicitement les assets. Aucun asset d'exemple utilisé.
- Mobile : ce sont des démonstrations d'API, pas une garantie de performances. Les effets doivent être bornés et le rendu mesuré.

## Choix dans Math Racing

- `src/game/track.ts` : spline fermée Phaser, table de distances calculée une fois, recherche binaire ; même distance logique pour les deux voies.
- `src/game/scenery.ts` : piste, vibreurs, grain, arbres, tribune et marquages dessinés une fois dans une texture Canvas 1000 × 640.
- `src/game/textures.ts` : voitures générées une fois par couleur et texture de particule générée avec un gradient.
- `src/game/RacingScene.ts` : deux sprites, deux labels, ombres indépendantes et deux émetteurs (32 particules maximum chacun), position d'échappement tournée avec la voiture.
- `src/components/RaceCanvas.tsx` : chargement différé du moteur, montage/démontage dans React, caméra fixe et mise à l'échelle du circuit entier.
- `src/game/TurboEffects.ts` : flammes orientées et émission directionnelle à l’échappement ; `src/game/trackSurface.ts` : relief et éclairage précalculés.
- Aucun contrôle de direction, moteur physique, image externe ou service de génération d'images.

## Vérification des performances

Mesures navigateur et captures : `node scripts/check-browser.mjs` avec le serveur local actif. Les intervalles requestAnimationFrame sont un indicateur du navigateur utilisé, pas un benchmark GPU ni une certification smartphone.

À vérifier sur appareils physiques : Safari iPhone et Chrome Android, partie complète, rotations/redimensionnement, chauffe, fluidité des particules et confort tactile. Aucune performance matérielle mobile n'est déclarée acquise avant ces essais.
