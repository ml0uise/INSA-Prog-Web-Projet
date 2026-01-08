/**
 * Displays the game area and configures canvas visibility
 * according to the number of active players.
 *
 * @param {number} numberOfPlayers - Number of players selected
 */
function showGame(numberOfPlayers, preview) {
    const game = document.getElementById("game");

    // Makes the main game container visible.
    game.style.display = "flex";

    const canvas1 = document.getElementById("myCanvas1");
    const canvas2 = document.getElementById("myCanvas2");

    // Configures canvas size and visual state depending on preview mode.
    if (preview) {
        canvas1.height = 600;
        canvas2.height = 600;
        canvas1.style.animation = "canvasBlink 1s infinite";
        canvas2.style.animation = "canvasBlink 1s infinite";
        canvas1.classList.remove("no-hover-no-active");
        canvas2.classList.remove("no-hover-no-active");
    }
    else {
        canvas1.height = 800;
        canvas2.height = 800;
        canvas1.style.animation = "none";
        canvas2.style.animation = "none";
        canvas1.classList.add("no-hover-no-active");
        canvas2.classList.add("no-hover-no-active");
    }

    canvas1.width = 1000;
    canvas1.style.display = "flex";

    if (numberOfPlayers === 2) {
        // Reduces the first canvas width to make room for the second player.
        canvas1.width = 900;

        // Displays the second canvas for Player 2.
        canvas2.style.display = "flex"
    } else {
        // Hides the second canvas when running in single-player mode.
        canvas2.style.display = "none"
    }
}

/**
 * Hides the entire game interface, including all canvases.
 * Uses this when leaving gameplay or returning to menus.
 */
function hideGame() {
    const game = document.getElementById("game");

    // Hides the main game container.
    game.style.display = "none";

    const canvas1 = document.getElementById("myCanvas1");

    // Hides the Player 1 canvas.
    canvas1.style.display = "none";

    const canvas2 = document.getElementById("myCanvas2");

    // Hides the Player 2 canvas.
    canvas2.style.display = "none"
}

/**
 * Initializes and configures a Game instance for a specific player.
 * Binds the appropriate canvas, loads assets, configures audio,
 * and applies player-specific controls.
 *
 * @param {string} user - Player identifier ("Player 1" or "Player 2")
 * @param {number} numberOfPlayers - Total number of active players
 * @param {string} arrowLeft - Key code for left movement
 * @param {string} arrowRight - Key code for right movement
 * @returns {Game} Fully configured Game instance
 */
function initialiseGame(user, numberOfPlayers, arrowLeft, arrowRight) {
    let canvas = null;
    let ctx = null;
    let backgroundMusic = null;

    if (user === "Player 1") {
        // Binds Player 1 to the primary canvas and rendering context.
        canvas = document.getElementById("myCanvas1");
        ctx = canvas.getContext("2d");

        // Initializes background music for Player 1 only.
        backgroundMusic = new Audio("./assets/sounds/Around-the-Bend.wav");
        backgroundMusic.loop = true;
        backgroundMusic.volume = 1;
    }
    else if (user === "Player 2") {
        // Binds Player 2 to the secondary canvas and rendering context.
        canvas = document.getElementById("myCanvas2");
        ctx = canvas.getContext("2d");

        // Disables background music for Player 2 to prevent audio overlap.
        backgroundMusic = null;
    }

    // Loads the background image asset.
    const background = new Image();
    background.src = "./assets/images/amphiteater.jpg";

    // Loads the player character sprite.
    const caracter = new Image();
    caracter.src = "./assets/images/pixel-caracter.png";

    // Loads the life indicator sprite.
    const heartImg = new Image();
    heartImg.src = "./assets/images/heart.png";

    // Loads the broken life indicator sprite.
    const brokenHeartImg = new Image();
    brokenHeartImg.src = "./assets/images/broken-heart.png";

    // Initializes sound effects used for gameplay feedback.
    const goodNoteSoundA = new Audio("./assets/sounds/mixkit-winning-a-coin-video-game-2069.wav");
    const goodNoteSound = new Audio("./assets/sounds/mixkit-game-ball-tap-2073.wav");
    const badNoteSound = new Audio("./assets/sounds/mixkit-game-blood-pop-slide-2363.wav");
    const gameOverSound = new Audio("./assets/sounds/mixkit-player-losing-or-failing-2042.wav");

    // Applies consistent volume levels to all sound effects.
    goodNoteSoundA.volume = 1;
    goodNoteSound.volume = 1;
    badNoteSound.volume = 1;
    gameOverSound.volume = 1;

    // Builds the registry of note types used by the game logic.
    const noteTypes = buildNoteTypes();

    // Creates and configures the Game instance with all required dependencies.
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

    // Returns the fully initialized Game instance.
    return game;
}
