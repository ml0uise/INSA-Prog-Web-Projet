function blink_retry() {
    const RETRY = document.querySelector("#retry");
    
    // Toggle visibility
    if (RETRY.className === "hidden") {
        RETRY.className = "";
    } else {
        RETRY.className = "hidden";
    }
}

setInterval(blink_retry, 1000);

function retry() {
    document.location.href = "../game.html";
}

function will_change_highscores() {
    let highscores = get_highscores();
    let min_score = highscores.slice(-1)[0].score;

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

function on_load() {
    if (will_change_highscores()) {
        change_name();
        update_highscores(get_score_session());
    }

    set_score_text();
}
