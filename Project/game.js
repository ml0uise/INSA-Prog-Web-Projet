let canvas = document.getElementById("myCanvas");
let ctx = canvas.getContext("2d");

const background = new Image();
background.src = "assets/amphiteater.png";

const caracter = new Image();
caracter.src = "assets/pixel-caracter.png";

const heartImg = new Image();
heartImg.src = "assets/heart.png";

const brokenHeartImg = new Image();
brokenHeartImg.src = "assets/broken-heart.png";

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

noteTypes.forEach(function (t) {
    let img = new Image();
    img.src = t.src;
    t.image = img;
});

backgroundMusic = new Audio("assets/Around-the-Bend.wav");
backgroundMusic.loop = true;
backgroundMusic.volume = 1;

let goodNoteSoundA = new Audio("assets/mixkit-winning-a-coin-video-game-2069.wav");
let goodNoteSound = new Audio("assets/mixkit-game-ball-tap-2073.wav");
let badNoteSound = new Audio("assets/mixkit-game-blood-pop-slide-2363.wav");
let gameOverSound = new Audio("assets/mixkit-player-losing-or-failing-2042.wav");

goodNoteSoundA.volume = 1;
goodNoteSound.volume = 1;
badNoteSound.volume = 1;
gameOverSound.volume = 1;

let gameStarted = false;          // écran “press to start” tant que false
let startPromptBlinkStart = performance.now(); // base du clignotement
let difficultyIntervalId = null;  // pour démarrer la difficulté uniquement quand le jeu démarre

function startDifficultyRamp() {
    if (difficultyIntervalId !== null) return;
    difficultyIntervalId = setInterval(() => {
        difficultyLevel++;
    }, 5000);
}

const params = new URLSearchParams(window.location.search);
if (params.has("retry")) {
    gameStarted = true;       // démarre direct
    startDifficultyRamp();    // difficulté active

    backgroundMusic.play().catch(() => {});
}

let livesLostAnimStart = null;     // performance.now() quand on perd une vie
const livesLostAnimDuration = 500; // ms (pulse + shake)
let blinkStart = performance.now(); // référence pour le clignotement

let gameOver = false;
let gameOverAlreadyHandled = false;
let difficultyLevel = 1;    // augmente avec le temps

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
                lives += n.type.lifeDelta;

                if (n.type.lifeDelta < 0) {
                    livesLostAnimStart = performance.now();

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
            }

            // On supprime la note touchée
            notes.splice(i, 1);
        }
    }
}

// --- Gestion des événements clavier ---
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

function keyDownHandler(e) {

    // Démarrage du jeu (sauf si déjà démarré ou game over)
    if (!gameStarted && !gameOver && (e.code === "ArrowLeft" || e.code === "ArrowRight")) {
        gameStarted = true;
        startDifficultyRamp();

        backgroundMusic.play().catch(() => {});
    }

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

// --- Personnage ---
caracter.addEventListener("load", () => {
    ctx.drawImage(
        caracter,
        caracterX,
        canvas.height - caracterHeight,
        caracterWidth,
        caracterHeight
    );
});

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

function drawLives() {
    ctx.save();

    const heartSize = 60;     // taille d’un cœur
    const spacing = 8;        // espace entre cœurs
    const marginRight = 20;
    const marginTop = 18;

    const full = Math.floor(lives);
    const hasHalf = (lives % 1 !== 0) ? 1 : 0;

    // --- Clignotement si lives <= 1 ---
    // Alpha oscille entre ~0.25 et 1.0
    if (lives <= 1) {
        const t = (performance.now() - blinkStart) / 1000; // secondes
        const blink = 0.25 + 0.75 * Math.abs(Math.sin(t * Math.PI * 2)); // ~2Hz
        ctx.globalAlpha = blink;
    }

    // --- Animation quand une vie est perdue (pulse + shake) ---
    let scale = 1;
    let shakeX = 0;
    let shakeY = 0;

    if (livesLostAnimStart !== null) {
        const elapsed = performance.now() - livesLostAnimStart;

        if (elapsed <= livesLostAnimDuration) {
            const p = elapsed / livesLostAnimDuration; // 0..1

            // Pulse: monte puis redescend (ease simple)
            const pulse = Math.sin(p * Math.PI); // 0..1..0
            scale = 1 + 0.18 * pulse;

            // Shake léger
            shakeX = (Math.random() - 0.5) * 4;
            shakeY = (Math.random() - 0.5) * 3;
        } else {
            livesLostAnimStart = null;
        }
    }

    // --- Glow néon autour des cœurs ---
    // (Le glow s’applique aux drawImage tant que shadowBlur>0)
    ctx.shadowColor = "#ff3333";
    ctx.shadowBlur = 18;

    // Position de départ (aligné à droite)
    let x = canvas.width - marginRight;
    let y = marginTop;

    // On dessine de droite vers la gauche
    // Demi-cœur (broken-heart) en dernier visuellement
    if (hasHalf) {
        x -= heartSize;

        ctx.save();
        ctx.translate(x + heartSize / 2 + shakeX, y + heartSize / 2 + shakeY);
        ctx.scale(scale, scale);
        ctx.drawImage(brokenHeartImg, -heartSize / 2, -heartSize / 2, heartSize, heartSize);
        ctx.restore();

        x -= spacing;
    }

    // Cœurs pleins
    for (let i = 0; i < full; i++) {
        x -= heartSize;

        ctx.save();
        ctx.translate(x + heartSize / 2 + shakeX, y + heartSize / 2 + shakeY);
        ctx.scale(scale, scale);
        ctx.drawImage(heartImg, -heartSize / 2, -heartSize / 2, heartSize, heartSize);
        ctx.restore();

        x -= spacing;
    }

    ctx.restore();
}

function drawPressToStart() {
    ctx.save();

    // clignotement façon game over
    const t = (performance.now() - startPromptBlinkStart) / 1000;
    const blink = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * Math.PI * 4)); // ~2Hz
    ctx.globalAlpha = blink;

    ctx.font = "bold 36px 'Press Start 2P', cursive";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#00faff"; // bleu néon

    // Glow layers bleu néon
    ctx.shadowColor = "#00faff";
    ctx.shadowBlur = 10;
    ctx.fillText("PRESS LEFT/RIGHT ARROW", canvas.width / 2, canvas.height / 2 - 30);

    ctx.shadowColor = "#00e1ff";
    ctx.shadowBlur = 25;
    ctx.fillText("PRESS LEFT/RIGHT ARROW", canvas.width / 2, canvas.height / 2 - 30);

    ctx.shadowBlur = 50;
    ctx.fillText("PRESS LEFT/RIGHT ARROW", canvas.width / 2, canvas.height / 2 - 30);

    ctx.shadowColor = "#00faff";
    ctx.shadowBlur = 10;
    ctx.fillText("TO START", canvas.width / 2, canvas.height / 2 + 40);

    ctx.shadowColor = "#00e1ff";
    ctx.shadowBlur = 25;
    ctx.fillText("TO START", canvas.width / 2, canvas.height / 2 + 40);

    ctx.shadowBlur = 50;
    ctx.fillText("TO START", canvas.width / 2, canvas.height / 2 + 40);

    ctx.restore();
}

function drawGameOver() {
    ctx.save();

    // --- Clignotement (alpha oscillant) ---
    const t = performance.now() / 1000;                 // secondes
    const blink = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * Math.PI * 4)); 
    // ~2 Hz (change 4 -> 6 pour plus rapide)
    ctx.globalAlpha = blink;

    // Texte GAME OVER au centre
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

    // Si pas démarré, afficher l'écran de démarrage et STOPPER la logique de jeu
    if (!gameStarted && !gameOver) {
        drawPressToStart();
        requestAnimationFrame(draw);
        return;
    }

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