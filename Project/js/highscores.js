backgroundMusic = new Audio("../assets/sounds/Around-the-Bend.wav");
backgroundMusic.loop = true;
backgroundMusic.volume = 1;

backgroundMusic.play().catch(() => {});

function will_change_highscores() {
    const highscores = get_highscores();

    if (highscores.length === 0) {
        return true;
    }

    let min_score = parseInt(highscores.slice(-1)[0].score);

    if (min_score <= get_score_session()) {
        return true;
    } else {
        return false;
    }
}

function set_score_text() {
    const SPAN = document.querySelector("#score span");
    SPAN.textContent = String(get_score_session());
}

/**
 * Builds the highscore table dynamically.
 * Fills up to 10 rows with player name and score.
 */
function set_highscore_list() {
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

function on_load() {
    if (will_change_highscores()) {
        update_highscores(get_score_session());
    }

    set_score_text();
    set_highscore_list();

    add_blink_hover_listener();
}