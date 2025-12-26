/**
 * main.js
 * -------
 * Small entry point that wires up the canvas, loads assets, constructs Game,
 * attaches input, handles auto-start, and kicks off the loop.
 */

// Canvas / Context
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

// Images
const background = new Image();
background.src = "../assets/images/amphiteater.png";

const caracter = new Image();
caracter.src = "../assets/images/pixel-caracter.png";

const heartImg = new Image();
heartImg.src = "../assets/images/heart.png";

const brokenHeartImg = new Image();
brokenHeartImg.src = "../assets/images/broken-heart.png";

// Audio
const backgroundMusic = new Audio("../assets/sounds/Around-the-Bend.wav");
backgroundMusic.loop = true;
backgroundMusic.volume = 1;

const goodNoteSoundA = new Audio("../assets/sounds/mixkit-winning-a-coin-video-game-2069.wav");
const goodNoteSound = new Audio("../assets/sounds/mixkit-game-ball-tap-2073.wav");
const badNoteSound = new Audio("../assets/sounds/mixkit-game-blood-pop-slide-2363.wav");
const gameOverSound = new Audio("../assets/sounds/mixkit-player-losing-or-failing-2042.wav");

goodNoteSoundA.volume = 1;
goodNoteSound.volume = 1;
badNoteSound.volume = 1;
gameOverSound.volume = 1;

// Note types registry (from noteType.js)
const noteTypes = buildNoteTypes();

// Game instance (from game.js)
const game = new Game({
    canvas,
    ctx,
    background,
    caracter,
    heartImg,
    brokenHeartImg,
    sfx: {
        backgroundMusic,
        goodA: goodNoteSoundA,
        good: goodNoteSound,
        bad: badNoteSound,
        gameOver: gameOverSound
    },
    noteTypes,
    noteWidth: 80,
    noteHeight: 80,
    caracterWidth: 150,
    caracterHeight: 250
});

// Input + optional auto-start + loop
game.attachInput();
game.tryAutoStartFromURL();
game.loop();
