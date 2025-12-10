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

function will_change_highscores() {
    const highscores = get_highscores();

    if (highscores.length === 0) {
        return false;
    }

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

function set_highscore_list() {
    const OL = document.querySelector("#highscores ol");
    const HIGHSCORES = get_highscores();

    let elem;
    let txt;
    let score;

    OL.innerHTML = ""; // Reset list

    for (let i = 0; i < 10; i++) {
        elem = document.createElement("li");

        if (HIGHSCORES.length - 1 >= i) {
            score = HIGHSCORES[i].name + " : " + HIGHSCORES[i].score;
        } else {
            score = "..........";
        }

        txt = document.createTextNode(score);
        elem.appendChild(txt);
        OL.appendChild(elem);
    }
}

function on_load() {
    if (will_change_highscores()) {
        change_name();
        update_highscores(get_score_session());
    }

    set_score_text();
    set_highscore_list();
}
