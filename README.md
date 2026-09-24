# Open Darts — mini-jeux Autodarts

Version avec deux mini-jeux :

- **99 Fléchettes** : choisir une cible, 99 lancers, simple=1 / double=2 / triple=3 sur la cible.
- **9 Fléchettes** : 9 lancers, score réel de chaque zone, objectif = maximum de points.

Les deux jeux utilisent le flux local du Board Manager Autodarts via WebSocket sur `127.0.0.1:3180` / `localhost:3180`.

## Mise en ligne

1. Remplacer les fichiers du dépôt GitHub par le contenu de cette archive.
2. Vercel redéploie automatiquement si le dépôt est déjà connecté.
3. Partager l'URL du site.

Le joueur n'a rien à installer dans le navigateur. Pour que la détection Autodarts fonctionne, le **Board Manager Autodarts doit être ouvert sur le PC qui joue**.

## Heat map précise

Les jeux utilisent les coordonnées X/Y lorsqu'elles sont présentes dans l'événement `Throw detected`. Les impacts sont affichés individuellement sur le board, avec un halo et une couleur selon le type de lancer.

## Correction du dartboard

Le 20 est maintenant centré exactement en haut (12 heures). Les secteurs sont construits autour de l'axe central de chaque numéro au lieu d'être décalés d'un demi-secteur.
