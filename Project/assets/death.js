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

function set_score_text() {
    const SPAN = document.querySelector("#score span");
    SPAN.textContent = String(get_score_session());
}

function on_load() {
    set_score_text();
}
