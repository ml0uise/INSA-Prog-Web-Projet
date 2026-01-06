function showHighScores() {
    const score = document.getElementById("score");
    const highScores = document.getElementById("highscores");
    const button = document.getElementById("button");

    score.style.display = "flex";
    highScores.style.display = "flex";
    button.style.display = "flex";
}

function hideHighScores() {
    const score = document.getElementById("score");
    const highScores = document.getElementById("highscores");
    const button = document.getElementById("button");

    score.style.display = "none";
    highScores.style.display = "none";
    button.style.display = "none";
}

function will_change_highscores(numberOfPlayers) {
    const highscores = get_highscores();

    if (highscores.length === 0) {
        return true;
    }

    let min_score = parseInt(highscores.slice(-1)[0].score);

    for (let i = 1; i <= numberOfPlayers; i++) {
        if (min_score <= get_score_session(`Player ${i}`)) {
            return true;
        } else {
            return false;
        }
    }

}

function set_score_text(numberOfPlayers) {
    const SPAN = document.querySelector("#score span");
    let max_score = 0;
    let user_score = 0;
    for (let i = 1; i <= numberOfPlayers; i++) {
        user_score = get_score_session(`Player ${i}`);
        if (user_score > max_score) {
            max_score = user_score;
        }
    }
    SPAN.textContent = String(max_score);
}

/**
 * Builds the highscore table dynamically.
 * Fills up to 10 rows with player name and score.
 */
function set_highscore_table() {
    const TABLE_BODY = document.querySelector("#highscores-table tbody");
    const HIGHSCORES = get_highscores();

    // Reset table body
    TABLE_BODY.innerHTML = "";

    for (let i = 0; i < 10; i++) {
        const row = document.createElement("tr");

        const rankCell = document.createElement("td");
        const nameCell = document.createElement("td");
        const scoreCell = document.createElement("td");

        // Rank (always displayed)
        rankCell.textContent = (i + 1).toString();

        if (HIGHSCORES.length > i) {
            nameCell.textContent = HIGHSCORES[i].name;
            scoreCell.textContent = HIGHSCORES[i].score;
        } else {
            nameCell.textContent = "-";
            scoreCell.textContent = "-";
        }

        row.appendChild(rankCell);
        row.appendChild(nameCell);
        row.appendChild(scoreCell);

        TABLE_BODY.appendChild(row);
    }
}

function printHighScores(numberOfPlayers, update) {
    if (update) {
        if (will_change_highscores(numberOfPlayers)) {
            for (let i = 1; i <= numberOfPlayers; i++) {
                update_highscores(`Player ${i}`,get_score_session(`Player ${i}`));
            }
        }
    }

    set_score_text(numberOfPlayers);
    set_highscore_table();
}