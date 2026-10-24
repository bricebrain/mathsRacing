# Capitales d’Europe

Le créateur choisit « Maths » ou « Capitales d’Europe » dans le salon. Le mode s’applique aux deux joueurs ; un changement annule les états « prêt ». Il est figé dès le compte à rebours et conservé pour la revanche.

## Périmètre

Le catalogue `src/constants/europeCapitals.ts` contient 51 entrées : les États européens, les micro-États, les pays transcontinentaux Russie, Turquie et Kazakhstan, ainsi que Chypre, l’Arménie, la Géorgie et l’Azerbaïdjan dans un périmètre européen large. Cette convention pédagogique ne prétend pas imposer une frontière géographique unique. Le Kosovo est inclus avec reconnaissance internationale partielle. Les territoires dépendants et autres entités à reconnaissance contestée ne sont pas ajoutés comme pays distincts.

Amsterdam est la capitale des Pays-Bas, même si le gouvernement siège à La Haye. Berne est la ville fédérale suisse, employée ici comme capitale dans l’usage courant. « Kyiv » est retenu pour l’Ukraine, « Cité du Vatican » pour le Vatican et « Astana » pour le Kazakhstan. Les variantes orthographiques ne sont pas évaluées : le jeu propose quatre libellés explicites.

## Règles

Chaque cycle présente les 51 pays une fois dans un ordre mélangé, sans répétition immédiate entre deux cycles. La graine commune produit exactement les mêmes pays, propositions et positions pour les deux joueurs, qui avancent indépendamment. Une question comporte une seule bonne capitale et trois autres capitales distinctes du catalogue. La position correcte varie.

Le clic valide immédiatement ; les touches 1 à 4 sélectionnent aussi une réponse. Le serveur reçoit uniquement l’index 0 à 3 et vérifie sa validité. Comme en maths, une erreur conserve la question, compte une erreur et ne donne aucun nouveau turbo ; une bonne réponse avance et relance le turbo. Le délai minimal existant entre tentatives reste actif. Ce fonctionnement autorise plusieurs essais, conformément à la demande de conserver le procédé des maths : il ne mesure donc pas uniquement le rappel au premier essai.

Passer devient possible après huit secondes, sans nouveau boost. Les corrections des questions erronées ou passées sont disponibles à l’arrivée, uniquement pour le joueur concerné. Les règles de course, de reconnexion et de revanche restent identiques.

## Difficulté

Classification éditoriale initiale pour un public francophone, ajustable dans le catalogue ; elle ne constitue pas un niveau objectif ou personnalisé de connaissance.

| Niveau | Exemples | Turbo pendant 3 secondes |
| --- | --- | --- |
| Très facile | France–Paris, Italie–Rome | +15 % |
| Facile | Belgique–Bruxelles, Portugal–Lisbonne | +30 % |
| Moyenne | Pologne–Varsovie, Turquie–Ankara | +50 % |
| Difficile | Azerbaïdjan–Bakou, Monténégro–Podgorica | +75 % |

## Sources consultées le 24 octobre 2026

- [National Geographic Education — European Countries and Capitals](https://media.nationalgeographic.org/assets/file/Europe_Activities.pdf) : base Europe, complétée pour le Caucase et le Kazakhstan. Les anciennes désignations du document (Macedonia, Kiev) sont actualisées ; Amsterdam est retenue seule dans le QCM.
- [Commission européenne — À la découverte de l’Europe](https://op.europa.eu/webpub/com/lets-explore-europe/en/) : repères sur les pays de l’UE ; ne définit pas le périmètre complet du jeu.
- [France Diplomatie — Azerbaïdjan](https://www.diplomatie.gouv.fr/fr/information-par-pays/azerbaidjan/presentation-de-l-azerbaidjan) : Bakou.
- [France Diplomatie — Géorgie](https://www.diplomatie.gouv.fr/fr/information-par-pays/georgie/presentation-de-la-georgie) : Tbilissi.
- [Ministère arménien des Affaires étrangères](https://www.mfa.am/fr/overview) : Erevan.
- [France Diplomatie — Kazakhstan](https://www.diplomatie.gouv.fr/fr/information-par-pays/kazakhstan/presentation-du-kazakhstan) : Astana.
