/**
 * Defines the Game object (engine/state owner) and its prototype methods.
 *
 * Owns the following responsibilities:
 *  - Owns all mutable runtime state (score, lives, difficulty, entities, input).
 *  - Runs the update/render loop.
 *  - Handles spawning and collisions.
 *  - Exposes helper methods consumed by NoteType strategies (onCatch).
 *
 * Pushes type-specific behavior into NoteType.onCatch(game, type),
 * keeping Game largely free of per-letter branching.
 */

/**
 * Game constructor.
 * Initializes rendering bindings, player configuration, asset references,
 * runtime state, and precomputations required for weighted note selection.
 *
 * @constructor
 * @param {Object} opts - Configuration object containing dependencies and initial settings
 */
function Game(opts) {
    // Canvas and 2D rendering context used for all draw operations.
    this.canvas = opts.canvas;
    this.ctx = opts.ctx;

    // Player/multiplayer configuration and input mapping.
    this.numberOfPlayers = opts.numberOfPlayers;
    this.user = opts.user;
    this.username = this.user.toUpperCase();
    this.arrowLeft = opts.arrowLeft;
    this.arrowRight = opts.arrowRight;

    // Image assets consumed by the renderer.
    this.background = opts.background;
    this.caracter = opts.caracter;
    this.heartImg = opts.heartImg;
    this.brokenHeartImg = opts.brokenHeartImg;

    // Audio assets keyed by semantic identifiers.
    this.sfx = opts.sfx; // { backgroundMusic, goodA, good, bad, gameOver }

    // Static configuration (dimensions) with fallback defaults.
    this.noteWidth = opts.noteWidth ?? 80;
    this.noteHeight = opts.noteHeight ?? 80;
    this.caracterWidth = opts.caracterWidth ?? 150;
    this.caracterHeight = opts.caracterHeight ?? 250;

    // Core gameplay state (mutable during the run).
    this.score = 0;
    this.lives = 3; // supports halves (e.g., 2.5)

    // Run state flags controlling rendering and transition behavior.
    this.gameStarted = false;
    this.previewed = false;
    this.isGameOver = false;
    this.gameOverAlreadyHandled = false;
    this.dead = false;

    // Input state flags updated by DOM event handlers.
    this.rightPressed = false;
    this.leftPressed = false;
    this.directionToken = true;

    // Difficulty ramp state and scheduler handle.
    this.difficultyLevel = 1;
    this.difficultyIntervalId = null;

    // Timers used for UI effects (start prompt blink, damage feedback, low-health blink).
    this.startPromptBlinkStart = performance.now();
    this.livesLostAnimStart = null;
    this.livesLostAnimDuration = 500;
    this.blinkStart = performance.now();

    // Player "death" visual effect (flash + shake + fade).
    this.deathAnimStart = null;
    this.deathAnimDuration = 1200;

    // Runtime entities managed by the simulation.
    this.notes = [];

    // Initializes the player position at the horizontal center.
    this.caracterX = (this.canvas.width - this.caracterWidth) / 2;

    // Note registry and weighted selection precomputation for efficient spawning.
    this.noteTypes = opts.noteTypes;
    this.totalWeight = this.noteTypes.reduce((acc, t) => acc + t.weight, 0);

    // Binds callback methods to ensure `this` remains the Game instance.
    // This is required for addEventListener and requestAnimationFrame usage.
    this.loop = this.loop.bind(this);
    this.keyDownHandler = this.keyDownHandler.bind(this);
    this.keyUpHandler = this.keyUpHandler.bind(this);
}

/**
 * Groups Game prototype methods for readability.
 * Organizes methods by domain (lifecycle, input, audio, gameplay, rendering, loop).
 */
const gamePrototype = {
    /* =========================
       Bootstrap / lifecycle
    ========================= */

    /**
     * Attaches keyboard and touch listeners for player controls.
     * Treats this operation as idempotent to avoid duplicate listener registration.
     */
    attachInput() {
        // Prevents duplicate listener attachment across restarts and previews.
        if (this.inputAttached) return;

        document.addEventListener("keydown", this.keyDownHandler, false);
        document.addEventListener("keyup", this.keyUpHandler, false);

        // Registers touch listeners on the canvas to support mobile controls.
        // Uses passive: false semantics via preventDefault() to avoid page scrolling while playing.
        this.canvas.addEventListener("touchstart", (e) => this.touchStartHandler(e), false);
        this.canvas.addEventListener("touchmove",  (e) => this.touchMoveHandler(e), false);
        this.canvas.addEventListener("touchend",   (e) => this.touchEndHandler(e), false);
        this.canvas.addEventListener("touchcancel",(e) => this.touchCancelHandler(e), false);

        this.inputAttached = true;
    },

    /**
     * Starts the periodic difficulty ramp (idempotent).
     * Increases difficulty at a fixed time interval.
     */
    startDifficultyRamp() {
        // Ensures only one scheduler exists.
        if (this.difficultyIntervalId !== null) return;

        this.difficultyIntervalId = setInterval(() => {
            this.difficultyLevel++;
        }, 5000);
    },

    /**
     * Stops the periodic difficulty ramp (idempotent).
     * Prevents difficulty from mutating after the run ends.
     */
    stopDifficultyRamp() {
        if (this.difficultyIntervalId === null) return;

        clearInterval(this.difficultyIntervalId);
        this.difficultyIntervalId = null;
    },

    /**
     * Starts a run.
     * In preview mode, initializes the loop without transitioning into active gameplay.
     *
     * @param {boolean} preview - Whether this call is a preview boot (no username/audio ramp)
     */
    start(preview) {
        // Releases any cross-player lock to allow a fresh start sequence.
        release_game_state();

        // Initializes the loop only once per instance.
        if (!this.previewed) {
            this.loop();
            this.previewed = true;
        }

        // In non-preview mode, arms gameplay: resolves name, starts difficulty, and plays music.
        if (!preview) {
            this.attachInput();
            this.username = get_name(this.user).toUpperCase();
            this.gameStarted = true;
            this.startDifficultyRamp();
            this.playSfx("backgroundMusic");
        }
    },

    /**
     * Restarts a new run from a pristine state.
     * Reuses assets; resets only mutable runtime state.
     */
    restart() {
        release_game_state();

        // Returns the instance to a known initial state.
        this.resetStateToDefaults();

        // Arms gameplay flags and resumes difficulty progression.
        this.gameStarted = true;
        this.startDifficultyRamp();
        
        // Restores background music volume after a restart.
        const bgm = this.sfx?.backgroundMusic;
        if (bgm) {
            try {
                bgm.volume = 1;
            } catch (e) {}
        }
    },

    /**
     * Resets runtime state to initial defaults.
     * Does not recreate assets and does not reattach listeners.
     */
    resetStateToDefaults() {
        // Gameplay state
        this.score = 0;
        this.lives = 3;

        // Keeps the displayed identity in sync with session storage.
        this.username = get_name(this.user).toLocaleUpperCase();

        // Run state flags
        this.gameStarted = false;
        this.isGameOver = false;
        this.gameOverAlreadyHandled = false;
        this.dead = false;

        // Input state
        this.rightPressed = false;
        this.leftPressed = false;

        // Difficulty ramp
        this.difficultyLevel = 1;
        this.difficultyIntervalId = null;

        // Timers / UI effects
        this.startPromptBlinkStart = performance.now();
        this.livesLostAnimStart = null;
        this.blinkStart = performance.now();
        this.deathAnimStart = null;

        // Entities
        this.notes = [];

        // Player position
        this.caracterX = (this.canvas.width - this.caracterWidth) / 2;

        // Background music volume.
        let bgm = this.sfx.backgroundMusic;
        if (bgm) {
            try {
                bgm.volume = 1;
            } catch (e) {}
        }
    },

    /**
     * Executes the game-over transition.
     * Guards execution to run once per instance, even if triggered multiple times.
     *
     * Multiplayer note:
     * - Uses a shared session flag to coordinate a single transition to highscores.
     *
     * @param {boolean} update - Whether highscores should be updated when navigating away
     */
    gameOver(update) {
        // Hard guard preventing re-entry, including cross-calls from rendering.
        if (this.dead === true) return;
        this.dead = true;
        
        // Persists the player's final score into session storage.
        set_score_session(this.user, this.score);

        // Marks game state in storage and retrieves whether the previous state was already "true".
        let gameState = increment_game_state(this.user, this.score);
        let isMyfriendLose = gameState[0];
        let myUserFriend = gameState[1];
        let myUserFriendScore = gameState[2];

        // Ensures only one player executes the delayed navigation in multiplayer.
        if (this.numberOfPlayers === 1 || isMyfriendLose) {

            // Delays navigation to keep "GAME OVER" readable before leaving the canvas.
            setTimeout(() => {                
                // Stops the difficulty ramp to prevent background mutation after gameplay ends.
                this.stopDifficultyRamp();

                // Navigates to the highscores view and optionally updates persistence.
                viewHighscores(numberOfPlayers, update, true, this.user, this.score, myUserFriend, myUserFriendScore);
            }, 2000);
        }
    },

    /* =========================
       Input handling
    ========================= */

    /**
     * Keydown handler used to set movement state.
     * Maps movement using the configured arrowLeft/arrowRight codes.
     *
     * @param {KeyboardEvent} e
     */
    keyDownHandler(e) {
        if (e.code === this.arrowRight) {
            this.rightPressed = true;
        }
        else if (e.code === this.arrowLeft) {
            this.leftPressed = true;
        }
    },

    /**
     * Keyup handler used to clear movement state.
     *
     * @param {KeyboardEvent} e
     */
    keyUpHandler(e) {
        if (e.code === this.arrowRight) {
            this.rightPressed = false;
        }
        else if (e.code === this.arrowLeft) {
            this.leftPressed = false;
        }
    },


    /**
     * Handles touchstart and synchronizes current touches to movement state.
     * Prevents default browser behavior (scroll/zoom) to keep touch input dedicated to the game.
     *
     * @param {TouchEvent} e
     */
    touchStartHandler(e) {
        e.preventDefault();
        this.syncTouchesToState(e);
    },

    /**
     * Handles touchend and synchronizes remaining touches to movement state.
     * Prevents default behavior to avoid scroll rebound on release.
     *
     * @param {TouchEvent} e
     */
    touchEndHandler(e) {
        e.preventDefault();
        this.syncTouchesToState(e);
    },

    /**
     * Handles touchmove and continuously refreshes movement state while fingers move.
     * Prevents default behavior so the canvas does not scroll inside the page.
     *
     * @param {TouchEvent} e
     */
    touchMoveHandler(e) {
        e.preventDefault();
        this.syncTouchesToState(e);
    },

    /**
     * Handles touchcancel (e.g., OS gesture interruption) and clears movement state.
     * Resets both directions to avoid "stuck" movement.
     *
     * @param {TouchEvent} e
     */
    touchCancelHandler(e) {
        e.preventDefault();
        this.leftPressed = false;
        this.rightPressed = false;
    },

    /**
     * Maps active touches to left/right movement flags.
     * Interprets the canvas as two zones: left half -> move left, right half -> move right.
     *
     * Constraints:
     * - Tracks at most two simultaneous touches (two-finger input cap).
     * - If at least one touch is in a zone, the corresponding direction is considered pressed.
     *
     * @param {TouchEvent} e
     */
    syncTouchesToState(e) {
        // Uses the canvas bounding box to convert screen touches into local canvas coordinates.
        const rect = this.canvas.getBoundingClientRect();

        let left = false;
        let right = false;

        // Caps processing to two fingers to match the intended control scheme.
        const touches = e.targetTouches;
        const count = Math.min(2, touches.length);

        for (let i = 0; i < count; i++) {
            // Converts clientX to a position relative to the canvas.
            const x = touches[i].clientX - rect.left;

            // Splits the canvas into left/right halves for directional input.
            if (x < rect.width / 2) left = true;
            else right = true;
        }

        // Commits the derived touch state to movement flags.
        this.leftPressed = left;
        this.rightPressed = right;
    },

    /* =========================
       Audio helpers
    ========================= */

    /**
     * Plays a sound effect by key with defensive guards.
     * Avoids hard failures under autoplay restrictions or missing audio assets.
     *
     * For one-shot SFX, resets currentTime to support rapid retriggers.
     * For background music, preserves currentTime to keep continuity.
     *
     * @param {string} key - One of the keys in the sfx map
     */
    playSfx(key) {
        const audio = this.sfx[key];
        if (!audio) return;

        try {
            if (key === "backgroundMusic") {
                // Starts/resumes background music without seeking to the beginning.
                audio.play().catch(() => {});
                return;
            }

            // Restarts one-shot SFX from time zero.
            audio.currentTime = 0;
            audio.play();
        } catch (e) {
            // Intentionally ignored: browsers may block playback without a user gesture.
        }
    },

    /* =========================
       Gameplay helpers (used by NoteType strategies)
    ========================= */

    /**
     * Adds points to the score.
     *
     * @param {number} delta - Score increment (can be negative if required)
     */
    addScore(delta) {
        this.score += delta;
    },

    /**
     * Adds a delta to lives (supports halves).
     *
     * @param {number} delta - Life change (can be fractional)
     */
    addLives(delta) {
        this.lives += delta;
    },

    /**
     * Arms the "damage feedback" animation timer.
     * Typically called by damaging note types.
     */
    notifyDamage() {
        this.livesLostAnimStart = performance.now();
    },

    /**
     * Checks whether lives are depleted and transitions to game over state if so.
     * Also plays the game over SFX as a one-shot effect.
     */
    checkGameOver() {
        // Early return preserves performance and avoids double-triggering.
        if (this.lives > 0) return;

        // Clamps lives to zero for consistent HUD rendering.
        this.lives = 0;
        this.isGameOver = true;

        // Arms the player death animation once, at the moment game over is reached.
        if (this.deathAnimStart === null) {
            this.deathAnimStart = performance.now();
        }

        this.playSfx("gameOver");
    },

    /* =========================
       Note selection / spawning
    ========================= */

    /**
     * Performs weighted random selection among note types.
     * Assumes weights are non-negative and totalWeight is valid.
     *
     * @returns {NoteType} Selected note type strategy
     */
    getRandomNoteType() {
        const r = Math.random() * this.totalWeight;
        let sum = 0;

        for (const element of this.noteTypes) {
            sum += element.weight;
            if (r < sum) return element;
        }

        // Fallback: returns the last type to guarantee a return value.
        return this.noteTypes[this.noteTypes.length - 1];
    },

    /**
     * Spawns a new falling note (runtime entity) and stores it.
     * Delegates behavior to the NoteType strategy attached to the Note instance.
     */
    spawnNote() {
        const type = this.getRandomNoteType();
        const n = new Note(type, this.canvas.width, this.noteWidth, this.noteHeight, this.difficultyLevel);
        this.notes.push(n);
    },

    /* =========================
       Simulation update
    ========================= */

    /**
     * Updates player horizontal movement based on current input.
     * Clamps movement to the canvas boundaries.
     */
    updatePlayer() {
        // Freezes player movement once the game is over.
        if (this.isGameOver) return;

        const step = 10;

        if (this.directionToken) {
            if (this.rightPressed && this.caracterX < this.canvas.width - this.caracterWidth) {
                this.caracterX += step;
            } else if (this.leftPressed && this.caracterX > 0) {
                this.caracterX -= step;
            }
            this.directionToken = false;
        } 
        else {
            if (this.leftPressed && this.caracterX > 0) {
                this.caracterX -= step;
            } else if (this.rightPressed && this.caracterX < this.canvas.width - this.caracterWidth) {
                this.caracterX += step;
            }
            this.directionToken = true;
        }

    },

    /**
     * Applies type-specific behavior for a collected note.
     * Delegates behavior to the note type via its onCatch strategy.
     *
     * @param {Note} note - Note entity that collided with the player
     */
    applyCollisionEffects(note) {
        if (note && note.type && typeof note.type.onCatch === "function") {
            note.type.onCatch(this, note.type);
        }
    },

    /**
     * Updates note positions, removes out-of-bounds notes, and handles collisions.
     * Iterates backwards to safely splice notes during traversal.
     */
    updateNotes() {
        // Computes the player rectangle once per frame for collision checks.
        const paddleX = this.caracterX;
        const paddleY = this.canvas.height - this.caracterHeight;
        const paddleW = this.caracterWidth;
        const paddleH = this.caracterHeight;
        
        for (let i = this.notes.length - 1; i >= 0; i--) {
            const n = this.notes[i];

            // Advances note simulation (falling motion, speed, etc.).
            n.update();

            // Removes notes that are no longer visible.
            if (n.isOut(this.canvas.height)) {
                this.notes.splice(i, 1);
                continue;
            }

            // Skips collision processing after game over.
            if (this.isGameOver) continue;

            // Resolves collision between the note and the player rectangle.
            if (n.collidesWithRect(paddleX, paddleY, paddleW, paddleH)) {
                this.applyCollisionEffects(n);
                this.notes.splice(i, 1);
            }
        }
    },

    /* =========================
       Rendering (background, entities, HUD)
    ========================= */

    /**
     * Draws the background image stretched to the canvas dimensions.
     */
    drawBackground() {
        this.ctx.drawImage(this.background, 0, 0, this.canvas.width, this.canvas.height);
    },

    /**
     * Draws the player sprite at the current horizontal position.
     */
    drawPlayer() {
        this.ctx.save();

        let x = this.caracterX;
        let y = this.canvas.height - this.caracterHeight;

        // Default rendering parameters.
        let alpha = 1;
        let scale = 1;

        // Death effect: flash + shake, anchored to the bottom of the canvas.
        if (this.isGameOver && this.deathAnimStart !== null) {
            const elapsed = performance.now() - this.deathAnimStart;
            const p = Math.min(1, elapsed / this.deathAnimDuration);

            // Keeps alpha stable (no fade-out).
            let alpha = 1;

            // Applies a slight shrink over the animation.
            const scale = 1 - 0.08 * p;

            // Applies a flashing opacity modulation.
            const flash = 0.4 + 0.6 * Math.abs(Math.sin(elapsed / 45));
            this.ctx.globalAlpha = alpha * (0.35 + 0.65 * flash);

            // Applies horizontal shake only.
            const shakeX = (Math.random() - 0.5) * 10 * (1 - p);

            // Anchors the player to the bottom edge.
            const baseX = this.caracterX + this.caracterWidth / 2;
            const baseY = this.canvas.height; // bottom anchor

            this.ctx.translate(baseX + shakeX, baseY);
            this.ctx.scale(scale, scale);

            this.ctx.drawImage(
                this.caracter,
                -this.caracterWidth / 2,
                -this.caracterHeight,
                this.caracterWidth,
                this.caracterHeight
            );

            this.ctx.restore();
            return;
        }

        // Renders the player normally.
        this.ctx.drawImage(this.caracter, x, y, this.caracterWidth, this.caracterHeight);
        this.ctx.restore();
    },

    /**
     * Draws every active note entity.
     * Uses a for...in loop to satisfy coursework loop variety requirements.
     */
    drawNotes() {
        for (const index in this.notes) {
            this.notes[index].draw(this.ctx);
        }
    },

    /**
     * Draws the HUD score with neon-glow styling for legibility.
     */
    drawScore() {
        this.ctx.save();

        this.ctx.font = "bold 2em 'Press Start 2P', cursive";
        this.ctx.textBaseline = "top";
        this.ctx.textAlign = "left";
        this.ctx.fillStyle = "#00faff";

        // Uses multiple glow passes to improve contrast on complex backgrounds.
        this.ctx.shadowColor = "#00faff";
        this.ctx.shadowBlur = 8;
        this.ctx.fillText(`${this.username}: ` + this.score, 20, 40);

        this.ctx.shadowColor = "#00e1ff";
        this.ctx.shadowBlur = 20;
        this.ctx.fillText(`${this.username}: ` + this.score, 20, 40);

        this.ctx.shadowBlur = 40;
        this.ctx.fillText(`${this.username}: ` + this.score, 20, 40);

        this.ctx.restore();
    },

    /**
     * Draws life hearts in the top-right corner.
     * Supports full and half lives, includes critical-health blinking,
     * and applies a pulse/shake feedback after taking damage.
     */
    drawLives() {
        this.ctx.save();

        const heartSize = 60;
        const spacing = 8;
        const marginRight = 20;
        const marginTop = 18;

        // Splits fractional lives into full hearts and a half-heart indicator.
        const full = Math.floor(this.lives);
        const hasHalf = (this.lives % 1 !== 0) ? 1 : 0;

        // Applies a blinking effect when health is critical.
        if (this.lives <= 1) {
            const t = (performance.now() - this.blinkStart) / 1000;
            const blink = 0.25 + 0.75 * Math.abs(Math.sin(t * Math.PI * 2));
            this.ctx.globalAlpha = blink;
        }

        // Computes pulse and shake when damage was recently taken.
        let scale = 1;
        let shakeX = 0;
        let shakeY = 0;

        if (this.livesLostAnimStart !== null) {
            const elapsed = performance.now() - this.livesLostAnimStart;

            if (elapsed <= this.livesLostAnimDuration) {
                const p = elapsed / this.livesLostAnimDuration;
                const pulse = Math.sin(p * Math.PI);
                scale = 1 + 0.18 * pulse;

                // Adds a bounded random shake to reinforce impact feedback.
                shakeX = (Math.random() - 0.5) * 4;
                shakeY = (Math.random() - 0.5) * 3;
            } else {
                this.livesLostAnimStart = null;
            }
        }

        // Applies neon shadow styling to heart sprites.
        this.ctx.shadowColor = "#ff3333";
        this.ctx.shadowBlur = 18;

        // Draws hearts from right to left for consistent alignment.
        let x = this.canvas.width - marginRight;
        const y = marginTop;

        // Draws a half-heart first when applicable.
        if (hasHalf) {
            x -= heartSize;

            this.ctx.save();
            this.ctx.translate(x + heartSize / 2 + shakeX, y + heartSize / 2 + shakeY);
            this.ctx.scale(scale, scale);
            this.ctx.drawImage(this.brokenHeartImg, -heartSize / 2, -heartSize / 2, heartSize, heartSize);
            this.ctx.restore();

            x -= spacing;
        }

        // Draws full hearts using a while loop to satisfy loop variety requirements.
        let i = 0;
        while (i < full) {
            x -= heartSize;

            this.ctx.save();
            this.ctx.translate(x + heartSize / 2 + shakeX, y + heartSize / 2 + shakeY);
            this.ctx.scale(scale, scale);
            this.ctx.drawImage(this.heartImg, -heartSize / 2, -heartSize / 2, heartSize, heartSize);
            this.ctx.restore();

            x -= spacing;

            i++;
        }

        this.ctx.restore();
    },

    /**
     * Draws the start screen overlay.
     * Renders a blinking primary instruction plus secondary hints describing controls and menu shortcuts.
     *
     * Rendering notes:
     * - Uses glow/shadow passes to keep text legible over a busy background.
     * - Uses a time-based alpha modulation for the "insert coin" effect.
     */
    drawPressToStart() {
        this.ctx.save();

        // Computes a blinking alpha for the primary prompt to attract attention.
        const t = (performance.now() - this.startPromptBlinkStart) / 1000;
        const blink = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * Math.PI * 4));
        this.ctx.globalAlpha = blink;

        // Centers overlay text in the canvas.
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";

        /* =========================
        MAIN START MESSAGE
        ========================= */

        this.ctx.font = "bold 1.8rem 'Press Start 2P', cursive";
        this.ctx.fillStyle = "#00faff";

        // Draws the primary message with multiple glow passes.
        this.ctx.shadowColor = "#00faff";
        this.ctx.shadowBlur = 10;
        this.ctx.fillText(
            "INSERT A COIN TO PLAY",
            this.canvas.width / 2,
            this.canvas.height / 2 - 70
        );

        this.ctx.shadowColor = "#00e1ff";
        this.ctx.shadowBlur = 25;
        this.ctx.fillText(
            "INSERT A COIN TO PLAY",
            this.canvas.width / 2,
            this.canvas.height / 2 - 70
        );

        this.ctx.shadowBlur = 50;
        this.ctx.fillText(
            "INSERT A COIN TO PLAY",
            this.canvas.width / 2,
            this.canvas.height / 2 - 70
        );

        // Switches to a smaller font for secondary instructions.
        this.ctx.font = "bold 1rem 'Press Start 2P', cursive";

        // Keeps secondary instructions readable while maintaining the arcade blink feel.
        this.ctx.globalAlpha = 0.9;

        // Draws the start interaction line (keyboard/mouse/touch).
        this.ctx.shadowColor = "#00faff";
        this.ctx.shadowBlur = 10;
        this.ctx.fillText(
            "PRESS ENTER, CLICK, OR TOUCH THE SCREEN TO START",
            this.canvas.width / 2,
            this.canvas.height / 2 - 10
        );

        this.ctx.shadowColor = "#00e1ff";
        this.ctx.shadowBlur = 25;
        this.ctx.fillText(
            "PRESS ENTER, CLICK, OR TOUCH THE SCREEN TO START",
            this.canvas.width / 2,
            this.canvas.height / 2 - 10
        );

        this.ctx.shadowBlur = 50;
        this.ctx.fillText(
            "PRESS ENTER, CLICK, OR TOUCH THE SCREEN TO START",
            this.canvas.width / 2,
            this.canvas.height / 2 - 10
        );

        // Draws menu shortcuts (high scores / player count).
        this.ctx.shadowColor = "#00faff";
        this.ctx.shadowBlur = 10;
        this.ctx.fillText(
            "SPACE FOR HIGH SCORES  /  P TO ADD/REMOVE A PLAYER",
            this.canvas.width / 2,
            this.canvas.height / 2 + 50
        );

        this.ctx.shadowColor = "#00e1ff";
        this.ctx.shadowBlur = 25;
        this.ctx.fillText(
            "SPACE FOR HIGH SCORES  /  P TO ADD/REMOVE A PLAYER",
            this.canvas.width / 2,
            this.canvas.height / 2 + 50
        );

        this.ctx.shadowBlur = 50;
        this.ctx.fillText(
            "SPACE FOR HIGH SCORES  /  P TO ADD/REMOVE A PLAYER",
            this.canvas.width / 2,
            this.canvas.height / 2 + 50
        );

        // Draws movement control hints for both players and touch input.
        this.ctx.shadowColor = "#00faff";
        this.ctx.shadowBlur = 10;
        this.ctx.fillText(
            "PRESS Q/D (P1), ←/→ (P2) OR TOUCH SCREEN RIGHT/LEFT TO MOVE",
            this.canvas.width / 2,
            this.canvas.height / 2 + 110
        );

        this.ctx.shadowColor = "#00e1ff";
        this.ctx.shadowBlur = 25;
        this.ctx.fillText(
            "PRESS Q/D (P1), ←/→ (P2) OR TOUCH SCREEN RIGHT/LEFT TO MOVE",
            this.canvas.width / 2,
            this.canvas.height / 2 + 110
        );

        this.ctx.shadowBlur = 50;
        this.ctx.fillText(
            "PRESS Q/D (P1), ←/→ (P2) OR TOUCH SCREEN RIGHT/LEFT TO MOVE",
            this.canvas.width / 2,
            this.canvas.height / 2 + 110
        );

        // Draws the gameplay objective hint (collect/avoid note types).
        this.ctx.shadowColor = "#00faff";
        this.ctx.shadowBlur = 10;
        this.ctx.fillText(
            "COLLECT A/B/C/D/E GRADES AND AVOID DEADLY F/Fx ONES !",
            this.canvas.width / 2,
            this.canvas.height / 2 + 170
        );

        this.ctx.shadowColor = "#00e1ff";
        this.ctx.shadowBlur = 10;
        this.ctx.fillText(
            "COLLECT A/B/C/D/E GRADES AND AVOID DEADLY F/Fx ONES !",
            this.canvas.width / 2,
            this.canvas.height / 2 + 170
        );
        this.ctx.shadowBlur = 25;
        this.ctx.fillText(
            "COLLECT A/B/C/D/E GRADES AND AVOID DEADLY F/Fx ONES !",
            this.canvas.width / 2,
            this.canvas.height / 2 + 170
        );

        /* =========================
        AUDIO NOTICE (NON-BLINKING)
        ========================= */

        // Disables blinking to keep the audio notice stable and readable.
        this.ctx.globalAlpha = 0.9;

        this.ctx.font = "bold 1rem 'Press Start 2P', cursive";
        this.ctx.fillStyle = "#ffffff";
        this.ctx.shadowColor = "#ffffff";
        this.ctx.shadowBlur = 6;

        // Draws the audio suggestion line.
        this.ctx.fillText(
            "ENABLE SOUND FOR MORE FUN",
            this.canvas.width / 2,
            this.canvas.height / 2 + 210
        );

        this.ctx.restore();
    },

    /**
     * Draws the "GAME OVER" overlay with a neon blinking effect.
     * Also triggers the one-shot game-over transition logic.
     */
    drawGameOver() {
        this.ctx.save();

        // Uses a time-based sine wave to drive blinking opacity.
        const t = performance.now() / 1000;
        const blink = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * Math.PI * 4));
        this.ctx.globalAlpha = blink;

        this.ctx.font = "bold 72px 'Press Start 2P', cursive";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillStyle = "#ff0033";

        // Renders neon glow layers.
        this.ctx.shadowColor = "#ff0033";
        this.ctx.shadowBlur = 15;
        this.ctx.fillText("GAME OVER", this.canvas.width / 2, this.canvas.height / 2);

        this.ctx.shadowColor = "#ff3333";
        this.ctx.shadowBlur = 35;
        this.ctx.fillText("GAME OVER", this.canvas.width / 2, this.canvas.height / 2);

        this.ctx.shadowColor = "#330008";
        this.ctx.shadowBlur = 70;
        this.ctx.fillText("GAME OVER", this.canvas.width / 2, this.canvas.height / 2);

        this.ctx.restore();

        // Ensures game-over side effects execute exactly once.
        if (!this.gameOverAlreadyHandled) {
            this.gameOverAlreadyHandled = true;
            this.gameOver(true);
        }
    },

    /* =========================
       Main loop
    ========================= */

    /**
     * Main loop: clears the frame, renders background, updates and draws entities,
     * and overlays start/game-over states.
     * Uses requestAnimationFrame to keep animation smooth and browser-scheduled.
     */
    loop() {
        // Clears the previous frame.
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Renders the background every frame.
        this.drawBackground();

        // Start screen: renders prompt and pauses gameplay logic.
        if (!this.gameStarted && !this.isGameOver) {
            this.drawPressToStart();
            requestAnimationFrame(this.loop);
            return;
        }

        // Spawns notes only while the run is active and not yet in game over.
        if (!this.isGameOver && Math.random() < 0.03 + (this.difficultyLevel / 300)) {
            this.spawnNote();
        }

        // Updates simulation (positions, collisions, player movement).
        this.updateNotes();
        this.updatePlayer();

        // Renders entities and HUD.
        this.drawPlayer();
        this.drawNotes();
        this.drawScore();
        this.drawLives();

        // Overlays the game over screen (and triggers one-shot transition effects).
        if (this.isGameOver) {
            this.drawGameOver();
        }

        // Schedules the next animation frame.
        requestAnimationFrame(this.loop);    
    }
};

// Copies the grouped methods onto the Game prototype to define instance behavior.
Object.assign(Game.prototype, gamePrototype);
