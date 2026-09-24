# Open Darts — 99 Fléchettes

Mini-jeu web pour Autodarts, hébergé sur Vercel.

## V3 — Heat map précise

Cette version conserve la détection automatique locale via le Board Manager et ajoute une heat map basée sur les coordonnées `x/y` du lancer lorsqu'elles sont présentes dans les données Autodarts.

- position réelle de chaque impact sur le dartboard ;
- 99 impacts conservés pendant la partie ;
- halo de densité autour des impacts ;
- couleur selon simple / double / triple / autre ;
- dernier impact légèrement agrandi ;
- survol d'un impact pour voir son numéro et ses coordonnées ;
- compteur `X/99 impacts positionnés` ;
- indication `COORDONNÉES RÉELLES` lorsque des coordonnées sont reçues ;
- statistiques temps réel, séries, moyennes et historique local.

Le code accepte plusieurs formes courantes de données (`coords.x/y`, `coordinates.x/y`, `position.x/y`, ou `x/y`). Les coordonnées normalisées Autodarts sont affichées autour du centre du board, avec `x` vers la droite et `y` vers le haut.

## Déploiement Vercel

1. Remplacer les fichiers de ton dépôt GitHub par ceux de cette archive.
2. Vercel détecte automatiquement la mise à jour du dépôt.
3. Ouvrir l'URL Vercel sur le PC qui possède le Board Manager Autodarts.
4. Le joueur n'a rien à installer : la page utilise la connexion locale au Board Manager.

## Important pour la heat map

Le navigateur doit être ouvert sur le même PC/réseau local que le Board Manager Autodarts, comme pour la version précédente.

Si l'indicateur reste sur `EN ATTENTE DES COORDONNÉES` alors que les lancers sont bien détectés, cela signifie que le flux local utilisé par cette installation ne transmet pas les coordonnées dans l'événement `Throw detected`. Dans ce cas, le jeu continue à compter les lancers normalement ; il faudra brancher la heat map sur le flux Autodarts qui expose les `coords`.
