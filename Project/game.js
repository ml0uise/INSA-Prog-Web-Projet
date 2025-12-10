let canvas = document.getElementById("myCanvas");
let ctx = canvas.getContext("2d");

const background = new Image();
background.src = "assets/amphiteater.png";

var musicList = [
    "assets/VIdeogame Loops/Around the Bend.WAV",
    "assets/VIdeogame Loops/Behind the column.WAV",
    "assets/VIdeogame Loops/Catch The Mystery.WAV",
    "assets/VIdeogame Loops/Dark Intentions.WAV",
    "assets/VIdeogame Loops/Fancy Cakes.WAV",
    "assets/VIdeogame Loops/In defense of my stuff.WAV",
    "assets/VIdeogame Loops/In early time.WAV",
    "assets/VIdeogame Loops/In the back pocket_100 BPM.WAV",
    "assets/VIdeogame Loops/In the depths of the cave.WAV",
    "assets/VIdeogame Loops/In The Champ Elysees.WAV",
    "assets/VIdeogame Loops/Inside Dreams.WAV",
    "assets/VIdeogame Loops/In the spinning world.WAV",
    "assets/VIdeogame Loops/Killing Flies.WAV",
    "assets/VIdeogame Loops/The Crane Dance.WAV",
    "assets/VIdeogame Loops/The essence of good things.WAV",
    "assets/VIdeogame Loops/Under the hot sun.WAV",
    "assets/VIdeogame Loops/Waiting For Events.WAV",
    "assets/VIdeogame Loops/With Dirty Hands.WAV",
    "assets/VIdeogame Loops/With loose cords.WAV",
    "assets/VIdeogame Loops/With torn pants.WAV"
];

function pickRandomMusic() {
    let index = Math.floor(Math.random() * musicList.length);
    return musicList[index];
}

let chosenTrack = pickRandomMusic();
backgroundMusic = new Audio(chosenTrack);
backgroundMusic.loop = true;
backgroundMusic.volume = 1;

backgroundMusic.play().catch(() => {});

let goodNoteSoundA = new Audio("assets/mixkit-winning-a-coin-video-game-2069.wav");
let goodNoteSound = new Audio("assets/mixkit-game-ball-tap-2073.wav");
let badNoteSound = new Audio("assets/mixkit-game-blood-pop-slide-2363.wav");
let gameOverSound = new Audio("assets/mixkit-player-losing-or-failing-2042.wav");

goodNoteSoundA.volume = 1;
goodNoteSound.volume = 1;
badNoteSound.volume = 1;
gameOverSound.volume = 1;

let gameOver = false;
let gameOverAlreadyHandled = false;
let difficultyLevel = 1;    // augmente avec le temps

setInterval(() => {
    difficultyLevel++;
}, 5000); // augmente toutes les 10s

// --- Personnage / paddle ---
let caracterHeight = 250;
let caracterWidth = 150;
let caracterX = (canvas.width - caracterWidth) / 2;
let rightPressed = false;
let leftPressed = false;

// --- Score & vies (demi-vies possibles) ---
let score = 0;
let lives = 3; // peut descendre par pas de 0.5

// --- Notes qui tombent ---
let notes = [];
let noteWidth = 80;
let noteHeight = 80;

// Définition des types de notes :
// - weight : probabilité relative (décroissante)
// - score  : gain de score (A > B > C > D > E)
// - lifeDelta : variation de vie (Fx, F)
let noteTypes = [
    { name: "A",  src: "assets/A.png",  weight: 5/100, score: 100, lifeDelta: 0.25   },
    { name: "B",  src: "assets/B.png",  weight: 10/100, score: 50, lifeDelta: 0   },
    { name: "C",  src: "assets/C.png",  weight: 15/100, score: 30, lifeDelta: 0   },
    { name: "D",  src: "assets/D.png",  weight: 15/100, score: 20, lifeDelta: 0   },
    { name: "E",  src: "assets/E.png",  weight: 15/100, score: 10, lifeDelta: 0   },
    { name: "Fx", src: "assets/Fx.png", weight: 25/100, score: 0,  lifeDelta: -0.5 },
    { name: "F",  src: "assets/F.png",  weight: 15/100, score: 0,  lifeDelta: -1  }
];

// Préchargement des images
noteTypes.forEach(function (t) {
    let img = new Image();
    img.src = t.src;
    t.image = img;
});

// Calcul de la somme des poids pour la sélection aléatoire
let totalWeight = noteTypes.reduce(function (acc, t) {
    return acc + t.weight;
}, 0);

// Tire un type de note en fonction des poids (probabilités décroissantes)
function getRandomNoteType() {
    let r = Math.random() * totalWeight;
    let sum = 0;
    for (let i = 0; i < noteTypes.length; i++) {
        sum += noteTypes[i].weight;
        if (r < sum) {
            return noteTypes[i];
        }
    }
    return noteTypes[noteTypes.length - 1]; // sécurité
}

function createNote() {
    let type = getRandomNoteType();
    let x = Math.random() * (canvas.width - noteWidth);

    // Mise à jour du niveau de vitesse :
    let speed = 2 + (difficultyLevel / 10) + Math.random() * difficultyLevel;

    notes.push({
        x: x,
        y: -noteHeight,
        dy: speed,
        type: type
    });
}

function updateNotes() {
    for (let i = notes.length - 1; i >= 0; i--) {
        let n = notes[i];

        // Mouvement vertical
        n.y += n.dy;

        // Disparition sous l'écran
        if (n.y > canvas.height) {
            notes.splice(i, 1);
            continue;
        }

        if (gameOver) {
            continue;
        }

        // Collision avec le paddle / personnage (collision rectangle-rectangle)
        let paddleTop = canvas.height - caracterHeight;
        let paddleBottom = canvas.height;
        let paddleLeft = caracterX;
        let paddleRight = caracterX + caracterWidth;

        let noteTop = n.y;
        let noteBottom = n.y + noteHeight;
        let noteLeft = n.x;
        let noteRight = n.x + noteWidth;

        let collisionHoriz =
            noteRight > paddleLeft &&
            noteLeft < paddleRight;
        let collisionVert =
            noteBottom > paddleTop &&
            noteTop < paddleBottom;

        if (collisionHoriz && collisionVert) {
            // Gestion score
            if (n.type.score > 0) {
                score += n.type.score;

                try {
                    if (n.type.name === "A") {
                        goodNoteSoundA.currentTime = 0;
                        goodNoteSoundA.play();
                    } else {
                        goodNoteSound.currentTime = 0;
                        goodNoteSound.play();
                    }
                } catch (e) {}
            }
            // Gestion vies (Fx, F)
            if (n.type.lifeDelta !== 0) {
                lives += n.type.lifeDelta; // lifeDelta est négatif pour Fx, 
                
                try {
                    badNoteSound.currentTime = 0;
                    badNoteSound.play();
                } catch (e) {}

                if (lives <= 0) {
                    lives = 0;
                    gameOver = true;
                    try {
                        gameOverSound.currentTime = 0;
                        gameOverSound.play();
                    } catch (e) {}
                }
            }

            // On supprime la note touchée
            notes.splice(i, 1);
        }
    }
}

function drawNotes() {
    for (let i = 0; i < notes.length; i++) {
        let n = notes[i];
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
    ctx.save();

    ctx.font = "bold 2em 'Press Start 2P', cursive";
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.fillStyle = "#00faff";

    // Glow bleu néon
    ctx.shadowColor = "#00faff";
    ctx.shadowBlur = 8;
    ctx.fillText("SCORE: " + score, 20, 40);

    ctx.shadowColor = "#00e1ff";
    ctx.shadowBlur = 20;
    ctx.fillText("SCORE: " + score, 20, 40);

    ctx.shadowBlur = 40;
    ctx.fillText("SCORE: " + score, 20, 40);

    ctx.restore();
}

function getHeartString(lives) {
    const fullHeart = "❤️";    // cœur plein
    const halfHeart = "💔";   // demi-cœur (visuellement cassé, mais lisible)

    let hearts = "";
    let full = Math.floor(lives);     // nombre de cœurs pleins
    let half = (lives % 1 !== 0) ? 1 : 0;   // un demi-cœur si nécessaire

    // Ajouter les cœurs pleins
    for (let i = 0; i < full; i++) {
        hearts += fullHeart + " ";
    }

    // Ajouter un demi-cœur si .5
    if (half === 1) {
        hearts += halfHeart + " ";
    }

    return hearts.trim();
}

function drawLives() {
    ctx.save();

    ctx.font = "bold 32px 'Press Start 2P', cursive";
    ctx.textBaseline = "top";
    ctx.textAlign = "right";
    ctx.fillStyle = "#00faff";

    // Glow néon bleu
    ctx.shadowColor = "#00faff";
    ctx.shadowBlur = 8;

    const heartString = getHeartString(lives);

    ctx.fillText(heartString, canvas.width - 20, 20);

    ctx.shadowColor = "#00e1ff";
    ctx.shadowBlur = 20;
    ctx.fillText(heartString, canvas.width - 20, 20);

    ctx.shadowBlur = 40;
    ctx.fillText(heartString, canvas.width - 20, 20);

    ctx.restore();
}

function drawGameOver() {
    // Texte GAME OVER au centre
    ctx.save();    
    
    ctx.font = "bold 72px 'Press Start 2P', cursive";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ff0033"; // Rouge néon principal

    // Première couche : glow rouge très profond
    ctx.shadowColor = "#ff0033";
    ctx.shadowBlur = 15;
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);

    // Deuxième couche : rouge bordeaux sombre
    ctx.shadowColor = "#ff3333";
    ctx.shadowBlur = 35;
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);

    // Troisième couche : halo rubis noir (très sombre)
    ctx.shadowColor = "#330008";
    ctx.shadowBlur = 70;
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);

    ctx.restore();

    // Appel unique : enregistrement du score + redirection
    if (!gameOverAlreadyHandled) {
        gameOverAlreadyHandled = true;

        // Mise à jour du score de la session
        set_score_session(score);

        // Délai pour que le joueur voie le message
        setTimeout(function () {
            document.location.href = "death.html";
        }, 2000);
    }
}

// --- Boucle de jeu principale ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    // Mise à jour des notes
    updateNotes();

    // Apparition aléatoire des notes
    if (!gameOver && Math.random() < 0.03 + (difficultyLevel / 300)) {
        createNote();
    }

    // Dessins
    drawPaddle();
    drawNotes();
    drawScore();
    drawLives();

    if (gameOver) {
        drawGameOver();
        // return;
    } else {
        // Mouvement du personnage
        if (rightPressed && caracterX < canvas.width - caracterWidth) {
            caracterX += 10 + (difficultyLevel / 5);
        }
        else if (leftPressed && caracterX > 0) {
            caracterX -= 10 + (difficultyLevel / 5);
        }
    }

    requestAnimationFrame(draw);
}

draw();