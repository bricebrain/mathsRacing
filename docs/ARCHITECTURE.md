# Architecture multijoueur

## Réutilisation de Pendu Battle

Sources étudiées dans `/Users/brice/mesProjects/myMobileProjects/penduBattle` : `cloudflare.config.ts`, `vite.config.ts`, `server/GameRoom.ts`, `server/http.ts`, `server/connections.ts`, `server/index.ts`, `server/view.ts`, `src/shared/protocol.ts`, `src/services/rooms.ts`, `src/hooks/useRoom.ts`, `src/hooks/useClock.ts` et `src/lib/actionId.ts`.

Réutilisés/adaptés : lecture bornée des corps HTTP, création de code de salle, routes create/join/session/socket, jetons membres, authentification WebSocket, attachments de connexion, reprise entre onglets, heartbeat, reconnexion avec backoff, stockage SQLite et diffusion d'une vue par joueur. Les règles Pendu Battle, sa banque de mots et son éventuelle IA ne sont pas importées.

Math Racing est un Worker et un namespace de salles distincts. Aucune écriture dans le dépôt ni modification du service Pendu Battle.

## Autorité serveur

`server/model.ts` définit la salle et ses deux à quatre membres. `server/match.ts` applique les règles, crée une seule séquence à chaque partie, déclenche le départ commun et détermine l'arrivée/abandon. `src/engine/` conserve le moteur testé indépendamment de Phaser. Les sentinelles initiales des boosts et tentatives sont des nombres finis compatibles JSON.

`RacingRoom` reçoit les commandes, authentifie l'identité par jeton et conserve les connexions avec l'API d'hibernation WebSocket. L'état est lu depuis SQLite à chaque traitement ; les mutations sont sauvegardées avant diffusion. `roomStorage.ts` centralise ces opérations synchrones. Une alarme périodique produit les états pendant la course ; aucun envoi de position à chaque frame.

Les timestamps d'actions proviennent du serveur. Le client ne peut choisir ni distance, ni boost, ni date de réponse, ni gagnant. Chaque réponse/passage contient un identifiant de partie, un identifiant de question et un identifiant d'action. La salle garde les 128 derniers accusés pour les reprises idempotentes ; les questions périmées et les anciennes parties sont rejetées même hors de ce cache.

Les messages sont validés par Zod côté serveur (`validation.ts`) et bornés à 2048 caractères. Les corps HTTP sont bornés à 1024 octets. Le Worker vérifie l'origine, limite les requêtes et les connexions. La comparaison des jetons utilise `node:crypto/timingSafeEqual` avec le mode de compatibilité Node des Workers.

## Données publiques et privées

`server/view.ts` publie seulement les statistiques, distances, boosts, membres sans jeton et la question courante du destinataire. Aucun seed ni séquence future n'est envoyé. Les réponses et les corrections à revoir sont publiées uniquement au joueur concerné après la fin de course.

`src/shared/protocol.ts` ne contient que les contrats et constantes réseau : le validateur serveur n'est pas embarqué dans le navigateur. L'affichage utilise `DisplayRace`, sans séquence privée. Le moteur de rendu et les sons reçoivent cette vue publique.

## Fluidité et identité

`RoomConnection` reprend les conventions Pendu Battle, avec retransmission des actions en attente utilisant le même identifiant. Une reconnexion automatique ne déloge pas un autre onglet ; l'ouverture de salle ou le bouton **Reprendre ici** peut la réclamer explicitement.

`RaceInterpolator` conserve un historique borné, interpole les distances avec un retard d'affichage de 180 ms et plafonne la prédiction à 400 ms. Il ne crée jamais de gagnant et attend le résultat du serveur. L'horloge du téléphone est rapprochée de celle du serveur par ping/pong et mesure de trajet ; elle ne fait pas autorité sur les règles.

L'interface présente toujours le joueur local en premier. Le rendu utilise toutefois les identités globales 0/1/2/3 pour attribuer les voies et numéros : tous les téléphones voient les voitures sur les mêmes trajectoires. Couleurs, pseudonymes et résultats sont fournis par le serveur.

## Connexions et cycle de vie

- Le créateur choisit une capacité de 2, 3 ou 4 joueurs ; tous les joueurs prévus doivent être présents, connectés et prêts au départ. Une réduction sous le nombre de membres présents est refusée.
- Une déconnexion pendant le compte à rebours annule le départ.
- La course continue pendant une coupure et les validations hors ligne sont désactivées.
- Une reprise restaure identité, question, compteurs et progression ; aucun nouveau départ.
- Après vingt secondes suivant la détection serveur, le pilote absent est déclaré en abandon. Les autres continuent à plusieurs ; le dernier pilote encore en course et connecté gagne, et l’absence de tout pilote éligible interrompt la course. Le heartbeat détecte aussi les connexions devenues silencieuses.
- L'arrivée effective avant l'expiration du délai prime sur l'abandon.
- Les consentements de tous les membres sont nécessaires à une revanche ; nouvel identifiant et nouvelle séquence.
- TTL de salle : trente minutes, rafraîchi par les actions ou authentifications.

## Développement et publication

Vite et son plugin Cloudflare lancent en local le même modèle Worker/Durable Objects. Le stockage est isolé dans `.cloudflare/state/dev`. Le build complet est dans `.cloudflare/output/v0/`. La configuration utilise la date de compatibilité 2026-10-24 et active les logs/traces.

L'invitation locale remplace localhost par l'adresse privée détectée du Mac ; en production, elle utilise l'origine HTTPS publique. Le service worker n'intercepte pas `/api/` et n'offre aucun mode solo hors ligne.

La publication publique doit être effectuée séparément avec `cf deploy`. La configuration ne crée pas de lien vers les salles Pendu Battle existantes.

## Règles et pédagogie conservées

Trois, cinq ou dix tours de 1050 m logiques (trois par défaut), vitesse normale 52 m/s, boosts +15/+30/+50/+75 % pendant trois secondes avec fondu de 650 ms, protection de 300 ms entre tentatives et passage après huit secondes. Le classificateur reste déterministe ; multiplications limitées aux tables 1–10 et résultats non négatifs. Les cinq thèmes sont combinables ; les questions sont mélangées équitablement. Une erreur déclenche deux secondes de correction puis un passage automatique, sans nouveau turbo. Le délai est persisté et validé côté serveur. La correction n’est révélée qu’au joueur concerné.

Le prototype local avec adversaire automatique a été remplacé. Les améliorations graphiques et les MP3 présents sont conservés.

## Courses à trois ou quatre

La liste des voitures et les états publics ont une taille variable. L’ordre de présentation place toujours le joueur local en premier, sans changer les identités serveur : voies, numéros et couleurs restent identiques sur tous les écrans. Le classement donne la priorité aux gagnants, puis aux pilotes encore en course, puis aux abandons. Les égalités partielles sont représentées par la liste `winners` ; `winner = -1` reste compatible avec le protocole précédent.

Les abandons sont traités dans l’ordre chronologique de leurs échéances. La simulation avance jusqu’à chaque échéance avant de figer le pilote concerné. Une arrivée antérieure reste prioritaire. Le jeu continue à plusieurs, le dernier pilote encore en course et connecté gagne par abandon, et aucun gagnant n’est attribué si tous dépassent le délai. Une reconnexion tardive ne supprime pas l’abandon.

La lecture de l’état d’une salle lors d’une inscription se fait après la lecture asynchrone du corps HTTP ; attribution de place et sauvegarde SQLite restent dans la même section synchrone. Cela évite que des inscriptions simultanées utilisent la même identité. Les anciennes salles sont restaurées avec une capacité de deux joueurs par défaut.

## Affichage selon la surface disponible

L’écran de jeu conserve le classement, le circuit et les contrôles, sans bandeau, titre décoratif ni consignes. `styles/viewport.css` attribue la surface restante au circuit : contrôles à droite sur ordinateur et en paysage court, en dessous sur téléphone. Les réglages de salle peuvent défiler dans leur panneau. Le son reste accessible à côté du classement.

`RaceCanvas` observe les changements de taille de son conteneur pour recalculer le rendu Phaser sans recréer la partie. Le circuit conserve ses proportions et reste visible en entier. L’asphalte passe de 74 à 98 unités, avec bordures, pont et grille de départ élargis ; les quatre voies visuelles sont espacées de 24 unités. Ces dimensions ne modifient ni distances, ni vitesse, ni classement côté serveur.
