# Math Racing — course de connaissances en multijoueur

Jeu de course de connaissances de deux à quatre joueurs, chacun sur son téléphone. React, TypeScript, Vite, Phaser et serveur Cloudflare Durable Objects. Le départ, les questions, les réponses, les boosts, les distances et le résultat sont calculés côté serveur.

**Aucun mode solo ni adversaire automatique.**

## Lancer sur le même Wi-Fi

Utiliser une version Node prise en charge par les outils Cloudflare : Node 22.23.x ou 24.22.x et versions compatibles ultérieures.

```sh
npm ci
npm run dev -- --port 5175
```

Le serveur de développement lance aussi le Worker, les WebSockets et le stockage local des salles. Aucun compte Cloudflare n'est nécessaire pour ces essais.

1. Ouvrir l'adresse **Network** affichée par Vite sur le premier téléphone.
2. Choisir un pseudo et cliquer **Créer une salle**.
3. Dans le salon, choisir **2, 3 ou 4 joueurs** (2 par défaut), puis partager le lien ou le code à six caractères.
4. Chaque invité ouvre le lien et saisit son pseudo pour rejoindre.
5. Le créateur coche un ou plusieurs thèmes (**Maths**, **Capitales d’Europe**, **Capitales du monde**, **Culture générale**, **Drapeaux du monde**), puis **3, 5 ou 10 tours** (3 par défaut) pour la salle. Chacun choisit une couleur disponible et clique **Je suis prêt**.
6. Quand tous les joueurs prévus sont présents, connectés et prêts, le compte à rebours commun lance la course.

Depuis le Mac, `localhost` fonctionne également. En développement, l'invitation utilise automatiquement l'adresse privée détectée du Mac pour qu'elle soit ouvrable sur un téléphone. Les appareils doivent pouvoir communiquer sur le réseau local ; les liens locaux ne sont pas accessibles depuis Internet.

## Règles

En maths, saisir le résultat avec le pavé ou le clavier. Les autres thèmes proposent quatre réponses : cliquer un choix ou utiliser les touches 1 à 4. Europe : 51 pays ; monde et drapeaux : 196 pays ; culture générale : 120 questions (30 par niveau). [Catalogues, règles et sources](docs/THEMES.md). Plusieurs thèmes sont mélangés équitablement ; tous les joueurs reçoivent la même séquence et les mêmes choix.

Les voitures suivent automatiquement le circuit. Les joueurs reçoivent la même séquence et progressent indépendamment. En maths, valider avec OK/Entrée ; un choix de capitale se valide immédiatement. Une erreur bloque toute réponse et le passage, affiche la bonne réponse pendant deux secondes, puis avance automatiquement sans nouveau boost. Cette règle est validée et chronométrée par le serveur, y compris après rechargement. Une réussite déclenche un boost de trois secondes, remplacé par chaque nouvelle réussite.

Après huit secondes, **Passer** permet d'avancer sans nouveau boost. Les calculs passés et les erreurs sont comptés séparément ; leurs corrections sont disponibles à l'arrivée. Les résultats sont figés au premier franchissement.

Une coupure ne met pas la course en pause. Le joueur peut revenir avec le même lien et retrouver sa progression. Après vingt secondes à partir de la détection de déconnexion par le serveur, le joueur absent est déclaré en abandon et sa distance est figée. La course continue entre les autres ; le dernier joueur encore en course et connecté gagne par abandon. Si tous abandonnent, la course est interrompue. Revenir après ce délai permet de voir la course mais ne réintègre pas la compétition en cours. Une liaison silencieuse est détectée par heartbeat, donc le délai total d'une panne peut être plus long. Une déconnexion pendant le compte à rebours annule le départ et remet tous les joueurs non prêts.

La revanche nécessite l’accord de tous les joueurs. Un autre onglet peut reprendre la session explicitement ; l'ancien onglet est alors suspendu. Les salles expirent après trente minutes sans action de jeu ou reconnexion.

## Sons

Les fichiers de `src/audio/` sont conservés : intro dans le menu après un geste, engine1/engine2 pendant le compte à rebours, carstart au départ, bruitdefond en boucle pendant la course et nitro/nitro2 pour les voitures (un canal indépendant par pilote). Le bouton muet contrôle le mix et conserve le choix. Les volumes sont centralisés dans `src/audio/samples.ts`. Les deux fichiers nitro fournis sont identiques et restent affectés séparément.

## Vérifier

```sh
npm test
npm run build
```

Avec le serveur actif et Chromium Playwright installé :

```sh
npm run test:e2e
node scripts/check-recovery.mjs
node scripts/check-capitals.mjs
node scripts/check-themes.mjs
node scripts/check-four-players.mjs
PLAYERS=3 node scripts/check-four-players.mjs
```

`GAME_URL` permet de choisir un autre hôte ou port. Le premier scénario effectue une course réelle entre deux sessions indépendantes, dont la durée dépend des réponses. Il couvre les invitations, le départ, les validations, les doublons, la reconnexion, le passage, l'arrivée et la revanche. Le second vérifie la reprise entre onglets, les accès refusés et l'abandon après le délai réel. Captures dans `/tmp/math-racing-*.png`.

Les anciens points d'entrée `check-browser.mjs` et `check-audio-samples.mjs` lancent maintenant le parcours multijoueur.

## Hébergement public

La configuration `cloudflare.config.ts` définit un Worker **math-racing** avec ses propres salles **RacingRoom**. Pendu Battle reste indépendant et n'a pas été modifié. Le build complet est généré dans `.cloudflare/output/v0/`.

Pour jouer depuis des réseaux différents, il faut publier ce Worker avec un compte Cloudflare :

```sh
npx cf auth login
npm run deploy
```

La publication n'est pas effectuée par la simple commande de build. Après publication, les invitations utilisent l'adresse HTTPS publique. Le manifest et le service worker sont conservés ; `/api/` est exclu du cache. Le shell peut être mis en cache, mais une course nécessite une connexion au serveur. Installation et audio à valider sur Safari iPhone et Chrome Android physiques.

## Organisation

- `src/engine/` : opérations déterministes, validation et simulation pure, utilisées par l'autorité serveur.
- `server/` : salles, stockage SQLite, cycle de match, vues filtrées, validation des messages et Worker HTTP/WebSocket.
- `src/shared/` : types des messages et états publics.
- `src/services/` : création, session et invitation.
- `src/network/` : connexion, reprise des actions en attente et interpolation des états reçus.
- `src/hooks/` : session, salle, contrôles et affichage de la course.
- `src/game/` : rendu Phaser existant, couleurs et voies cohérentes entre tous les téléphones.
- `src/audio/` : fichiers fournis, synthèse des signaux et mix partagé.

[Architecture et réutilisation de Pendu Battle](docs/ARCHITECTURE.md) · [Validation](docs/VALIDATION.md) · [Références graphiques](docs/REFERENCES-GRAPHIQUES.md) · [Pédagogie](docs/PEDAGOGIE.md).
