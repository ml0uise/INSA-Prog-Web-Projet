var musicList = [
    "assets/VIdeogame Loops/Around the Bend.WAV",
    "assets/VIdeogame Loops/Behind the column.WAV",
    "assets/VIdeogame Loops/Catch The Mystery.WAV",
    "assets/VIdeogame Loops/Dark Intentions.WAV",
    "assets/VIdeogame Loops/Fancy Cakes.WAV",
    "assets/VIdeogame Loops/In defense of my stuff.WAV",
    "assets/VIdeogame Loops/In early time.WAV",
    "assets/VIdeogame Loops/In the back pocket_100 BPM.WAV",
    "assets/VIdeogame Loops/In the depths of the cave.WAV",
    "assets/VIdeogame Loops/In The Champ Elysees.WAV",
    "assets/VIdeogame Loops/Inside Dreams.WAV",
    "assets/VIdeogame Loops/In the spinning world.WAV",
    "assets/VIdeogame Loops/Killing Flies.WAV",
    "assets/VIdeogame Loops/The Crane Dance.WAV",
    "assets/VIdeogame Loops/The essence of good things.WAV",
    "assets/VIdeogame Loops/Under the hot sun.WAV",
    "assets/VIdeogame Loops/Waiting For Events.WAV",
    "assets/VIdeogame Loops/With Dirty Hands.WAV",
    "assets/VIdeogame Loops/With loose cords.WAV",
    "assets/VIdeogame Loops/With torn pants.WAV"
];

function pickRandomMusic() {
    let index = Math.floor(Math.random() * musicList.length);
    return musicList[index];
}

let chosenTrack = pickRandomMusic();
backgroundMusic = new Audio(chosenTrack);
backgroundMusic.loop = true;
backgroundMusic.volume = 1;

backgroundMusic.play().catch(() => {});

function blink_retry() {
    const RETRY = document.querySelector("#retry");
    
    // Toggle visibility
    if (RETRY.className === "hidden" || RETRY.matches(':hover')) {
        RETRY.className = "";
    } else {
        RETRY.className = "hidden";
    }
}

function add_blink_hover_listener() {
    const RETRY = document.querySelector("#retry");
    RETRY.addEventListener('mouseenter', () => {
    blink_retry();
    });
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

    add_blink_hover_listener();
}
