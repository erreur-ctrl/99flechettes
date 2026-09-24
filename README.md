# Open Darts — mini-jeux Autodarts

Mini-jeux web utilisables avec Autodarts sans installation côté joueur.

## Jeux

- `/99-darts/` — 99 fléchettes, cible choisie, 1/2/3 points selon simple/double/triple.
- `/9-darts/` — 9 fléchettes, objectif : meilleur score possible.

## V5

- Heat map avec impacts X/Y quand Autodarts fournit les coordonnées.
- Les statistiques, le feed et la heat map restent visibles après la fin de partie.
- Écran de résultat affiché sous le dashboard final.
- Classement local séparé pour chaque mini-jeu.
- Pseudo + score + date/heure conservés dans le navigateur.
- Pour 99 Fléchettes, le classement est séparé par cible afin de comparer des scores réalisés sur la même cible.
- Jusqu'à 100 résultats locaux sont conservés, avec affichage du top 10.

## Important : classement local

Le classement actuel utilise `localStorage`. Il est donc conservé sur le navigateur et l'appareil qui jouent, même après fermeture du navigateur. Il n'est pas partagé entre deux personnes ou deux appareils.

Pour un classement mondial/partagé entre tous les visiteurs, il faudra ajouter une petite base de données côté serveur (par exemple Supabase) et une API Vercel.

## Déploiement

Remplacer les fichiers du dépôt GitHub par ceux de cette archive puis laisser Vercel redéployer.
