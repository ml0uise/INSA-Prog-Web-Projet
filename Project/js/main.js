/**
 * Switches the UI to the highscores view and renders the current scoreboard.
 * It explicitly disables gameplay gating flags to prevent menu/state transitions
 * from colliding with active input or in-canvas logic.
 *
 * Additional context:
 * - `direct` and the optional user/score parameters allow the caller to pass
 *   explicit winner/score context to the highscores workflow without relying
 *   solely on session state.
 *
 * @param {number} numberOfPlayers - Current player count (1 or 2)
 * @param {boolean} update - Whether highscores should be updated before rendering
 * @param {boolean} direct - Whether the caller provides explicit score context
 * @param {string|null} thisUser - The current player identifier (optional)
 * @param {number|null} thisScore - The current player's score (optional)
 * @param {string|null} myUserFriend - The opponent identifier in multiplayer (optional)
 * @param {number|null} myUserFriendScore - The opponent score in multiplayer (optional)
 */
function viewHighscores(numberOfPlayers, update, direct=false, thisUser=null, thisScore=null, myUserFriend=null, myUserFriendScore=null) {
    // Freezes gameplay and marks the UI as being out of the game view.
    playing = false;
    isGaming = false;

    // Hides canvases and exposes the highscores UI elements.
    hideGame(numberOfPlayers);
    showHighScores();

    // Delegates persistence and rendering to the highscores module.
    printHighScores(numberOfPlayers, update, direct, thisUser, thisScore, myUserFriend, myUserFriendScore);
}

/**
 * Switches the UI back to the gameplay view.
 * It hides the highscores panel and ensures the correct canvas layout
 * is displayed for the selected player count.
 *
 * @param {number} numberOfPlayers - Current player count (1 or 2)
 */
function viewGame(numberOfPlayers) {
    // Marks the UI as being in gameplay mode, enabling restart/start flows.
    isGaming = true;

    // Ensures highscores are hidden before showing the game canvases.
    hideHighScores();
    showGame(numberOfPlayers);
}

/**
 * Restarts an existing run after a game over.
 * It refreshes player names (session identity) and resets engine state
 * for the active number of players.
 *
 * @param {number} numberOfPlayers - Current player count (1 or 2)
 */
function restartGame(numberOfPlayers) {
    // Re-enables menu-gated controls that are disabled during gameplay.
    playing = true;

    // Re-prompts for player display names to allow quick identity changes.
    change_name(player1[0]);
    if (numberOfPlayers === 2) {
        change_name(player2[0])
    }

    // Ensures UI returns to gameplay before restarting engine instances.
    viewGame(numberOfPlayers);

    // Restarts the engine instances relevant to the active player count.
    game1.restart();
    if (numberOfPlayers === 2) {
        game2.restart();
    }
}

/**
 * Starts the game either in preview mode (no active session) or as a real run.
 * In non-preview mode, it enables gameplay gating and prompts for player names.
 *
 * @param {number} numberOfPlayers - Current player count (1 or 2)
 * @param {boolean} preview - Whether this start is a preview boot
 */
function startGame(numberOfPlayers, preview) {
    // In a real run, the start flow enables gameplay and resolves player names.
    if (!preview) {
        playing = true;
        change_name(player1[0]);
        if (numberOfPlayers === 2) {
            change_name(player2[0])
        }
    }

    // Switches the UI into gameplay mode prior to starting the engines.
    viewGame(numberOfPlayers);

    // Starts the appropriate engine instances based on the player count.
    if (numberOfPlayers === 2) {
        game1.start(preview);
        game2.start(preview);
    } 
    else if (numberOfPlayers === 1) {
        game1.start(preview);
    }
}

/**
 * Global session configuration and control mappings.
 * Each player entry encodes: [playerLabel, leftKeyCode, rightKeyCode].
 *
 * Note: the chosen bindings reflect an AZERTY-friendly setup:
 * - Player 1 uses Q/D
 * - Player 2 uses ArrowLeft/ArrowRight
 */
let numberOfPlayers = 1;
let player1 = ["Player 1", "KeyA", "KeyD"];
let player2 = ["Player 2", "ArrowLeft", "ArrowRight"];

/**
 * Global runtime flags controlling UI flow and input gating.
 * - preview: initial boot where engines can render without starting an active run
 * - isGaming: indicates whether the game canvases are currently displayed
 * - playing: gates menu-level inputs while a run is active
 */
let preview = true;
let isGaming = true;
let playing = false;

/**
 * Instantiates engine instances eagerly so assets and audio objects are loaded early.
 * Each instance is configured with its own user identifier and control mapping.
 *
 * Note: game2 is initialized with a fixed player-count argument to ensure it
 * can be preview-started and later switched into two-player mode.
 */
const game1 = initialiseGame(player1[0], numberOfPlayers, player1[1], player1[2]);
const game2 = initialiseGame(player2[0], 2, player2[1], player2[2]);

/**
 * Global keyboard listener responsible for menu navigation and meta-actions.
 * It is intentionally disabled while `playing` is true to avoid interfering
 * with in-game controls handled by the Game instances.
 */
document.addEventListener("keydown", (event) => {
    // Only processes meta-actions when a run is not actively in progress.
    if (!playing) {
        if (event.code === "KeyP") {

            // Toggles between single-player and two-player modes.
            numberOfPlayers = (numberOfPlayers === 1) ? 2 : 1;

            // Propagates the player-count change into both engine instances.
            game1.numberOfPlayers = numberOfPlayers;
            game2.numberOfPlayers = numberOfPlayers;

            // Re-renders the appropriate canvas layout when currently in game view.
            if (isGaming) {
                viewGame(numberOfPlayers);
            }

            // Provides immediate user feedback with correct pluralization.
            let s = (numberOfPlayers === 2) ? "S" : "";
            alert(`YOU WILL NOW PLAY WITH ${numberOfPlayers} PLAYER${s} !`);
        }
        else if (event.code === "Enter") {
            // Uses Enter as the primary "advance" action: start or restart.
            if (preview) {
                preview = false;
                startGame(numberOfPlayers, preview);
            }
            else if (!isGaming) {
                restartGame(numberOfPlayers);
            }
        }
        else if (event.code === "Space") {
            // Uses Space as a secondary action: view highscores or force game over.
            if (preview) {
                viewHighscores(numberOfPlayers, false);
            }
            else {
                // Forces game-over without updating highscores immediately.
                game1.gameOver(false);
                if (numberOfPlayers === 2) {
                    game2.gameOver(false);
                }
            }
        }
    }
});

/**
 * Binds the retry button to the same start/restart behavior as the Enter key.
 * This provides mouse-driven access to the primary UI action.
 */
const retryButton = document.getElementById("retry");
if (retryButton) {
    retryButton.addEventListener("click", () => {
        if (preview) {
            preview = false;
            startGame(numberOfPlayers, preview);
        }
        else if (!isGaming) {
            restartGame(numberOfPlayers);
        }
    });
}

/**
 * Boot sequence:
 * Starts the application in preview mode so visuals and assets are initialized.
 * The second engine instance is started as well to ensure it is ready when
 * two-player mode is enabled.
 */
startGame(numberOfPlayers, preview);
game2.start(2, preview);
