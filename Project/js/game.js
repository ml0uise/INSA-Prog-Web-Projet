/**
 * Displays the game area and configures canvas visibility
 * based on the number of active players.
 *
 * @param {number} numberOfPlayers - The number of players selected
 */
function showGame(numberOfPlayers) {
    const game = document.getElementById("game");

    // Makes the main game container visible
    game.style.display = "flex";

    const canvas1 = document.getElementById("myCanvas1");

    // Sets default canvas size for single-player mode
    canvas1.width = 1000;
    canvas1.style.display = "flex";

    if (numberOfPlayers === 2) {
        // Reduces canvas width to accommodate a second canvas
        canvas1.width = 900;

        const canvas2 = document.getElementById("myCanvas2");

        // Displays the second canvas for Player 2
        canvas2.style.display = "flex"
    } else {
        const canvas2 = document.getElementById("myCanvas2");

        // Hides the second canvas when only one player is active
        canvas2.style.display = "none"
    }
}

/**
 * Hides the entire game interface, including all canvases.
 * This function is typically used when navigating away from gameplay.
 */
function hideGame() {
    const game = document.getElementById("game");

    // Hides the main game container
    game.style.display = "none";

    const canvas1 = document.getElementById("myCanvas1");

    // Hides Player 1 canvas
    canvas1.style.display = "none";

    const canvas2 = document.getElementById("myCanvas2");

    // Hides Player 2 canvas
    canvas2.style.display = "none"
}

/**
 * Initializes and configures a Game instance for a given player.
 * This includes canvas binding, assets loading, audio setup,
 * and control configuration.
 *
 * @param {string} user - The player identifier ("Player 1" or "Player 2")
 * @param {number} numberOfPlayers - Total number of active players
 * @param {string} arrowLeft - Key code for left movement
 * @param {string} arrowRight - Key code for right movement
 * @returns {Game} A fully configured Game instance
 */
function initialiseGame(user, numberOfPlayers, arrowLeft, arrowRight) {
    let canvas = null;
    let ctx = null;
    let backgroundMusic = null;

    if (user === "Player 1") {
        // Binds Player 1 to the primary canvas and rendering context
        canvas = document.getElementById("myCanvas1");
        ctx = canvas.getContext("2d");

        // Initializes background music for Player 1 only
        backgroundMusic = new Audio("./assets/sounds/Around-the-Bend.wav");
        backgroundMusic.loop = true;
        backgroundMusic.volume = 1;
    }
    else if (user === "Player 2") {
        // Binds Player 2 to the secondary canvas and rendering context
        canvas = document.getElementById("myCanvas2");
        ctx = canvas.getContext("2d");

        // Disables background music for Player 2 to avoid overlap
        backgroundMusic = null;
    }

    // Loads background image asset
    const background = new Image();
    background.src = "./assets/images/amphiteater.jpg";

    // Loads player character sprite
    const caracter = new Image();
    caracter.src = "./assets/images/pixel-caracter.png";

    // Loads life indicator image
    const heartImg = new Image();
    heartImg.src = "./assets/images/heart.png";

    // Loads broken life indicator image
    const brokenHeartImg = new Image();
    brokenHeartImg.src = "./assets/images/broken-heart.png";

    // Initializes sound effects for gameplay feedback
    const goodNoteSoundA = new Audio("./assets/sounds/mixkit-winning-a-coin-video-game-2069.wav");
    const goodNoteSound = new Audio("./assets/sounds/mixkit-game-ball-tap-2073.wav");
    const badNoteSound = new Audio("./assets/sounds/mixkit-game-blood-pop-slide-2363.wav");
    const gameOverSound = new Audio("./assets/sounds/mixkit-player-losing-or-failing-2042.wav");

    // Sets consistent volume levels for all sound effects
    goodNoteSoundA.volume = 1;
    goodNoteSound.volume = 1;
    badNoteSound.volume = 1;
    gameOverSound.volume = 1;

    // Builds the note type registry used by the game logic
    const noteTypes = buildNoteTypes();

    // Creates and configures the Game instance with all required dependencies
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

    // Returns the fully initialized game instance
    return game;
}
