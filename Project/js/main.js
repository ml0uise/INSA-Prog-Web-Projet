/**
 * Global session configuration and control mappings.
 * Encodes each player definition as: [playerLabel, leftKeyCode, rightKeyCode].
 *
 * Uses an AZERTY-friendly control scheme:
 * - Player 1 is mapped to Q / D
 * - Player 2 is mapped to ArrowLeft / ArrowRight
 */
let numberOfPlayers = 1;
let player1 = ["Player 1", "KeyA", "KeyD"];
let player2 = ["Player 2", "ArrowLeft", "ArrowRight"];

/**
 * Global runtime flags controlling application flow and input gating.
 * - preview: initial boot state where engines render without starting active gameplay
 * - isGaming: indicates whether the gameplay canvases are currently visible
 * - isPlaying: disables menu-level input while a run is in progress
 */
let preview = true;
let isGaming = true;
let isPlaying = false;

// Attaches global menu-level input listeners.
attachMenuInput();

/**
 * Eagerly instantiates game engine instances so assets and audio are preloaded.
 * Each instance is bound to a specific user identifier and control mapping.
 *
 * Initializes the second engine with a fixed player-count to allow preview startup
 * and later promotion to two-player mode without re-instantiation.
 */
const game1 = initialiseGame(player1[0], numberOfPlayers, player1[1], player1[2]);
const game2 = initialiseGame(player2[0], 2, player2[1], player2[2]);

/**
 * Boot sequence.
 * Starts the application in preview mode so visuals, assets, and audio objects
 * are initialized before active gameplay begins.
 *
 * Starts the second engine as well to ensure it is immediately ready when
 * two-player mode is enabled.
 */
startGame(numberOfPlayers, preview);
game2.start(2, preview);
