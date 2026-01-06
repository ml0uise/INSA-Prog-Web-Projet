// main.js

/**
 * Switches the UI to the highscores view and renders the current scoreboard.
 * This function also stops active gameplay flags to prevent input/state conflicts.
 *
 * @param {number} numberOfPlayers - Current player count (1 or 2)
 * @param {boolean} update - Whether highscores should be updated before rendering
 */
function viewHighscores(numberOfPlayers, update) {
    // Freezes gameplay state and transitions to the highscores screen.
    playing = false;
    isGaming = false;

    // Ensures game canvases are hidden before showing the highscores UI.
    hideGame(numberOfPlayers);
    showHighScores();

    // Renders score summary and highscore table (optionally updating persistence).
    printHighScores(numberOfPlayers, update);
}

/**
 * Switches the UI to the gameplay view.
 * This function hides highscores and makes the game canvases visible.
 *
 * @param {number} numberOfPlayers - Current player count (1 or 2)
 */
function viewGame(numberOfPlayers) {
    // Marks the UI as being in "game mode" to drive the restart/start flows.
    isGaming = true;

    // Ensures highscores UI is hidden before displaying the game canvases.
    hideHighScores();
    showGame(numberOfPlayers);
}

/**
 * Restarts an existing run after a game over.
 * It refreshes player names and resets both Game instances as needed.
 *
 * @param {number} numberOfPlayers - Current player count (1 or 2)
 */
function restartGame(numberOfPlayers) {
    // Enables gameplay input handling for the next run.
    playing = true;

    // Refreshes player identities for the upcoming session.
    change_name(player1[0]);
    if (numberOfPlayers === 2) {
        change_name(player2[0])
    }

    // Transitions UI back to gameplay.
    viewGame(numberOfPlayers);

    // Restarts the underlying Game engine instances.
    game1.restart();
    if (numberOfPlayers === 2) {
        game2.restart();
    }
}

/**
 * Starts the game either in preview mode or in a real run.
 * In non-preview mode, it prompts for player names and enables gameplay.
 *
 * @param {number} numberOfPlayers - Current player count (1 or 2)
 * @param {boolean} preview - Whether this start is a preview boot
 */
function startGame(numberOfPlayers, preview) {
    // In a real run, gameplay is enabled and player names are requested.
    if (!preview) {
        playing = true;
        change_name(player1[0]);
        if (numberOfPlayers === 2) {
            change_name(player2[0])
        }
    }

    // Ensures the UI is in gameplay mode before starting engine instances.
    viewGame(numberOfPlayers);

    // Starts Player 1 engine instance.
    game1.start(preview)

    // Starts Player 2 engine instance only when enabled.
    if (numberOfPlayers === 2) {
        game2.start(preview)
    }
}

/**
 * Global session configuration and control mappings.
 * The player arrays encode: [playerLabel, leftKeyCode, rightKeyCode].
 */
let numberOfPlayers = 1;
let player1 = ["Player 1", "KeyA", "KeyD"];
let player2 = ["Player 2", "ArrowLeft", "ArrowRight"];

/**
 * Global runtime flags controlling UI flow and input gating.
 * - preview: initial boot state where the loop runs but the session is not "live".
 * - isGaming: whether the UI currently shows the game canvases.
 * - playing: whether gameplay is currently active (input is locked when false).
 */
let preview = true;
let isGaming = true;
let playing = false;

/**
 * Game engine instances are created eagerly so assets are loaded early.
 * game1 uses the current numberOfPlayers variable; game2 is initialized with a fixed value.
 */
const game1 = initialiseGame(player1[0], numberOfPlayers, player1[1], player1[2]);
const game2 = initialiseGame(player2[0], 2, player2[1], player2[2]);

/**
 * Global keyboard listener driving menu/start/restart/multiplayer toggling.
 * This handler is intentionally gated by the `playing` flag to avoid conflicts during gameplay.
 */
document.addEventListener("keydown", (event) => {
    // Only processes menu/navigation controls when the game is not actively playing.
    if (!playing) {
        if (event.code === "KeyP") {

            // Toggles between 1 and 2 players.
            numberOfPlayers = (numberOfPlayers === 1) ? 2 : 1;

            // Propagates the player-count change into both Game instances.
            game1.numberOfPlayers = numberOfPlayers;
            game2.numberOfPlayers = numberOfPlayers;

            // Ensures the correct canvas layout is displayed when currently in game view.
            if (isGaming) {
                viewGame(numberOfPlayers);
            }

            // Provides user feedback with proper pluralization.
            let s = (numberOfPlayers === 2) ? "s" : "";
            alert(`You will now play with ${numberOfPlayers} player${s} !`);
        }
        else if (event.code === "Enter") {
            // Enter is used both to start the first run and to restart after a game over.
            if (preview) {
                preview = false;
                startGame(numberOfPlayers, preview);
            }
            else if (!isGaming) {
                restartGame(numberOfPlayers);
            }
        }
        else if (event.code === "Space") {
            // Space either opens highscores from the preview screen or forces a game over during a run.
            if (preview) {
                viewHighscores(numberOfPlayers, false);
            }
            else {
                // Forces game-over handling without updating highscores immediately.
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
 * This provides mouse/touch access to the primary UI action.
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
 * Starts the game in preview mode so visuals are available immediately.
 * Player 2 is also started to ensure its loop/assets are initialized when required.
 */
startGame(numberOfPlayers, preview);
game2.start(2, preview);
