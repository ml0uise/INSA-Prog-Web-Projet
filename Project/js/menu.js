/**
 * Displays the main menu buttons container.
 * Makes menu-level actions visible to the user.
 */
function showMenuButtons() {
    const menuButtons = document.getElementById("menu-buttons");

    menuButtons.style.display = "flex";
}

/**
 * Hides the main menu buttons container.
 * Used to reduce UI clutter while gameplay is active.
 */
function hideMenuButtons() {
    const menuButtons = document.getElementById("menu-buttons");

    menuButtons.style.display = "none";
}

/**
 * Switches the UI to the highscores view and renders the current scoreboard.
 * Explicitly disables gameplay gating flags to prevent menu/state transitions
 * from colliding with active input or in-canvas logic.
 *
 * Additional context:
 * - `direct` and the optional user/score parameters allow passing explicit
 *   winner/score context to the highscores workflow without relying solely
 *   on session state.
 *
 * @param {number} numberOfPlayers - Current player count (1 or 2)
 * @param {boolean} update - Whether highscores should be updated before rendering
 * @param {boolean} direct - Whether the caller provides explicit score context
 * @param {string|null} thisUser - Current player identifier (optional)
 * @param {number|null} thisScore - Current player score (optional)
 * @param {string|null} myUserFriend - Opponent identifier in multiplayer (optional)
 * @param {number|null} myUserFriendScore - Opponent score in multiplayer (optional)
 */
function viewHighscores(numberOfPlayers, update, direct=false, thisUser=null, thisScore=null, myUserFriend=null, myUserFriendScore=null) {
    // Freezes gameplay and marks the UI as outside of the game view.
    isPlaying = false;
    isGaming = false;

    // Hides canvases and exposes the highscores UI elements.
    hideMenuButtons();
    hideGame(numberOfPlayers);
    showHighScores();

    // Delegates persistence and rendering to the highscores workflow.
    printHighScores(numberOfPlayers, update, direct, thisUser, thisScore, myUserFriend, myUserFriendScore);

    // Background music volume.
    let bgm = game1.sfx.backgroundMusic;
    if (bgm) {
        try {
            bgm.volume = 0.5;
        } catch (e) {}
    }

    if (numberOfPlayers === 2 && direct) {
        twoPlayersWinnerAlert(thisUser, thisScore, myUserFriend, myUserFriendScore);
    }
}

/**
 * Switches the UI back to the gameplay view.
 * Hides the highscores panel and ensures the correct canvas layout
 * is displayed for the selected player count.
 *
 * @param {number} numberOfPlayers - Current player count (1 or 2)
 */
function viewGame(numberOfPlayers) {
    // Marks the UI as being in gameplay mode.
    isGaming = true;

    // Ensures highscores are hidden before showing the game canvases.
    hideHighScores();
    showGame(numberOfPlayers, preview);

    // Shows menu buttons only during preview mode.
    if (preview) {
        showMenuButtons();
    }
    else {
        hideMenuButtons();
    }
}

/**
 * Restarts an existing run after a game over.
 * Refreshes player names (session identity) and resets engine state
 * for the active number of players.
 *
 * @param {number} numberOfPlayers - Current player count (1 or 2)
 */
function restartGame(numberOfPlayers) {
    // Re-enables menu-gated controls disabled during gameplay.
    isPlaying = true;

    // Prompts again for player display names to allow quick identity changes.
    change_name(player1[0]);
    if (numberOfPlayers === 2) {
        change_name(player2[0])
    }

    // Ensures the UI is back in gameplay mode before restarting engines.
    viewGame(numberOfPlayers);

    // Restarts engine instances relevant to the active player count.
    game1.restart();
    if (numberOfPlayers === 2) {
        game2.restart();
    }
}

/**
 * Starts the game either in preview mode (no active session)
 * or as a real run with gameplay fully enabled.
 *
 * In non-preview mode, gameplay gating is enabled and player names are resolved.
 *
 * @param {number} numberOfPlayers - Current player count (1 or 2)
 * @param {boolean} preview - Whether this start is a preview boot
 */
function startGame(numberOfPlayers, preview) {
    // Real run: enables gameplay and resolves player identities.
    if (!preview) {
        isPlaying = true;
        change_name(player1[0]);
        if (numberOfPlayers === 2) {
            change_name(player2[0])
        }
        hideMenuButtons();
    } 
    else {
        // Preview mode exposes menu actions.
        showMenuButtons();
    }

    // Switches the UI into gameplay mode prior to starting engines.
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

/**
 * Toggles between single-player and two-player modes.
 * Updates engine configuration, UI labels, and canvas layout accordingly.
 */
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

    // Provides immediate feedback when toggling outside of gameplay.
    if (!isGaming) {
        alert(`YOU WILL NOW PLAY WITH ${numberOfPlayers} PLAYER${pluralization} !`);
    }
}

/**
 * Handles the primary start/restart intent.
 * Uses Enter, click, or equivalent actions to advance the main flow.
 */
function wantToStartHandler() {
    // Preview mode advances into a real run; otherwise triggers a restart.
    if (preview) {
        preview = false;
        startGame(numberOfPlayers, preview);
    }
    else if (!isGaming) {
        restartGame(numberOfPlayers);
    }
}

/**
 * Handles the request to view highscores.
 * In preview mode, it navigates directly to highscores.
 * During gameplay, it forces a game-over transition.
 */
function wantToSeeHighScoresHandler() {
    // Uses Space or UI buttons as a secondary action.
    if (preview) {
        viewHighscores(numberOfPlayers, false);
    }
    else {
        // Forces game over without immediately updating highscores.
        game1.gameOver(false);
        if (numberOfPlayers === 2) {
            game2.gameOver(false);
        }
    }
}

/**
 * Attaches global menu-level input listeners.
 * Handles keyboard and pointer interactions used outside of active gameplay.
 */
function attachMenuInput() {

    /**
     * Global keyboard listener for menu navigation and meta-actions.
     * Disabled while `isPlaying` is true to avoid interfering with in-game controls.
     */
    document.addEventListener("keydown", (event) => {
        // Processes meta-actions only when no run is actively in progress.
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

    // Maps a simple click on the canvas to the primary start/restart action.
    for (c of [canvas1, canvas2]) {
        c.addEventListener("click", (event) => {
            if (!isPlaying) {
                wantToStartHandler();
            }
        }, { passive: false });
    }

    // Maps a double-click gesture to toggling the number of players.
    for (c of [canvas1, canvas2]) {
        c.addEventListener("doucleClick", (event) => {
            if (!isPlaying) {
                wantToToggleNumberOfPlayersHandler();
            }
        }, { passive: false });
    }

    /**
     * Binds the retry button to the same start/restart behavior as the Enter key.
     * Provides mouse-driven access to the primary action.
     */
    const retryButton = document.getElementById("retry");
        
    retryButton.addEventListener("click", () => {
        wantToStartHandler();
    });

    /**
     * Binds the highscores button to explicitly display the highscores view.
     */
    const highscoresButton = document.getElementById("highscores-button");
        
    highscoresButton.addEventListener("click", () => {
        wantToSeeHighScoresHandler();
    });

    /**
     * Binds the player-count toggle button to switch between one and two players.
     */
    const toggleNumberOfPlayersButton = document.getElementById("toggleNumberOfPlayers-button");
        
    toggleNumberOfPlayersButton.addEventListener("click", () => {
        wantToToggleNumberOfPlayersHandler();
    });
}
