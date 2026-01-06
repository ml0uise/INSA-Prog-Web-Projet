function showGame(numberOfPlayers) {
    const game = document.getElementById("game");
    game.style.display = "flex";

    const canvas1 = document.getElementById("myCanvas1");
    canvas1.width = 1000;
    canvas1.style.display = "flex";

    if (numberOfPlayers === 2) {
        canvas1.width = 900;

        const canvas2 = document.getElementById("myCanvas2");
        canvas2.style.display = "flex"
    } else {
        const canvas2 = document.getElementById("myCanvas2");
        canvas2.style.display = "none"
    }

}

function hideGame() {
    const game = document.getElementById("game");
    game.style.display = "none";

    const canvas1 = document.getElementById("myCanvas1");
    canvas1.style.display = "none";


    const canvas2 = document.getElementById("myCanvas2");
    canvas2.style.display = "none"

}

function initialiseGame(user, numberOfPlayers, arrowLeft, arrowRight) {
    let canvas = null;
    let ctx = null;
    let backgroundMusic = null;

    if (user === "Player 1") {
        // Canvas / Context
        canvas = document.getElementById("myCanvas1");
        ctx = canvas.getContext("2d");

        // Audio
        backgroundMusic = new Audio("./assets/sounds/Around-the-Bend.wav");
        backgroundMusic.loop = true;
        backgroundMusic.volume = 1;
    }
    else if (user === "Player 2") {
        // Canvas / Context
        canvas = document.getElementById("myCanvas2");
        ctx = canvas.getContext("2d");

        // Audio
        backgroundMusic = null;
    }

    // Images
    const background = new Image();
    background.src = "./assets/images/amphiteater.jpg";

    const caracter = new Image();
    caracter.src = "./assets/images/pixel-caracter.png";

    const heartImg = new Image();
    heartImg.src = "./assets/images/heart.png";

    const brokenHeartImg = new Image();
    brokenHeartImg.src = "./assets/images/broken-heart.png";

    const goodNoteSoundA = new Audio("./assets/sounds/mixkit-winning-a-coin-video-game-2069.wav");
    const goodNoteSound = new Audio("./assets/sounds/mixkit-game-ball-tap-2073.wav");
    const badNoteSound = new Audio("./assets/sounds/mixkit-game-blood-pop-slide-2363.wav");
    const gameOverSound = new Audio("./assets/sounds/mixkit-player-losing-or-failing-2042.wav");

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
        caracterHeight: 250,
        numberOfPlayers,
        user,
        arrowRight,
        arrowLeft
    });

    return game;
}