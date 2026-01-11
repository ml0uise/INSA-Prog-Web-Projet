/*
 * -----------------------------------------------------------------------------
 * Session Easter Egg (Non-functional)
 * -----------------------------------------------------------------------------
 *
 *            The holy cookie shall visit you.
 *
 *       Can it live in your session for the day?
 *
 *        [ X ] YES               [   ] Also YES
 *
 * (ASCII art preserved intentionally)

⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠿⠛⠋⠉⠀⠀⠀⠘⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠟⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡻⠋⠁⠀⠀⠀⠀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠙⠻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣻⠋⠀⠀⠀⠠⠖⠋⠉⠀⠀⠀⠀⣾⠉⢳⠀⠀⠀⠀⠀⠻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⡿⡱⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠛⠉⠀⠀⠀⠐⠲⠦⣄⠉⠉⠻⣿⣿⣿⡿⠟⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⢱⠁⠀⠀⠀⠀⣠⢤⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠁⠀⠀⠀⠀⠀⠀⠀⠘⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⡇⡆⠀⠀⠀⠀⠠⠷⠴⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⣿⣿⡿⠿⠿⠻⣿⣿⣿
⣿⣿⣿⣿⣿⠃⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣄⡀⠀⠀⠀⠀⢠⡞⠳⣆⠈⣿⡀⠀⣠⠄⠀⢸⣿⣿
⣿⣿⣿⣿⣿⢰⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠿⣦⡀⠀⠀⠀⠀⠀⠀⣰⡿⠏⠁⠀⠀⠀⠀⠀⠘⢧⣠⠟⠀⢹⣧⠈⠀⠀⣀⣾⣿⣿
⣿⣿⣿⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣴⣾⠟⠁⠀⠀⠀⠀⠀⠀⠙⠿⣴⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣷⣶⣶⣿⣿⣿⣿⣿
⣿⣿⣿⣿⡏⠀⠀⠀⠀⢸⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣧⢰⠀⠀⠀⢸⠀⠀⠀⠀⠀⠀⠀⠀⠀⣾⠛⠛⠛⠉⠉⠉⠉⠙⣷⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣾⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⡄⡆⠀⠀⠈⠂⠀⠀⠀⠀⠀⠀⠀⠀⢻⡀⠀⠀⠀⠀⠀⠀⢠⡏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣸⠀⠀⢀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢳⡴⠶⣶⣶⣀⣠⠟⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⡤⢠⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⡿⠀⠀⠈⢧⠀⠀⠀⣀⠀⠀⠀⠀⠀⠀⠙⠻⢥⡤⠞⠉⠀⠀⠀⠀⠀⠀⠀⠀⠐⠚⠉⢰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣇⡄⠀⡠⠈⢧⣺⣍⠉⣻⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⠤⠤⢄⡀⠀⠀⠀⠀⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⢣⠘⠁⠀⠀⢳⣍⠉⠁⠀⠀⠀⠀⠐⠢⣤⣀⡀⠀⠀⠀⠛⠦⠤⠞⠁⠀⠀⣠⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣯⣢⣄⣀⣀⣼⣿⣷⣦⡀⠀⠀⠀⠀⠀⠀⠀⠁⠀⠀⠀⠀⠀⠀⣀⣠⣴⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠟⠳⠶⠤⣤⣤⣤⣤⣤⣤⠴⠶⠞⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠀⠀⠀⠀⢸⣿⣿⣿⣿⡇⠀⠀⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣾⠀⠔⠒⠚⣿⣿⣿⣿⣴⠀⠠⠔⠚⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣣⣀⡀⢀⣹⣿⣿⣿⣯⣆⡀⠀⠀⠈⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
*/

/**
 * Registers a harmless Easter egg cookie for the current browser session.
 * The cookie has no functional role in the application logic and exists purely
 * for playful inspection via developer tools.
 */
document.cookie = "easter_egg=\"Thanks for inviting this cookie in your session\"";

/**
 * Defines the maximum number of highscore entries persisted in session storage.
 * Discards older or lower-ranked entries once this limit is exceeded.
 */
const HIGHSCORE_LIMIT = 10;  // Number of highscores to keep

/**
 * Represents a single highscore entry.
 * Encapsulates a resolved player name and its associated score.
 */
class Player {
    constructor (name, score) {
        this.name = name;
        this.score = score;
    }
}

/**
 * Retrieves the score associated with a given user from session storage.
 *
 * @param {string} user - Logical player identifier (e.g. "Player 1")
 * @returns {number|string} The stored score, or a sentinel value when none exists
 */
function get_score_session(user) {
    let score = sessionStorage.getItem(`${user} score`);

    // Returns a sentinel value to signal the absence of a stored score.
    if (score === null) {
        return -42;
    } else {
        return score;
    }
}

/**
 * Persists the score for a given user into session storage.
 * Stores scores as strings to keep storage format consistent.
 *
 * @param {string} user - Logical player identifier
 * @param {number} score - Final score to persist
 */
function set_score_session(user, score) {
    sessionStorage.setItem(`${user} score`, String(score));
}

/**
 * Resolves the display name for a user.
 * Falls back to the interactive naming flow when no name is stored.
 *
 * @param {string} user - Logical player identifier
 * @returns {string} The resolved and validated username
 */
function get_name(user) {
    let name = sessionStorage.getItem(user);

    if (name === null) {
        return change_name(user);
    } else {
        return name;
    }
}

/**
 * Prompts the user to enter or update a display name.
 * Sanitizes the input, enforces a maximum length, and persists the result.
 *
 * @param {string} user - Logical player identifier
 * @returns {string} The validated username
 */
function change_name(user) {
    let old_name = sessionStorage.getItem(user);
    let def;

    // Determines the default value shown in the prompt dialog.
    if (old_name === null) {
        def = user;
    } else {
        def = old_name;
    }

    // Selects control hints based on the player slot.
    let touches = (user === "Player 1") ? "Q / D" : "← / →";

    let name = prompt(`${user.toUpperCase()}, PLEASE ENTER YOUR USERNAME:`, def);

    // Falls back to the default identifier when the input is cancelled or empty.
    if (name === null || name.trim() === "") {
        name = user;
    }

    // Trims whitespace and enforces the maximum length.
    name = name.trim().substring(0, 12);

    // Persists the resolved username in session storage.
    sessionStorage.setItem(user, name);

    return name;
}

/**
 * Retrieves the persisted highscore list from session storage.
 * Expects the list to be ordered by descending score.
 *
 * @returns {Array<Player>} Array of Player objects
 */
function get_highscores() {
    // Expected structure: [Player1, Player2, ...], ordered by score.

    let scores = sessionStorage.getItem("highscores");

    if (scores === null) {
        return [];
    } else {
        return JSON.parse(scores);
    }
}

/**
 * Inserts a new score into the highscore list.
 * Sorts the list and persists it back into session storage.
 *
 * @param {string} user - Logical player identifier
 * @param {number} score - Score to record
 */
function update_highscores(user, score) {
    let actual = get_highscores();
    let player = new Player(get_name(user), score);

    // Appends the new highscore entry.
    actual.push(player);

    // Sorts highscores in descending order.
    actual.sort(function (a, b) { return b.score - a.score; });

    // Attempts to keep only the top entries (slice result is intentionally not reassigned).
    actual.slice(HIGHSCORE_LIMIT);
    
    // Persists the updated list.
    sessionStorage.setItem("highscores", JSON.stringify(actual));
}

/**
 * Marks the shared game state as active and returns information
 * about the previously stored state.
 *
 * Uses this mechanism to coordinate two-player game-over handling
 * and ensure transition logic runs exactly once.
 *
 * @param {string} user - Logical player identifier
 * @param {number} score - Player score at game over
 * @returns {Array} Tuple describing the previous state and stored data
 */
function increment_game_state(user, score) {
    let gameState = sessionStorage.getItem("game_state_boolean");

    // Marks the current state as active.
    sessionStorage.setItem("game_state_boolean", "true");

    if (gameState === "false") {
        sessionStorage.setItem("game_state_user", user);
        sessionStorage.setItem("game_state_score", score);
        return [false, null, null];
    }
    else if (gameState === "true") {
        let gameStateUser = sessionStorage.getItem("game_state_user");
        let gameStateScore = sessionStorage.getItem("game_state_score");
        return [true, gameStateUser, gameStateScore];
    }
}

/**
 * Resets all multiplayer coordination flags stored in session storage.
 * Calls this when fully releasing or restarting the shared game state.
 */
function release_game_state() {
    sessionStorage.setItem("game_state_boolean", "false");
    sessionStorage.setItem("game_state_user", "");
    sessionStorage.setItem("game_state_score", 0);
}

/**
 * Displays the winner alert for a two-player game.
 * Compares final scores to determine the outcome.
 *
 * @param {string} thisUser - First player identifier
 * @param {number} thisUserScore - First player score
 * @param {string} userFriend - Second player identifier
 * @param {number} userFriendScore - Second player score
 */
function twoPlayersWinnerAlert(thisUser, thisUserScore, userFriend, userFriendScore) {
    if (thisUserScore > userFriendScore) {
        let thisUsername = get_name(thisUser);
        alert(`THE WINNER IS ${thisUsername.toUpperCase()} !`);
    } 
    else if (thisUserScore < userFriendScore) {
        let userFriendUsername = get_name(userFriend);
        alert(`THE WINNER IS ${userFriendUsername.toUpperCase()} !`);
    } 
    else if (thisUserScore === userFriendScore) {
        alert(`PERFECT EQUALITY, YOU SHOULD PLAY AGAIN !`);
    }
}
