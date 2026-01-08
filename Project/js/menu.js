function showMenuButtons() {
    const menuButtons = document.getElementById("menu-buttons");

    menuButtons.style.display = "flex";
}

function hideMenuButtons() {
    const menuButtons = document.getElementById("menu-buttons");

    menuButtons.style.display = "none";
}

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
    isPlaying = false;
    isGaming = false;

    // Hides canvases and exposes the highscores UI elements.
    hideMenuButtons();
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
    showGame(numberOfPlayers, preview);

    if (preview) {
        showMenuButtons();
    }
    else {
        hideMenuButtons();
    }
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
    isPlaying = true;

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
        isPlaying = true;
        change_name(player1[0]);
        if (numberOfPlayers === 2) {
            change_name(player2[0])
        }
        hideMenuButtons();
    } 
    else {
        showMenuButtons();
    }

    // Switches the UI into gameplay mode prior to starting the engines.
    viewGame(numberOfPlayers, preview);

    // Starts the appropriate engine instances based on the player count.
    if (numberOfPlayers === 2) {
        game1.start(preview);
        game2.start(preview);
    } 
    else if (numberOfPlayers === 1) {
        game1.start(preview);
    }
}

function wantToToggleNumberOfPlayersHandler() {
    const toggleNumberOfPlayersButton = document.getElementById("toggleNumberOfPlayers-button");
    let pluralization = "";
    let toggleNumberOfPlayersButtonText = "";

    // Toggles between single-player and two-player modes.
    if (numberOfPlayers === 1) {
        numberOfPlayers = 2;
        toggleNumberOfPlayersButtonText = "REMOVE A PLAYER";
    }
    else if (numberOfPlayers === 2) {
        numberOfPlayers = 1;
        pluralization = "S";
        toggleNumberOfPlayersButtonText = "ADD A PLAYER";
    }

    toggleNumberOfPlayersButton.textContent = toggleNumberOfPlayersButtonText;

    // Propagates the player-count change into both engine instances.
    game1.numberOfPlayers = numberOfPlayers;
    game2.numberOfPlayers = numberOfPlayers;

    // Re-renders the appropriate canvas layout when currently in game view.
    if (isGaming) {
        viewGame(numberOfPlayers);
    }

    // Provides immediate user feedback with correct pluralization.
    if (!isGaming) {
        alert(`YOU WILL NOW PLAY WITH ${numberOfPlayers} PLAYER${pluralization} !`);
    }
}

function wantToStartHandler() {
    // Uses Enter as the primary "advance" action: start or restart.
    if (preview) {
        preview = false;
        startGame(numberOfPlayers, preview);
    }
    else if (!isGaming) {
        restartGame(numberOfPlayers);
    }
}

function wantToSeeHighScoresHandler() {
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

function attachMenuInput() {
    /**
     * Global keyboard listener responsible for menu navigation and meta-actions.
     * It is intentionally disabled while `playing` is true to avoid interfering
     * with in-game controls handled by the Game instances.
     */
    document.addEventListener("keydown", (event) => {
        // Only processes meta-actions when a run is not actively in progress.
        if (!isPlaying) {
            if (event.code === "KeyP") {
                wantToToggleNumberOfPlayersHandler();
            }
            else if (event.code === "Enter") {
                wantToStartHandler();
            }
            else if (event.code === "Space") {
                wantToSeeHighScoresHandler();
            }
        }
    });

    let canvas1 = document.getElementById("myCanvas1");
    let canvas2 = document.getElementById("myCanvas2");

    for (c of [canvas1, canvas2]) {
        c.addEventListener("click", (event) => {
            if (!isPlaying) {
                wantToStartHandler();
            }
        }, { passive: false });
    }

    for (c of [canvas1, canvas2]) {
        c.addEventListener("doucleClick", (event) => {
            if (!isPlaying) {
                wantToToggleNumberOfPlayersHandler();
            }
        }, { passive: false });
    }

    /**
     * Binds the retry button to the same start/restart behavior as the Enter key.
     * This provides mouse-driven access to the primary UI action.
     */
    const retryButton = document.getElementById("retry");
        
    retryButton.addEventListener("click", () => {
        wantToStartHandler();
    });

    const highscoresButton = document.getElementById("highscores-button");
        
    highscoresButton.addEventListener("click", () => {
        wantToSeeHighScoresHandler();
    });

    const toggleNumberOfPlayersButton = document.getElementById("toggleNumberOfPlayers-button");
        
    toggleNumberOfPlayersButton.addEventListener("click", () => {
        wantToToggleNumberOfPlayersHandler();
    });
}