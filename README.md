# 99 Fléchettes — version 100 % Web / Autodarts

Cette version est volontairement différente de la première : il n'y a PAS de bridge Node.js.

La page hébergée sur Vercel se connecte directement, depuis le navigateur de l'utilisateur, au WebSocket local du Board Manager Autodarts :

`ws://127.0.0.1:3180/api/events?type=state`

C'est le principe qui permet à une page web comme Open Darts / TupperDarts de proposer des mini-jeux locaux avec détection Autodarts.

## Utilisation

L'utilisateur final n'a rien à installer pour le mini-jeu.

Il doit simplement :

1. avoir Autodarts Desktop / Board Manager en fonctionnement sur son PC ;
2. ouvrir l'URL Vercel du jeu ;
3. choisir 1 à 20 ou BULL ;
4. cliquer sur COMMENCER ;
5. lancer les 99 fléchettes.

La page reçoit directement les événements de détection Autodarts.

## Déploiement Vercel

À mettre dans ton dépôt GitHub :

- index.html
- app.js
- style.css
- vercel.json

Puis dans Vercel :

Add New -> Project -> Import Git Repository -> Deploy.

Aucune variable d'environnement n'est nécessaire.

## Règle

Cible 1-20 :
- Sx = +1 si x est la cible
- Dx = +2 si x est la cible
- Tx = +3 si x est la cible
- toute autre zone = +0

BULL :
- Bull simple = +1
- Bullseye / double bull = +2

La partie compte exactement 99 détections de fléchettes.

## Important : le jeu et Autodarts

Le PC du joueur doit avoir Board Manager / Autodarts actif localement sur le port 3180.

Le joueur n'a PAS besoin de :
- Node.js
- npm
- bridge
- extension Chrome
- installation du jeu

## Pourquoi cela fonctionne

Le Board Manager Autodarts expose un WebSocket local `/api/events` sur le port 3180. Les messages de type `state` contiennent notamment l'événement `Throw detected`, le nombre de lancers et le dernier segment détecté avec `number`, `multiplier`, `bed` et `name`.

Le navigateur se connecte directement à cette adresse locale.

## Test

Avant de déployer, ouvre la page Vercel sur un PC où Autodarts fonctionne.

Le bandeau doit passer de :

"Connexion à Autodarts…"

à :

"Autodarts connecté"

Si ce n'est pas le cas, ouvre les outils développeur du navigateur (F12 -> Console) et envoie-moi l'erreur affichée. L'architecture est volontairement la même famille de connexion locale que les intégrations Autodarts qui consomment le WebSocket du Board Manager.

## Remarque

Cette application ne transmet pas les lancers à un serveur distant : le calcul du score se fait dans le navigateur du joueur.
