/**
 * Game.js
 * -------
 * Defines the Game object (engine/state owner) and its prototype methods.
 *
 * Game responsibilities:
 *  - Own all mutable runtime state (score, lives, difficulty, entities, input).
 *  - Run the update/render loop.
 *  - Perform spawning and collisions.
 *  - Provide helper methods used by NoteType strategies (onCatch).
 *
 * Type-specific behavior is pushed into NoteType.onCatch(game, type),
 * which keeps Game largely free of branching per note letter.
 */

/**
 * Game constructor.
 * Initializes rendering bindings, player configuration, assets references,
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

    // Image assets used by the renderer.
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

    // Difficulty ramp state and scheduler handle.
    this.difficultyLevel = 1;
    this.difficultyIntervalId = null;

    // Timers used for UI effects (start prompt blink, damage feedback, low-health blink).
    this.startPromptBlinkStart = performance.now();
    this.livesLostAnimStart = null;
    this.livesLostAnimDuration = 500;
    this.blinkStart = performance.now();

    // Runtime entities managed by the simulation.
    this.notes = [];

    // Player position initialized at the horizontal center.
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
 * All Game prototype methods are grouped here for clarity.
 * Methods are organized by domain (lifecycle, input, audio, gameplay, rendering, loop).
 */
const gamePrototype = {
    /* =========================
       Bootstrap / lifecycle
    ========================= */

    /**
     * Attaches keyboard listeners for player controls and "press to start".
     * Idempotent: calling multiple times will not attach duplicates.
     */
    attachInput() {
        // Prevents duplicate listener attachment across restarts/previews.
        if (this.inputAttached) return;

        document.addEventListener("keydown", this.keyDownHandler, false);
        document.addEventListener("keyup", this.keyUpHandler, false);
        this.inputAttached = true;
    },

    /**
     * Starts periodic difficulty increase (idempotent).
     * Difficulty is increased at a fixed time interval.
     */
    startDifficultyRamp() {
        // Ensures only one scheduler exists.
        if (this.difficultyIntervalId !== null) return;

        this.difficultyIntervalId = setInterval(() => {
            this.difficultyLevel++;
        }, 5000);
    },

    /**
     * Stops periodic difficulty increase (idempotent).
     * This is required to avoid difficulty continuing to mutate after game end.
     */
    stopDifficultyRamp() {
        if (this.difficultyIntervalId === null) return;

        clearInterval(this.difficultyIntervalId);
        this.difficultyIntervalId = null;
    },

    /**
     * Starts a run.
     * In preview mode, it initializes the loop and input without transitioning into gameplay.
     *
     * @param {boolean} preview - Whether this call is a "preview" boot (no username/audio ramp)
     */
    start(preview) {
        // Releases any cross-player lock to allow a fresh start sequence.
        release_game_state();

        // Ensures the loop and input handlers are initialized only once.
        if (!this.previewed) {
            this.attachInput();
            this.loop();
            this.previewed = true;
        }

        // When not in preview, the run becomes active: name is resolved, difficulty starts, and music plays.
        if (!preview) {
            this.username = get_name(this.user).toUpperCase();
            this.gameStarted = true;
            this.startDifficultyRamp();
            this.playSfx("backgroundMusic");
        }
    },

    /**
     * Restarts a new run from a pristine state.
     * Assets are reused; only runtime state is reset.
     */
    restart() {
        release_game_state();

        // Ensures the instance is returned to a known initial state.
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
     * This method does not recreate assets and does not reattach listeners.
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

        // Entities
        this.notes = [];

        // Player position
        this.caracterX = (this.canvas.width - this.caracterWidth) / 2;
    },

    /**
     * Executes the game-over transition.
     * The method is guarded to run only once per instance, even if triggered multiple times.
     *
     * Multiplayer note:
     * - It uses a shared session flag to coordinate a single transition to highscores.
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
        let isMyfriendLose = increment_game_state();

        // Only one player should execute the delayed navigation in multiplayer.
        if (this.numberOfPlayers === 1 || isMyfriendLose) {

            // Delay provides UX time to read "GAME OVER" before leaving the canvas.
            setTimeout(() => {                
                // Stops difficulty ramp to prevent background mutation after gameplay ends.
                this.stopDifficultyRamp();

                // Restarts/continues background music softly on the highscores screen, when present.
                const bgm = this.sfx.backgroundMusic;
                if (bgm) {
                    try {
                        bgm.volume = 0.5;
                        bgm.play();
                    } catch (e) {}
                }

                // Navigates to the highscores view and optionally updates persistence.
                viewHighscores(this.numberOfPlayers, update);
            }, 2000);
        }
    },

    /* =========================
       Input handling
    ========================= */

    /**
     * Keydown handler used to set movement state.
     * Input mapping is configurable via arrowLeft/arrowRight.
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

    /* =========================
       Audio helpers
    ========================= */

    /**
     * Plays a sound effect by key, safely.
     * It avoids hard failures under autoplay restrictions or missing audio assets.
     *
     * For one-shot SFX, it resets currentTime to allow rapid retriggers.
     * For background music, it does not reset time to preserve continuity.
     *
     * @param {string} key - One of the keys in the sfx map
     */
    playSfx(key) {
        const audio = this.sfx[key];
        if (!audio) return;

        try {
            if (key === "backgroundMusic") {
                // Background music is started/resumed without seeking to the beginning.
                audio.play().catch(() => {});
                return;
            }

            // One-shot SFX are restarted from time zero.
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
     * Triggers the "damage feedback" animation timer.
     * This is typically called by damaging note types.
     */
    notifyDamage() {
        this.livesLostAnimStart = performance.now();
    },

    /**
     * Checks whether lives are depleted and transitions to game over state if so.
     * It also plays the game over SFX (one-shot).
     */
    checkGameOver() {
        // Early return preserves performance and avoids double-triggering.
        if (this.lives > 0) return;

        // Clamps lives to zero for consistent HUD rendering.
        this.lives = 0;
        this.isGameOver = true;

        // Lowers background volume before playing the game over SFX.
        const bgm = this.sfx.backgroundMusic;
        if (bgm) {
            try {
                bgm.volume = 0.2;
            } catch (e) {}
        }

        this.playSfx("gameOver");
    },

    /* =========================
       Note selection / spawning
    ========================= */

    /**
     * Performs weighted random selection among note types.
     * It assumes noteTypes weights are non-negative and totalWeight is valid.
     *
     * @returns {NoteType} The selected note type strategy
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
     * Note behavior is defined by the NoteType strategy attached to the Note instance.
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
     * Movement is clamped within the canvas boundaries.
     */
    updatePlayer() {
        // Player movement is frozen once the game is over.
        if (this.isGameOver) return;

        const step = 10;

        if (this.rightPressed && this.caracterX < this.canvas.width - this.caracterWidth) {
            this.caracterX += step;
        } else if (this.leftPressed && this.caracterX > 0) {
            this.caracterX -= step;
        }
    },

    /**
     * Applies type-specific behavior for a collected note.
     * The note type owns behavior via its onCatch strategy.
     *
     * @param {Note} note - The note entity that collided with the player
     */
    applyCollisionEffects(note) {
        if (note && note.type && typeof note.type.onCatch === "function") {
            note.type.onCatch(this, note.type);
        }
    },

    /**
     * Updates notes positions, removes out-of-bounds notes, and handles collisions.
     * It iterates backwards to safely splice notes during traversal.
     */
    updateNotes() {
        // Computes player rectangle once per frame for collision checks.
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
        this.ctx.drawImage(
            this.caracter,
            this.caracterX,
            this.canvas.height - this.caracterHeight,
            this.caracterWidth,
            this.caracterHeight
        );
    },

    /**
     * Draws every active note entity.
     * It uses a for...in loop to satisfy coursework loop variety requirements.
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

        // Multiple glow passes improve contrast on complex backgrounds.
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
     * Draws life hearts on the top-right corner.
     * It supports full and half lives, includes critical-health blinking,
     * and provides a pulse/shake feedback after taking damage.
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

                // Random shake adds impact feedback; it is bounded to small deltas.
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
     * It includes a blinking primary instruction and secondary hints.
     */
    drawPressToStart() {
        this.ctx.save();

        // Computes a blink alpha for the start prompt to draw attention.
        const t = (performance.now() - this.startPromptBlinkStart) / 1000;
        const blink = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * Math.PI * 4));
        this.ctx.globalAlpha = blink;

        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";

        /* =========================
        MAIN START MESSAGE
        ========================= */

        this.ctx.font = "bold 1.8rem 'Press Start 2P', cursive";
        this.ctx.fillStyle = "#00faff";

        // Draws line 1 with multiple glow passes.
        this.ctx.shadowColor = "#00faff";
        this.ctx.shadowBlur = 10;
        this.ctx.fillText(
            "PRESS ENTER TO START",
            this.canvas.width / 2,
            this.canvas.height / 2 - 70
        );

        this.ctx.shadowColor = "#00e1ff";
        this.ctx.shadowBlur = 25;
        this.ctx.fillText(
            "PRESS ENTER TO START",
            this.canvas.width / 2,
            this.canvas.height / 2 - 70
        );

        this.ctx.shadowBlur = 50;
        this.ctx.fillText(
            "PRESS ENTER TO START",
            this.canvas.width / 2,
            this.canvas.height / 2 - 70
        );

        // Slightly reduces transparency for secondary text while keeping the blink feel.
        this.ctx.globalAlpha = 0.9;

        // Draws line 2 describing movement controls.
        this.ctx.shadowColor = "#00faff";
        this.ctx.shadowBlur = 10;
        this.ctx.fillText(
            "Q/D (←/→) TO MOVE RIGHT/LEFT",
            this.canvas.width / 2,
            this.canvas.height / 2 - 10
        );

        this.ctx.shadowColor = "#00e1ff";
        this.ctx.shadowBlur = 25;
        this.ctx.fillText(
            "Q/D (←/→) TO MOVE RIGHT/LEFT",
            this.canvas.width / 2,
            this.canvas.height / 2 - 10
        );

        this.ctx.shadowBlur = 50;
        this.ctx.fillText(
            "Q/D (←/→) TO MOVE RIGHT/LEFT",
            this.canvas.width / 2,
            this.canvas.height / 2 - 10
        );

        /* =========================
        SECONDARY ACTION
        ========================= */

        // Secondary actions are rendered smaller to reduce visual competition with the main prompt.
        this.ctx.font = "bold 1rem 'Press Start 2P', cursive";

        this.ctx.shadowColor = "#00faff";
        this.ctx.shadowBlur = 10;
        this.ctx.fillText(
            "SPACE FOR HIGHSCORES - P TO ADD/REMOVE A PLAYER",
            this.canvas.width / 2,
            this.canvas.height / 2 + 50
        );

        this.ctx.shadowColor = "#00e1ff";
        this.ctx.shadowBlur = 25;
        this.ctx.fillText(
            "SPACE FOR HIGHSCORES - P TO ADD/REMOVE A PLAYER",
            this.canvas.width / 2,
            this.canvas.height / 2 + 50
        );

        /* =========================
        AUDIO NOTICE (NON-BLINKING)
        ========================= */

        // Disables blinking to keep the audio hint readable and stable.
        this.ctx.globalAlpha = 0.9;

        this.ctx.font = "bold 1rem 'Press Start 2P', cursive";
        this.ctx.fillStyle = "#ffffff";
        this.ctx.shadowColor = "#ffffff";
        this.ctx.shadowBlur = 6;

        this.ctx.fillText(
            "ENABLE SOUND FOR MORE FUN",
            this.canvas.width / 2,
            this.canvas.height / 2 + 110
        );

        this.ctx.restore();
    },

    /**
     * Draws the "GAME OVER" overlay with a neon blinking effect.
     * It also triggers the one-shot game-over transition logic.
     */
    drawGameOver() {
        this.ctx.save();

        // Uses a time-based sine wave for blinking opacity.
        const t = performance.now() / 1000;
        const blink = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * Math.PI * 4));
        this.ctx.globalAlpha = blink;

        this.ctx.font = "bold 72px 'Press Start 2P', cursive";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillStyle = "#ff0033";

        // Neon glow layers.
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

        // Ensures game-over side effects are executed once.
        if (!this.gameOverAlreadyHandled) {
            this.gameOverAlreadyHandled = true;
            this.gameOver(true);
        }
    },

    /* =========================
       Main loop
    ========================= */

    /**
     * Main loop: clears frame, renders background, updates and draws entities,
     * and draws overlays for start/game over states.
     * The loop is driven by requestAnimationFrame for smooth animation.
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

        // Spawns notes only while the game is running and not yet in game-over.
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
