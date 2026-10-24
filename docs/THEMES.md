# Thèmes et corrections

## Choix dans le salon

Le créateur choisit 2, 3 ou 4 joueurs (2 par défaut), puis coche un ou plusieurs thèmes : maths, capitales d’Europe, capitales du monde, culture générale et drapeaux du monde. Il choisit aussi 3, 5 ou 10 tours (3 par défaut). Retirer le dernier thème est impossible. Changer les thèmes ou les tours annule les accords « prêt » précédents. Les choix sont partagés, figés au compte à rebours et conservés pour la revanche.

Le moteur normalise l’ordre des thèmes et mélange un exemplaire de chaque thème par bloc. Chaque thème utilise une pioche sans remise, renouvelée à épuisement sans répétition immédiate dans ce thème. Si Europe et Monde sont tous deux cochés, la pioche Monde utilise les pays hors du catalogue Europe, pour éviter de compter les mêmes pays dans deux thèmes. Chaque joueur reçoit la même séquence, les mêmes choix et les mêmes positions, avec progression indépendante.

## Nouvelle règle d’erreur

Elle s’applique aux maths et aux quatre thèmes à choix multiples :

1. Le premier essai incorrect compte une erreur et mémorise la question dans le bilan.
2. Le serveur fixe une échéance deux secondes plus tard. La question reste affichée avec sa bonne réponse. Dans un QCM, le bon bouton est surligné en vert et tous les boutons sont désactivés.
3. Toute tentative supplémentaire et tout passage sont rejetés côté serveur pendant la correction. La réponse n’est révélée qu’au joueur concerné.
4. À l’échéance, le serveur avance d’une question sans attribuer de bonne réponse ni de nouveau turbo. Un éventuel turbo précédent continue son évolution normale.
5. Le délai de huit secondes avant passage repart au début de la nouvelle question. Un rechargement conserve la correction et son échéance ; une arrivée fige tout l’état.

Les alarmes de course existantes diffusent l’état toutes les 200 ms environ. L’interface attend la confirmation du serveur pour réactiver les réponses ; elle ne décide jamais seule de passer à la question suivante.

## Catalogues

- Europe : 51 entrées, périmètre et sources dans [CAPITALES.md](CAPITALES.md).
- Monde et drapeaux : 196 entrées — 193 États membres de l’ONU, le Vatican/Saint-Siège, la Palestine et le Kosovo déjà présent dans le catalogue Europe. Les territoires dépendants sont exclus. Le Kosovo conserve la mention de reconnaissance partielle. Ce périmètre est une convention pédagogique, non une reconnaissance politique supplémentaire.
- Culture générale : 120 questions rédigées en français, 30 par niveau, sur sciences, nature, histoire, géographie, arts, littérature et sport. Les difficultés sont éditoriales, non calibrées sur un âge ou une mesure individuelle.
- Les quatre propositions sont toujours distinctes ; leur ordre est mélangé. Une seule proposition est correcte dans le contexte précis de la question.
- Les données et les 196 SVG de drapeaux sont livrés avec l’application : aucun service tiers n’est appelé pendant une course.

### Conventions pour les capitales

Le catalogue est une photographie au 24 octobre 2026. Les libellés français du catalogue Europe sont conservés. Parmi les cas explicités dans la question : Afrique du Sud–Pretoria (administrative), Sri Lanka–Sri Jayawardenepura Kotte (administrative), Eswatini–Mbabane (administrative), Bolivie–Sucre (constitutionnelle), Suisse–Berne (ville fédérale), Yémen–Sanaa (constitutionnelle), Nauru–Yaren (siège du gouvernement). Pour la Palestine, la question porte sur le siège administratif de l’Autorité palestinienne à Ramallah ; pour Israël, sur la ville où siège le Parlement, Jérusalem. Ces formulations évitent d’évaluer un différend de reconnaissance sur une question générique de capitale.

Guinée équatoriale : Ciudad de la Paz, et non Malabo. Indonésie : Jakarta, selon la fiche diplomatique consultée. Ces deux entrées doivent être revérifiées lors des mises à jour du catalogue.

## Sources et licences

- [mledoze/countries](https://github.com/mledoze/countries) : base des noms de pays, capitales et codes, consultée le 24 octobre 2026. Base dérivée traduite/corrigée sous **ODbL 1.0** ; [licence complète](COUNTRIES-LICENSE.txt). Les versions téléchargeables sont servies à `/data/world-countries.json` et `/data/ODbL.txt`, accessibles depuis « Contenu et règles ». Les modifications du catalogue TypeScript doivent également être reportées dans le JSON ; un test vérifie leur égalité.
- [hampusborgos/country-flags](https://github.com/hampusborgos/country-flags) : SVG copiés localement depuis les rendus de drapeaux, indiqués comme domaine public par le projet source ; aucune bibliothèque ajoutée.
- [ONU — États observateurs](https://www.un.org/en/about-us/non-member-states) : Saint-Siège et Palestine.
- [France Diplomatie — Guinée équatoriale](https://www.diplomatie.gouv.fr/fr/information-par-pays/guinee-equatoriale/presentation-de-la-guinee-equatoriale), [Indonésie](https://www.diplomatie.gouv.fr/fr/information-par-pays/indonesie/presentation-de-l-indonesie), [Afrique du Sud](https://www.diplomatie.gouv.fr/fr/information-par-pays/afrique-du-sud/presentation-de-l-afrique-du-sud), [Eswatini](https://www.diplomatie.gouv.fr/fr/information-par-pays/eswatini/presentation-de-l-eswatini) et [Nauru](https://www.diplomatie.gouv.fr/fr/information-par-pays/nauru/presentation-de-nauru) : vérification des cas particuliers.
- [Ministère sri-lankais des Affaires étrangères](https://www.mfa.gov.lk/en/national-profile-and-geography) : Sri Jayawardenepura Kotte.

Repères consultés pour les questions de culture générale : [NASA — Système solaire](https://science.nasa.gov/solar-system/solar-system-facts/), [BIPM — Système international](https://www.bipm.org/en/measurement-units/), [Royal Society of Chemistry — tungstène](https://periodic-table.rsc.org/element/74/tungsten), [Louvre — chefs-d’œuvre](https://api-www.louvre.fr/sites/default/files/2025-09/2025-chefsdoeuvres-FR-light.pdf), [Offices — Vénus](https://www.uffizi.it/en/td/venus), [ONU — Déclaration universelle](https://www.un.org/en/about-us/universal-declaration-of-human-rights), [CIO — anneaux olympiques](https://www.olympics.com/ioc/olympic-rings), [FIE — règles du fleuret](https://static.fie.org/uploads/5/27570-fie_rules_-_technical_rules_-_dec_2014.pdf). Les questions sont rédigées pour le jeu, pas reproduites d’un quiz tiers.

## Vérifications

`npm test`, `npm run build`, puis avec le serveur actif : `node scripts/check-themes.mjs`, `node scripts/check-capitals.mjs` et `npm run test:e2e` et `node scripts/check-four-players.mjs`. Le premier scénario teste les cinq thèmes, les drapeaux locaux, la sélection partagée, la correction privée, le rejet des essais rapides, le rechargement et les formats téléphone/ordinateur.
