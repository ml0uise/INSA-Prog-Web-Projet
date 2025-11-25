var canvas = document.getElementById("myCanvas");
    var ctx = canvas.getContext("2d");

    const background = new Image();
    background.src = "assets/amphiteater.png";

    var difficultyLevel = 1;    // augmente avec le temps

    setInterval(() => {
        difficultyLevel++;
    }, 5000); // augmente toutes les 10s

    // --- Personnage / paddle ---
    var caracterHeight = 250;
    var caracterWidth = 150;
    var caracterX = (canvas.width - caracterWidth) / 2;
    var rightPressed = false;
    var leftPressed = false;

    // --- Score & vies (demi-vies possibles) ---
    var score = 0;
    var lives = 3; // peut descendre par pas de 0.5

    // --- Notes qui tombent ---
    var notes = [];
    var noteWidth = 80;
    var noteHeight = 80;

    // Définition des types de notes :
    // - weight : probabilité relative (décroissante)
    // - score  : gain de score (A > B > C > D > E)
    // - lifeDelta : variation de vie (Fx, F)
    var noteTypes = [
        { name: "A",  src: "assets/A.png",  weight: 3, score: 100, lifeDelta: 0   },
        { name: "B",  src: "assets/B.png",  weight: 4, score: 50, lifeDelta: 0   },
        { name: "C",  src: "assets/C.png",  weight: 5, score: 30, lifeDelta: 0   },
        { name: "D",  src: "assets/D.png",  weight: 6, score: 20, lifeDelta: 0   },
        { name: "E",  src: "assets/E.png",  weight: 7, score: 10, lifeDelta: 0   },
        { name: "Fx", src: "assets/Fx.png", weight: 4, score: 0,  lifeDelta: -0.5 },
        { name: "F",  src: "assets/F.png",  weight: 3, score: 0,  lifeDelta: -1  }
    ];

    // Préchargement des images
    noteTypes.forEach(function (t) {
        var img = new Image();
        img.src = t.src;
        t.image = img;
    });

    // Calcul de la somme des poids pour la sélection aléatoire
    var totalWeight = noteTypes.reduce(function (acc, t) {
        return acc + t.weight;
    }, 0);

    // Tire un type de note en fonction des poids (probabilités décroissantes)
    function getRandomNoteType() {
        var r = Math.random() * totalWeight;
        var sum = 0;
        for (var i = 0; i < noteTypes.length; i++) {
            sum += noteTypes[i].weight;
            if (r < sum) {
                return noteTypes[i];
            }
        }
        return noteTypes[noteTypes.length - 1]; // sécurité
    }

    function createNote() {
        var type = getRandomNoteType();
        var x = Math.random() * (canvas.width - noteWidth);

        // Mise à jour du niveau de vitesse :
        var speed = 2 + (difficultyLevel / 10) + Math.random() * difficultyLevel;

        notes.push({
            x: x,
            y: -noteHeight,
            dy: speed,
            type: type
        });
    }

    function updateNotes() {
        for (var i = notes.length - 1; i >= 0; i--) {
            var n = notes[i];

            // Mouvement vertical
            n.y += n.dy;

            // Disparition sous l'écran
            if (n.y > canvas.height) {
                notes.splice(i, 1);
                continue;
            }

            // Collision avec le paddle / personnage (collision rectangle-rectangle)
            var paddleTop = canvas.height - caracterHeight;
            var paddleBottom = canvas.height;
            var paddleLeft = caracterX;
            var paddleRight = caracterX + caracterWidth;

            var noteTop = n.y;
            var noteBottom = n.y + noteHeight;
            var noteLeft = n.x;
            var noteRight = n.x + noteWidth;

            var collisionHoriz =
                noteRight > paddleLeft &&
                noteLeft < paddleRight;
            var collisionVert =
                noteBottom > paddleTop &&
                noteTop < paddleBottom;

            if (collisionHoriz && collisionVert) {
                // Gestion score
                if (n.type.score > 0) {
                    score += n.type.score;
                }
                // Gestion vies (Fx, F)
                if (n.type.lifeDelta !== 0) {
                    lives += n.type.lifeDelta; // lifeDelta est négatif pour Fx, F
                    if (lives <= 0) {
                        alert("GAME OVER");
                        document.location.reload();
                        return;
                    }
                }

                // On supprime la note touchée
                notes.splice(i, 1);
            }
        }
    }

    function drawNotes() {
        for (var i = 0; i < notes.length; i++) {
            var n = notes[i];
            if (n.type.image) {
                ctx.drawImage(
                    n.type.image,
                    n.x,
                    n.y,
                    noteWidth,
                    noteHeight
                );
            } else {
                // Sécurité si l'image n'est pas chargée
                ctx.fillStyle = "#000";
                ctx.fillRect(n.x, n.y, noteWidth, noteHeight);
            }
        }
    }

    // --- Gestion des événements clavier ---
    document.addEventListener("keydown", keyDownHandler, false);
    document.addEventListener("keyup", keyUpHandler, false);

    function keyDownHandler(e) {
        if (e.code === "ArrowRight") {
            rightPressed = true;
        }
        else if (e.code === "ArrowLeft") {
            leftPressed = true;
        }
    }

    function keyUpHandler(e) {
        if (e.code === "ArrowRight") {
            rightPressed = false;
        }
        else if (e.code === "ArrowLeft") {
            leftPressed = false;
        }
    }

    // --- Image du personnage ---
    const caracter = new Image();

    caracter.addEventListener("load", () => {
        ctx.drawImage(
            caracter,
            caracterX,
            canvas.height - caracterHeight,
            caracterWidth,
            caracterHeight
        );
    });

    caracter.src = "assets/pixel-caracter.png";

    function drawPaddle() {
        ctx.beginPath();
        ctx.drawImage(
            caracter,
            caracterX,
            canvas.height - caracterHeight,
            caracterWidth,
            caracterHeight
        );
        ctx.closePath();
    }

    // --- Score & vies à l'écran ---
    function drawScore() {
        ctx.font = "24px Arial";
        ctx.fillStyle = "#0095DD";
        ctx.fillText("Score: " + score, 20, 40);
    }

    function drawLives() {
        ctx.font = "24px Arial";
        ctx.fillStyle = "#0095DD";
        ctx.fillText("Lives: " + lives.toFixed(1), canvas.width - 180, 40);
    }

    // --- Boucle de jeu principale ---
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

        // Mise à jour des notes
        updateNotes();

        // Apparition aléatoire des notes
        if (Math.random() < 0.03) { // ~3% de chance par frame
            createNote();
        }

        // Dessins
        drawPaddle();
        drawNotes();
        drawScore();
        drawLives();

        // Mouvement du personnage
        if (rightPressed && caracterX < canvas.width - caracterWidth) {
            caracterX += 10 + (difficultyLevel / 5);
        }
        else if (leftPressed && caracterX > 0) {
            caracterX -= 10 + (difficultyLevel / 5);
        }

        requestAnimationFrame(draw);
    }

    draw();