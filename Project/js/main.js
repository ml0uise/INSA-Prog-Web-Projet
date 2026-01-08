/**
 * Global session configuration and control mappings.
 * Each player entry encodes: [playerLabel, leftKeyCode, rightKeyCode].
 *
 * Note: the chosen bindings reflect an AZERTY-friendly setup:
 * - Player 1 uses Q/D
 * - Player 2 uses ArrowLeft/ArrowRight
 */
let numberOfPlayers = 1;
let player1 = ["Player 1", "KeyA", "KeyD"];
let player2 = ["Player 2", "ArrowLeft", "ArrowRight"];

/**
 * Global runtime flags controlling UI flow and input gating.
 * - preview: initial boot where engines can render without starting an active run
 * - isGaming: indicates whether the game canvases are currently displayed
 * - playing: gates menu-level inputs while a run is active
 */
let preview = true;
let isGaming = true;
let isPlaying = false;

// Attach global listeners
attachMenuInput();

/**
 * Instantiates engine instances eagerly so assets and audio objects are loaded early.
 * Each instance is configured with its own user identifier and control mapping.
 *
 * Note: game2 is initialized with a fixed player-count argument to ensure it
 * can be preview-started and later switched into two-player mode.
 */
const game1 = initialiseGame(player1[0], numberOfPlayers, player1[1], player1[2]);
const game2 = initialiseGame(player2[0], 2, player2[1], player2[2]);

/**
 * Boot sequence:
 * Starts the application in preview mode so visuals and assets are initialized.
 * The second engine instance is started as well to ensure it is ready when
 * two-player mode is enabled.
 */
startGame(numberOfPlayers, preview);
game2.start(2, preview);
