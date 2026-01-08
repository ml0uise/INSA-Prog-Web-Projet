/**
 * Displays the highscores UI section.
 * It makes the score banner, highscores container, and the action button visible
 * so the user can review results and trigger the next flow (retry/start).
 */
function showHighScores() {
    const score = document.getElementById("score");
    const highScores = document.getElementById("highscores");
    const button = document.getElementById("button");

    // Exposes all highscores-related UI blocks.
    score.style.display = "flex";
    highScores.style.display = "flex";
    button.style.display = "flex";
}

/**
 * Hides the highscores UI section.
 * It removes the score banner, highscores container, and action button from layout
 * so the gameplay view can take full focus.
 */
function hideHighScores() {
    const score = document.getElementById("score");
    const highScores = document.getElementById("highscores");
    const button = document.getElementById("button");

    // Collapses all highscores-related UI blocks.
    score.style.display = "none";
    highScores.style.display = "none";
    button.style.display = "none";
}

/**
 * Updates the score banner text in the highscores view.
 * In multiplayer, it explicitly shows the best score across both players.
 *
 * Two rendering modes exist:
 * - Session-based mode (direct=false): computes the best score from session storage.
 * - Direct mode (direct=true): computes the best score from explicitly provided values.
 *
 * @param {number} numberOfPlayers - Active player count (1 or 2)
 * @param {boolean} direct - Whether scores are provided directly instead of read from session storage
 * @param {number|null} thisScore - Current player's score when using direct mode
 * @param {number|null} myUserFriendScore - Opponent score when using direct mode (multiplayer)
 */
function set_score_text(numberOfPlayers, direct=false, thisScore=null, myUserFriendScore=null) {
    // Builds the label prefix; multiplayer emphasizes the best-of summary.
    let text = "Score: ";
    let max_score = 0;
    let scoreValue = "";

    const scoreValueElement = document.querySelector("#score-value");
    
    if (numberOfPlayers === 2) {
        text = `Best ${text}`;

        // Direct mode selects the maximum between the two provided scores.
        if (direct) {
            if (thisScore >= myUserFriendScore) {
                max_score = thisScore;
            }
            else {
                max_score = myUserFriendScore;
            }
        }
    }
    else if ((numberOfPlayers === 1) && direct) {
        max_score = thisScore;
    }
    
    if (!direct) {
        // Session-based mode reads and compares persisted per-player scores.
        let user_score = 0;

        for (let i = 1; i <= numberOfPlayers; i++) {
            user_score = get_score_session(`Player ${i}`);

            if (user_score > max_score) {
                max_score = user_score;
            }
        }        
    }
    // Updates the UI element with the computed best score.
    scoreValue = text + String(max_score);
    scoreValueElement.textContent = scoreValue;
}

/**
 * Rebuilds the highscores table body.
 * It always renders exactly 10 rows to preserve layout stability.
 * Missing entries are represented by placeholder values.
 */
function set_highscore_table() {
    const TABLE_BODY = document.querySelector("#highscores-table tbody");
    const HIGHSCORES = get_highscores();

    // Clears previous rows to avoid duplication on refresh.
    TABLE_BODY.innerHTML = "";

    // Renders a fixed number of rows for consistent UI alignment.
    for (let i = 0; i < 10; i++) {
        const row = document.createElement("tr");

        const rankCell = document.createElement("td");
        const nameCell = document.createElement("td");
        const scoreCell = document.createElement("td");

        // Rank is always displayed, even for empty slots.
        if (i === 0) {
            row.id = "majored";
            rankCell.textContent = "MAJOR";
        }
        else {
            rankCell.textContent = (i + 1).toString();
        }

        // Populates the row when a stored highscore exists for the current index.
        if (HIGHSCORES.length > i) {
            nameCell.textContent = HIGHSCORES[i].name;
            scoreCell.textContent = HIGHSCORES[i].score;
        } 
        else {
            // Uses placeholders when no highscore exists for this rank.
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
 * Orchestrates the highscores rendering workflow.
 * It can optionally update persisted highscores, then refreshes the score banner
 * and rebuilds the highscores table.
 *
 * Two modes exist:
 * - Direct mode: uses explicitly provided user/score pairs (useful for multiplayer coordination).
 * - Session-based mode: reads per-player scores from session storage.
 *
 * @param {number} numberOfPlayers - Active player count (1 or 2)
 * @param {boolean} update - Whether highscores should be updated before rendering
 * @param {boolean} direct - Whether the caller provides explicit score context
 * @param {string|null} thisUser - Current player identifier in direct mode
 * @param {number|null} thisScore - Current player score in direct mode
 * @param {string|null} myUserFriend - Opponent identifier in direct mode
 * @param {number|null} myUserFriendScore - Opponent score in direct mode
 */
function printHighScores(numberOfPlayers, update, direct=false, thisUser=null, thisScore=null, myUserFriend=null, myUserFriendScore=null) {
    // Direct mode typically occurs when multiplayer game-over results are coordinated externally.
    if (direct && update) {
        // Updates highscores only when requested.
        update_highscores(thisUser, thisScore);
        if (numberOfPlayers === 2) {
            update_highscores(myUserFriend, myUserFriendScore);
        }
        // Refreshes UI after optional persistence.
        set_score_text(numberOfPlayers, direct, thisScore);
        set_highscore_table();
    } 
    else {
        // Updates highscores only when requested.
        if (update) {
            for (let i = 1; i <= numberOfPlayers; i++) {
                update_highscores(`Player ${i}`, get_score_session(`Player ${i}`));
            }
        }

        // Refreshes UI after optional persistence.
        set_score_text(numberOfPlayers);
        set_highscore_table();
    }
}
