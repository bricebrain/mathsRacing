# Validation — 24 octobre 2026

## Vérifications automatisées

- 31 tests unitaires moteur/salles/interpolation : opérations, équité, boosts, arrivée, passage, JSON, vues filtrées, temps de départ, dédoublonnage, reconnexion, abandon et revanche.
- TypeScript et build Worker + frontend via `npm run build`.
- Audit npm après correctifs transitifs Undici/Zod : aucune vulnérabilité signalée.

## Exécution dans le runtime Cloudflare local

`scripts/check-multiplayer.mjs` lance deux contextes Chromium indépendants contre le vrai Worker local, sans serveur simulé :

- Création et invitation, deux identités et couleurs distinctes, refus d'un troisième joueur.
- Deux statuts prêts, même départ et même première opération.
- Ambiance de course audio active et bouclée.
- Aucune séquence future, réponse ni jeton dans les vues publiques.
- Erreur conservant la question, validation serveur et progression indépendante.
- Répétition du même message sans boost supplémentaire.
- Coupure réseau courte, reconnexion et rechargement avec progression conservée.
- Passage autorisé après huit secondes, sans compter de bonne réponse.
- Formats 375 × 667, 360 × 740 et 390 × 844 sans débordement en course.
- Partie réelle jusqu'à l'arrivée, même gagnant et même chrono final sur les deux clients.
- Corrections privées à l'arrivée et revanche après deux accords.

`scripts/check-recovery.mjs` vérifie une prise/reprise entre onglets, un faux jeton, une origine étrangère et une vraie attente du délai de vingt secondes après coupure WebSocket, puis le retour sur le même résultat.

Création et authentification WebSocket également vérifiées en utilisant l'adresse privée Wi-Fi du Mac, et non seulement localhost. Les captures sont produites dans `/tmp/math-racing-*.png`.

## Portée et limites

Les essais sont réalisés dans des navigateurs de bureau avec le runtime local. Les performances, sons, pertes réseau réelles et installation PWA sur iPhone/Android physiques restent à valider. L'interpolation est testée sur des états espacés ; ces essais ne constituent pas un benchmark de réseau mobile ni un test de charge.

Les fichiers graphiques et audio présents sont conservés. Le chunk Phaser reste volumineux et chargé séparément. Le déploiement public n'est pas réalisé par le build.

Les outils Cloudflare déclarent Node ^22.23 ou ^24.22 ou ^26.12 ; cette machine utilise Node 24.13, qui a exécuté les validations locales malgré l'avertissement d'engine. Utiliser une version prise en charge pour la CI et le déploiement.
