/**
 * Displays the high score section and related UI elements.
 * This function makes the score, highscores table, and action button visible.
 */
function showHighScores() {
    const score = document.getElementById("score");
    const highScores = document.getElementById("highscores");
    const button = document.getElementById("button");

    // Show all highscore-related elements
    score.style.display = "flex";
    highScores.style.display = "flex";
    button.style.display = "flex";
}

/**
 * Hides the high score section and related UI elements.
 * This function is typically used when returning to gameplay or another screen.
 */
function hideHighScores() {
    const score = document.getElementById("score");
    const highScores = document.getElementById("highscores");
    const button = document.getElementById("button");

    // Hide all highscore-related elements
    score.style.display = "none";
    highScores.style.display = "none";
    button.style.display = "none";
}

/**
 * Determines whether the current session scores can modify the highscore list.
 * The comparison is based on the best score achieved among all active players.
 *
 * @param {number} numberOfPlayers - The number of active players in the session
 * @returns {boolean} True if highscores should be updated, otherwise false
 */
function will_change_highscores(numberOfPlayers) {
    const highscores = get_highscores();

    // If no highscores exist yet, the list must be updated
    if (highscores.length === 0) {
        return true;
    }

    // Retrieves the lowest score currently stored in the highscores list
    let min_score = parseInt(highscores.slice(-1)[0].score);

    let max_score_session = 0;
    let score_session = 0;

    // Iterates through all players to determine the best session score
    for (let i = 1; i <= numberOfPlayers; i++) {
        score_session = get_score_session(`Player ${i}`);
        if (score_session > max_score_session) {
            max_score_session = score_session;
        }
    }

    // Compares the best session score with the lowest stored highscore
    if (min_score <= max_score_session) {
        return true;
    } else {
        return false;
    }
}

/**
 * Updates the score displayed on screen.
 * The displayed value corresponds to the highest score among all players.
 *
 * @param {number} numberOfPlayers - The number of active players
 */
function set_score_text(numberOfPlayers) {
    const SPAN = document.querySelector("#score span");
    let max_score = 0;
    let user_score = 0;

    // Determines the highest score among all players
    for (let i = 1; i <= numberOfPlayers; i++) {
        user_score = get_score_session(`Player ${i}`);
        if (user_score > max_score) {
            max_score = user_score;
        }
    }

    // Updates the score display
    SPAN.textContent = String(max_score);
}

/**
 * Builds the highscore table dynamically.
 * Fills up to 10 rows with player names and scores.
 * Empty rows are filled with placeholder values.
 */
function set_highscore_table() {
    const TABLE_BODY = document.querySelector("#highscores-table tbody");
    const HIGHSCORES = get_highscores();

    // Clears existing table content before rebuilding it
    TABLE_BODY.innerHTML = "";

    // Generates exactly 10 rows for consistent table layout
    for (let i = 0; i < 10; i++) {
        const row = document.createElement("tr");

        const rankCell = document.createElement("td");
        const nameCell = document.createElement("td");
        const scoreCell = document.createElement("td");

        // Displays the rank index (always visible)
        rankCell.textContent = (i + 1).toString();

        // Populates the row if a highscore exists at this index
        if (HIGHSCORES.length > i) {
            nameCell.textContent = HIGHSCORES[i].name;
            scoreCell.textContent = HIGHSCORES[i].score;
        } else {
            // Uses placeholders for empty highscore slots
            nameCell.textContent = "-";
            scoreCell.textContent = "-";
        }

        row.appendChild(rankCell);
        row.appendChild(nameCell);
        row.appendChild(scoreCell);

        TABLE_BODY.appendChild(row);
    }
}

/**
 * Handles the full highscore display workflow.
 * Optionally updates highscores, then refreshes score text and table content.
 *
 * @param {number} numberOfPlayers - The number of active players
 * @param {boolean} update - Indicates whether highscores should be updated
 */
function printHighScores(numberOfPlayers, update) {
    let willChangeHighScores = will_change_highscores(numberOfPlayers);

    // Updates the highscores only if required and explicitly requested
    if (update && willChangeHighScores) {
        for (let i = 1; i <= numberOfPlayers; i++) {
            update_highscores(`Player ${i}`, get_score_session(`Player ${i}`));
        }
    }

    // Updates the displayed score and rebuilds the highscore table
    set_score_text(numberOfPlayers);
    set_highscore_table();
}
