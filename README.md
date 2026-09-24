# Open Darts — 99 Fléchettes PRO

Remplace les fichiers de ton dépôt GitHub par ceux-ci puis laisse Vercel redéployer.

## Arborescence
- `/` accueil / sélection des mini-jeux
- `/99-darts/` jeu 99 Fléchettes

## Fonctionnalités
- connexion directe au WebSocket local Autodarts, sans bridge
- choix 1 à 20 ou Bull avec représentation graphique du dartboard
- 99 lancers
- simple +1, double +2, triple +3
- sons et animations, triple renforcé
- nom du joueur
- statistiques et moyenne
- historique local et meilleur résultat local
- partage via le menu natif ou copie
- responsive mobile/tablette/PC

## Déploiement
À mettre sur GitHub puis importer le dépôt dans Vercel. Aucune variable d'environnement ni installation côté joueur.

## Autodarts
Le navigateur du joueur se connecte à `ws://127.0.0.1:3180/api/events?type=state`. Autodarts / Board Manager doit donc être actif sur le même PC que le navigateur.
