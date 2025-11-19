# Upload on production server

Note: use eduVPN if not on eduroam

```bash
sftp LOGIN@etud.insa-toulouse.fr << EOF
put -r Project/* /home/cdura/public_html/3A-Projet-Prog-Web
EOF

# If it doesn't work, try to ssh first
# You can also copy paste the put command
```

# Access production server

https://etud.insa-toulouse.fr/~cdura/3A-Projet-Prog-Web

# Répartition taches

- Conceptialisation: L+F+C

- Score: L
    - Highscore
    - Last 10 highscores
    - Ask for user name when adding to highscore

- Player: F
    - Déplacement avec détection touche
    - PV

- Déplacemnt obstacles: F
    - Check si déplacement possible avant de générer nouveau blocs (2* hauteur du player?)
    - 5 colonnes
    - F / Fx

- Détection hitbox: C
    - Collision avec F: INSTA DEATH
    - Collision avec Fx: -1PV
    - Collision avec A: +1PV

- Ecran accueil: L

- Ecran mort: C
    - Bouton rejouer
    - Highscores

- Difficulté (logarithmique avec score): 
    - Génération pseudo aléatoire

- Zone de jeu globale: C
    - Score
    - Titre
    - Highscore
    - PV (coeurs)

- Graphismes: ChatGPT

- Rapport: L

# Références

> Canvas: https://www.w3schools.com/graphics/game_components.asp

