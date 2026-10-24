# PROJET : MATH RACING — PWA de course mathématique multijoueur

Tu es un développeur senior spécialisé en React, TypeScript, Phaser, jeux 2D HTML5 et applications multijoueurs en temps réel.

Ta mission est de concevoir et développer **Math Racing**, un jeu de course mathématique à deux joueurs sur smartphones, accessible en PWA.

Tu dois réaliser une véritable expérience de jeu, visuellement attractive, fluide, responsive et fonctionnelle.

**Important : je ne souhaite créer aucun asset graphique manuellement.** Tu dois produire les voitures, circuits, décors et effets visuels entièrement par programmation. Aucun besoin de Blender, d'éditeur de sprites ou de logiciel graphique.

## 1. CONTEXTE DU PROJET

J'ai déjà développé un jeu PWA multijoueur en temps réel appelé **Pendu Battle**.

L'infrastructure de communication entre deux joueurs est donc déjà disponible.

Avant toute implémentation :

1. Explore le repository existant.
2. Identifie l'architecture React/TypeScript.
3. Analyse le fonctionnement du multijoueur de Pendu Battle : création des salles, invitation, connexions, synchronisation, déconnexion, reconnexion et fin de partie.
4. Réutilise les composants, services, hooks et mécanismes déjà disponibles lorsque c'est pertinent.
5. Ne reconstruis pas une nouvelle infrastructure multijoueur si l'existante répond aux besoins.
6. Isole correctement les nouvelles fonctionnalités afin d'éviter toute régression dans Pendu Battle.

Si le code de Pendu Battle n'est pas présent dans le repository accessible, signale cette dépendance et implémente un adaptateur multijoueur indépendant, sans inventer d'API existante.

## 2. CONCEPT DU JEU

Math Racing est un jeu de course automobile 2D, vu du dessus, avec deux voitures sur un même circuit.

Chaque joueur utilise son propre smartphone.

Les voitures avancent automatiquement et en permanence, sans intervention sur leur direction.

Pour accélérer, les joueurs doivent résoudre des opérations mathématiques.

**Une bonne réponse déclenche un boost temporaire dont la puissance dépend de la difficulté de l'opération.**

Le premier joueur qui termine la course gagne.

Le jeu doit être compétitif, vivant, facile à comprendre et adapté à des parties courtes.

## 3. DÉROULEMENT D'UNE PARTIE

### Avant la course

- Un joueur crée une salle.
- Il invite un adversaire en utilisant le mécanisme déjà présent dans Pendu Battle.
- Les deux participants rejoignent le lobby.
- Chaque joueur choisit une couleur de voiture.
- Les participants sont déclarés prêts.
- Un compte à rebours synchronisé de 3 secondes commence.

### Pendant la course

- Les deux voitures démarrent en même temps.
- Elles avancent automatiquement à une vitesse de base identique.
- Chaque joueur reçoit une opération mathématique.
- Il saisit sa réponse à l'aide d'un pavé numérique tactile.
- Une bonne réponse déclenche un boost.
- Une mauvaise réponse ne donne aucun boost.
- Une nouvelle opération apparaît après une bonne réponse.
- Les voitures continuent de rouler pendant les calculs.
- Les joueurs peuvent se dépasser.
- La course se termine lorsqu'une voiture franchit la ligne d'arrivée.

### À la fin

Afficher un écran de résultats comprenant :

- Le gagnant.
- Les temps des deux joueurs.
- Le nombre de bonnes réponses.
- Le nombre d'erreurs.
- Le taux de réussite.
- Le nombre de boosts obtenus.
- La possibilité de rejouer avec le même adversaire.

## 4. OPÉRATIONS MATHÉMATIQUES

Uniquement trois catégories :

- Addition.
- Soustraction.
- Multiplication.

Aucune division.

Les multiplications sont limitées aux tables de 1 à 10 incluses.

Exemples autorisés :

- 2 × 4
- 7 × 8
- 9 × 9
- 10 × 6

Exemple interdit :

- 20 × 13

Pour les additions et soustractions, prévoir des difficultés progressives, mais des résultats raisonnables pour du calcul mental.

Pour la première version, utiliser des entiers positifs ou nuls et ne pas produire de résultats négatifs.

### Difficulté

Créer un classificateur déterministe pour chaque opération.

Quatre niveaux :

| Difficulté  | Exemple | Boost initial |
| ----------- | ------- | ------------- |
| Très facile | 1 + 1   | +15 %         |
| Facile      | 7 + 5   | +30 %         |
| Moyenne     | 43 − 18 | +50 %         |
| Difficile   | 9 × 8   | +75 %         |

Ces valeurs sont configurables.

Attention : la difficulté ne doit pas être évaluée uniquement sur la grandeur des nombres. Tenir compte des retenues, des emprunts, de la familiarité des tables de multiplication et de la complexité mentale estimée.

Définir des règles explicites et testables pour classifier les opérations. Les exemples du tableau représentent les catégories attendues, pas une liste exhaustive.

### Distribution des opérations

- Mélanger aléatoirement les opérations et les difficultés.
- Ne pas imposer une difficulté croissante.
- Éviter les répétitions immédiates.
- Maintenir une répartition raisonnable entre les trois catégories.
- Produire une séquence suffisamment longue pour couvrir toute la course.

### Équité

**Les deux joueurs doivent recevoir exactement la même séquence d'opérations, dans le même ordre.**

Chaque participant avance indépendamment dans cette séquence.

Si le joueur A termine trois opérations pendant que le joueur B en termine une, A voit sa quatrième opération tandis que B voit sa deuxième.

Les joueurs n'attendent jamais la réponse de l'adversaire pour continuer.

La séquence est créée une seule fois pour la partie, côté serveur ou dans une logique faisant autorité.

Ne pas transmettre les réponses attendues au client avant leur validation.

## 5. SAISIE DES RÉPONSES

Ne jamais utiliser de QCM.

Créer un pavé numérique intégré à l'interface.

Disposition :

1 2 3

4 5 6

7 8 9

⌫ 0 OK

Exigences :

- Grandes touches tactiles.
- Affichage de la réponse saisie.
- Effacement avec la touche retour.
- Validation via OK.
- Animation visuelle d'une bonne réponse.
- Feedback léger lors d'une erreur.
- Pas de clavier natif obligatoire.
- Support du clavier physique sur ordinateur.
- Interface ne masquant pas la course.

Après une erreur, conserver l'opération jusqu'à obtention de la bonne réponse, sans révéler celle-ci.

Prévoir une courte protection contre les tentatives automatiques ou les validations répétées abusives, sans pénaliser inutilement les joueurs.

## 6. SYSTÈME DE BOOST

C'est le cœur du gameplay.

### Vitesse de base

Les deux voitures possèdent une vitesse normale constante et identique.

Elles avancent continuellement, même sans réponse.

### Bonne réponse

Une réponse correcte déclenche immédiatement un boost.

La puissance dépend de la difficulté de l'opération.

Valeurs initiales :

- Très facile : +15 %.
- Facile : +30 %.
- Moyenne : +50 %.
- Difficile : +75 %.

Durée initiale : 3 secondes.

### Boosts successifs

Un joueur peut répondre correctement alors qu'un boost est déjà actif.

Il doit impérativement bénéficier d'une récompense.

Pour la V1, adopter cette règle :

- Chaque bonne réponse crée un nouveau boost.
- Le nouveau boost remplace le précédent.
- Son intensité correspond à la difficulté de la nouvelle réponse.
- Sa durée repart à 3 secondes.
- Les multiplicateurs ne s'additionnent pas.

Cela évite les vitesses incontrôlables tout en récompensant chaque bonne réponse.

Prévoir un moteur de boost isolé et configurable pour permettre ultérieurement d'expérimenter d'autres règles.

### Erreur

- Aucun nouveau boost.
- Pas de pénalité artificielle de vitesse.
- Le boost déjà actif peut terminer sa durée.
- L'opération demeure à résoudre.

### Expiration

Lorsque la durée du boost expire, la vitesse revient progressivement à la vitesse normale.

Prévoir une transition visuelle douce.

### Configuration

Centraliser tous les paramètres :

- Vitesse normale.
- Multiplicateur par difficulté.
- Durée des boosts.
- Durée de course.
- Nombre de tours.
- Répartition des opérations.

Ne pas disperser ces valeurs sous forme de constantes magiques dans le code.

## 7. MOTEUR DE COURSE

Utiliser Phaser pour créer un jeu 2D vu du dessus.

Ne pas utiliser de véritable simulation physique automobile.

### Déplacements

Définir chaque circuit à partir d'un parcours fermé utilisant une courbe continue.

Chaque voiture suit automatiquement le parcours.

Calculer :

- La distance parcourue.
- La position sur le circuit.
- L'orientation.
- La vitesse instantanée.
- Le nombre de tours.
- La position dans le classement.

Le mouvement doit être fluide.

Le rendu ne doit pas dépendre directement de la fréquence des événements réseau.

### Deux voitures

Les deux véhicules roulent sur le même circuit.

Prévoir deux trajectoires légèrement décalées pour assurer leur visibilité lors des dépassements.

Les trajectoires ne doivent pas créer d'avantage de distance injustifié.

Aucune collision physique nécessaire dans la V1.

### Caméra

Pour la V1, afficher le circuit entier, avec une caméra fixe.

Les deux voitures doivent rester visibles simultanément.

Ne pas proposer deux caméras indépendantes.

### Circuits

Créer au minimum un circuit fonctionnel et agréable à regarder.

Prévoir une structure permettant d'ajouter plusieurs circuits ultérieurement.

Un circuit doit comporter :

- Une piste d'asphalte.
- Des virages arrondis.
- Des bordures colorées.
- Une ligne de départ/arrivée.
- Des marquages au sol.
- Des zones d'herbe.
- Quelques éléments décoratifs.

Éviter un simple anneau ovale sans intérêt visuel.

## 8. GRAPHISMES SANS ASSETS EXTERNES

Je ne suis pas graphiste et ne souhaite pas utiliser Blender, Photoshop, Aseprite ou Tiled.

Produire les graphismes programmatiquement.

Technologies possibles :

- Phaser Graphics.
- SVG.
- Canvas 2D.
- Textures générées à l'exécution.
- Formes géométriques.
- Animations et particules.

### Voitures

Créer deux voitures vues du dessus.

Elles doivent posséder :

- Une carrosserie identifiable.
- Des roues.
- Un pare-brise.
- Des vitres.
- Des phares.
- Une ombre légère.
- Des couleurs différentes.

Privilégier un style miniature arcade cohérent, avec une esthétique soignée plutôt qu'un photoréalisme inaccessible.

### Boosts

Lorsqu'un boost s'active :

- Effet lumineux derrière la voiture.
- Traînée de vitesse.
- Particules.
- Animation de la vitesse.
- Retour progressif à l'état normal.

Les effets doivent rester légers pour un smartphone.

### Environnement

Créer les décors par code.

Prévoir des détails visuels qui donnent de la vie au circuit sans surcharger l'écran.

Aucun asset payant.

Ne pas dépendre d'un service de génération d'images.

## 9. INTERFACE MOBILE FIRST

Le jeu doit fonctionner avant tout sur iPhone et Android.

Organisation recommandée en mode portrait :

Partie supérieure :

- Circuit animé.
- Les deux voitures.
- Positions et tours.

Partie inférieure :

- Opération courante.
- Réponse en cours de saisie.
- Pavé numérique.

Ajouter des indicateurs discrets :

- Vitesse.
- Boost actif.
- Durée restante du turbo.
- Avancement des deux joueurs.

L'interface doit demeurer lisible sur petit écran.

Éviter les défilements involontaires pendant la course et limiter les problèmes liés au redimensionnement du viewport.

Prévoir une adaptation aux écrans desktop.

## 10. SYNCHRONISATION MULTIJOUEUR

Réutiliser prioritairement les mécanismes existants de Pendu Battle.

Le serveur est l'autorité concernant :

- Le départ.
- La séquence des opérations.
- La vérification des réponses.
- Les boosts.
- La distance parcourue.
- Le nombre de tours.
- Le classement.
- Le gagnant.

Le client affiche les déplacements avec interpolation pour garantir la fluidité.

Ne pas envoyer la position des voitures à chaque frame.

Prévoir :

- Synchronisation d'horloge raisonnable.
- Événements de boost.
- État de course périodique.
- Réconciliation des positions.
- Gestion des latences.
- Déconnexion temporaire.
- Reconnexion.
- Prévention des doubles validations.
- Contrôle des réponses côté serveur.

Les joueurs doivent observer sensiblement la même course, sans que les légères différences de latence rendent le résultat injuste.

## 11. ARCHITECTURE TECHNIQUE

Stack privilégiée :

- React.
- TypeScript.
- Vite.
- Phaser.
- Infrastructure multijoueur existante.
- PWA.

Ne pas introduire inutilement Redux, un nouveau backend, une nouvelle base de données ou une architecture complexe si le projet actuel peut être étendu simplement.

Séparer clairement :

- Générateur d'opérations.
- Classificateur de difficulté.
- Validateur des réponses.
- Gestion des boosts.
- Simulation de course.
- Définition des circuits.
- Rendu Phaser.
- Synchronisation réseau.
- Interface React.

Le moteur de calcul et les règles de course doivent rester testables indépendamment de Phaser.

## 12. IA ET LLM

Aucun LLM n'est nécessaire pour la première version.

Ne pas ajouter d'intégration OpenAI, Kimi, GLM ou autre modèle dans le fonctionnement du jeu.

Les opérations mathématiques peuvent être générées directement en TypeScript.

Prévoir simplement une architecture extensible pour d'éventuelles évolutions ultérieures.

## 13. TESTS ET QUALITÉ

Créer des tests automatisés concernant :

- La génération d'opérations.
- L'exactitude des résultats.
- Les tables de multiplication.
- La classification des difficultés.
- L'identité des séquences entre les joueurs.
- La progression indépendante des joueurs.
- Les boosts.
- L'expiration des boosts.
- Les réponses incorrectes.
- La distance parcourue.
- La détection de la ligne d'arrivée.
- Les validations répétées.
- La gestion des déconnexions.

Tester particulièrement l'équité du jeu.

Les deux joueurs doivent avoir la même vitesse et les mêmes avantages à réponses et timings identiques.

## 14. PLAN DE RÉALISATION

Travaille par étapes.

### Phase 1 — Audit et architecture

- Étudier Pendu Battle.
- Identifier les composants réutilisables.
- Proposer une architecture simple.
- Identifier les fichiers concernés.
- Documenter les choix techniques.

### Phase 2 — Moteur mathématique

- Générateur d'opérations.
- Classification des difficultés.
- Séquences communes.
- Vérification des réponses.
- Tests unitaires.

### Phase 3 — Simulation de course

- Modèle de voiture.
- Vitesse.
- Boosts.
- Distance.
- Tours.
- Conditions de victoire.
- Tests sans moteur graphique.

### Phase 4 — Rendu graphique

- Installation ou réutilisation de Phaser.
- Construction du circuit.
- Génération des voitures par code.
- Animations.
- Dépassements.
- Effets visuels.

### Phase 5 — Interface

- Écran de lobby.
- Écran de jeu.
- Opérations mathématiques.
- Pavé numérique.
- Indicateurs de course.
- Écran de résultats.

### Phase 6 — Intégration multijoueur

- Connexion de deux smartphones.
- Synchronisation du départ.
- Validation des réponses.
- Gestion des boosts.
- Synchronisation des positions.
- Fin de partie.
- Reconnexion.

### Phase 7 — Finitions

- Amélioration des graphismes.
- Animations.
- Optimisation mobile.
- Correction des bugs.
- Tests.
- Équilibrage initial.

## 15. CRITÈRES D'ACCEPTATION

Le projet est considéré comme fonctionnel si :

1. Deux joueurs peuvent rejoindre une même partie sur deux smartphones.
2. Les deux voient un circuit et deux voitures animées.
3. Les voitures avancent continuellement.
4. Les deux joueurs reçoivent la même séquence d'opérations.
5. Chaque joueur répond indépendamment.
6. La réponse est saisie numériquement, sans QCM.
7. Les bonnes réponses déclenchent des boosts selon leur difficulté.
8. Les effets visuels du turbo sont visibles.
9. Les voitures peuvent se dépasser.
10. La course se termine correctement et annonce le gagnant.
11. Le rendu reste fluide et lisible sur mobile.
12. Aucun logiciel de création graphique externe n'est nécessaire.
13. L'intégration ne casse pas Pendu Battle.
14. Les règles critiques sont validées par des tests automatisés.

## 16. CONSIGNES DE TRAVAIL

- Commence par inspecter le projet.
- Réutilise au maximum ce qui existe.
- Privilégie des solutions simples et maintenables.
- Produis du code réel, pas uniquement des pseudocodes.
- Évite le surdimensionnement.
- N'invente pas des fonctionnalités supplémentaires.
- Ne bloque pas sur des détails esthétiques mineurs : choisis des défauts raisonnables.
- Vérifie régulièrement la compilation, les tests et le fonctionnement.
- Documente les fichiers importants et les décisions prises.
- Signale clairement ce qui est terminé, ce qui reste à faire et ce qui nécessite des tests sur deux appareils.

**Objectif final : obtenir une PWA Math Racing complète, jouable, fluide et graphiquement soignée, entièrement réalisable avec Codex sans création manuelle d'assets.**
