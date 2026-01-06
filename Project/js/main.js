/**
 * main.js
 * -------
 * Small entry point that start the game.
 */

function viewHighscores(numberOfPlayers, update) {
    playing = false;
    isGaming = false;
    hideGame(numberOfPlayers);
    showHighScores();
    printHighScores(numberOfPlayers, update);
}

function viewGame(numberOfPlayers) {
    isGaming = true;
    hideHighScores();
    showGame(numberOfPlayers);
}

function restartGame(numberOfPlayers) {
    playing = true;
    change_name(player1[0]);
    if (numberOfPlayers === 2) {
        change_name(player2[0])
    } else {
        erase_player2();
    }

    viewGame(numberOfPlayers);
    game1.restart();
    if (numberOfPlayers === 2) {
        game2.restart();
    }
}

function startGame(numberOfPlayers, preview) {
    if (!preview) {
        playing = true;
        change_name(player1[0]);
        if (numberOfPlayers === 2) {
            change_name(player2[0])
        } else {
            erase_player2();
        }
    }

    viewGame(numberOfPlayers);
    game1.start(preview)
    if (numberOfPlayers === 2) {
        game2.start(preview)
    }
}

let numberOfPlayers = 1;
let player1 = ["Player 1", "ArrowLeft", "ArrowRight"];
let player2 = ["Player 2", "KeyA", "KeyD"];

let preview = true;
let isGaming = true;
let playing = false;

const game1 = initialiseGame(player1[0], numberOfPlayers, player1[1], player1[2]);
const game2 = initialiseGame(player2[0], 2, player2[1], player2[2]);

// --- Keyboard event listener ---
document.addEventListener("keydown", (event) => {
    if (!playing) {
        if (event.code === "KeyP") {

            // Toggle between 1 and 2 players
            numberOfPlayers = (numberOfPlayers === 1) ? 2 : 1;

            game1.numberOfPlayers = numberOfPlayers;
            game2.numberOfPlayers = numberOfPlayers;

            if (isGaming) {
                viewGame(numberOfPlayers);
            }

            let s = (numberOfPlayers === 2) ? "s" : "";
            alert(`You will now play with ${numberOfPlayers} player${s} !`);
        }
        else if (event.code === "Enter") {
            if (preview) {
                preview = false;
                startGame(numberOfPlayers, preview);
            }
            else if (!isGaming) {
                restartGame(numberOfPlayers);
            }
        }
        else if (event.code === "Space") {
            if (preview) {
                viewHighscores(numberOfPlayers, false);
            }
            else {
                game1.gameOver(false);
                if (numberOfPlayers === 2) {
                    game2.gameOver(false);
                }
            }
        }
    }
});

const retryButton = document.getElementById("retry");
if (retryButton) {
    retryButton.addEventListener("click", () => {
        if (preview) {
            preview = false;
            startGame(numberOfPlayers, preview);
        }
        else if (!isGaming) {
            restartGame(numberOfPlayers);
        }
    });
}

startGame(numberOfPlayers, preview);
game2.start(2, preview);

erase_player2();