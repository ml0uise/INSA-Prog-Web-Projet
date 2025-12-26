/**
 * game.js
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
 * @constructor
 * @param {Object} opts
 */
function Game(opts) {
    this.canvas = opts.canvas;
    this.ctx = opts.ctx;

    // Images
    this.background = opts.background;
    this.caracter = opts.caracter;
    this.heartImg = opts.heartImg;
    this.brokenHeartImg = opts.brokenHeartImg;

    // Audio (keyed map)
    this.sfx = opts.sfx; // { backgroundMusic, goodA, good, bad, gameOver }

    // Static config
    this.noteWidth = opts.noteWidth ?? 80;
    this.noteHeight = opts.noteHeight ?? 80;
    this.caracterWidth = opts.caracterWidth ?? 150;
    this.caracterHeight = opts.caracterHeight ?? 250;

    // Gameplay state
    this.score = 0;
    this.lives = 3; // supports halves (e.g., 2.5)

    this.gameStarted = false;
    this.gameOver = false;
    this.gameOverAlreadyHandled = false;

    // Input state
    this.rightPressed = false;
    this.leftPressed = false;

    // Difficulty ramp
    this.difficultyLevel = 1;
    this.difficultyIntervalId = null;

    // Timers / UI effects
    this.startPromptBlinkStart = performance.now();
    this.livesLostAnimStart = null;
    this.livesLostAnimDuration = 500;
    this.blinkStart = performance.now();

    // Entities
    this.notes = [];

    // Player position
    this.caracterX = (this.canvas.width - this.caracterWidth) / 2;

    // Note registry and weighted selection precomputation
    this.noteTypes = opts.noteTypes;
    this.totalWeight = this.noteTypes.reduce((acc, t) => acc + t.weight, 0);

    // Bind callback methods (important for addEventListener / requestAnimationFrame)
    this.loop = this.loop.bind(this);
    this.keyDownHandler = this.keyDownHandler.bind(this);
    this.keyUpHandler = this.keyUpHandler.bind(this);
}

/**
 * All Game prototype methods are grouped here for clarity.
 */
const gamePrototype = {
    /* =========================
       Bootstrap / lifecycle
    ========================= */

    /**
     * Attaches keyboard listeners for player controls and "press to start".
     */
    attachInput() {
        document.addEventListener("keydown", this.keyDownHandler, false);
        document.addEventListener("keyup", this.keyUpHandler, false);
    },

    /**
     * Starts periodic difficulty increase (idempotent).
     */
    startDifficultyRamp() {
        if (this.difficultyIntervalId !== null) return;

        this.difficultyIntervalId = setInterval(() => {
            this.difficultyLevel++;
        }, 5000);
    },

    /**
     * Auto-starts the game when returning from a "retry" flow.
     * Expects the URL to contain ?retry=true
     */
    tryAutoStartFromURL() {
        const params = new URLSearchParams(window.location.search);

        // Validation: ensure "retry" exists and is explicitly set to "true"
        if (!params.has("retry") || params.get("retry") !== "true") {
            return;
        }

        this.gameStarted = true;
        this.startDifficultyRamp();
        this.playSfx("backgroundMusic");
    },


    /* =========================
       Input handling
    ========================= */


    keyDownHandler(e) {
        // If the game has not started yet, allow SPACE to open highscores.
        // Start the game on first left/right arrow press (if not already started).
        if (!this.gameStarted && !this.gameOver) { 
            if (e.code === "Space") {
                document.location.href = "highscores.html";
                return;
            } else if (e.code === "ArrowLeft" || e.code === "ArrowRight") {
                this.gameStarted = true;
                this.startDifficultyRamp();
                this.playSfx("backgroundMusic");
            }
        }

        if (e.code === "ArrowRight") this.rightPressed = true;
        else if (e.code === "ArrowLeft") this.leftPressed = true;
    },

    keyUpHandler(e) {
        if (e.code === "ArrowRight") this.rightPressed = false;
        else if (e.code === "ArrowLeft") this.leftPressed = false;
    },

    /* =========================
       Audio helpers
    ========================= */

    /**
     * Plays a sound effect by key, safely (no hard crash on browser restrictions).
     * Note: for background music, we do not reset currentTime.
     *
     * @param {string} key
     */
    playSfx(key) {
        const audio = this.sfx[key];
        if (!audio) return;

        try {
            if (key === "backgroundMusic") {
                audio.play().catch(() => {});
                return;
            }

            audio.currentTime = 0;
            audio.play();
        } catch (e) {
            // Intentionally ignored (autoplay policies, user gesture requirements, etc.)
        }
    },

    /* =========================
       Gameplay helpers (used by NoteType strategies)
    ========================= */

    /**
     * Adds points to the score.
     * @param {number} delta
     */
    addScore(delta) {
        this.score += delta;
    },

    /**
     * Adds a delta to lives (supports halves).
     * @param {number} delta
     */
    addLives(delta) {
        this.lives += delta;
    },

    /**
     * Triggers the "damage feedback" animation timer.
     * Called by damage note types (Fx/F).
     */
    notifyDamage() {
        this.livesLostAnimStart = performance.now();
    },

    /**
     * Checks whether lives are depleted and transitions to game over state if so.
     * Also plays the game over sound (one-shot).
     */
    checkGameOver() {
        if (this.lives > 0) return;

        this.lives = 0;
        this.gameOver = true;

        this.playSfx("gameOver");
    },

    /* =========================
       Note selection / spawning
    ========================= */

    /**
     * Weighted random selection among note types.
     * @returns {NoteType}
     */
    getRandomNoteType() {
        const r = Math.random() * this.totalWeight;
        let sum = 0;

        for (const element of this.noteTypes) {
            sum += element.weight;
            if (r < sum) return element;
        }

        // Fallback (should never happen with valid weights).
        return this.noteTypes[this.noteTypes.length - 1];
    },

    /**
     * Spawns a new falling note (runtime entity) and stores it.
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
     */
    updatePlayer() {
        if (this.gameOver) return;

        const step = 10 + (this.difficultyLevel / 5);

        if (this.rightPressed && this.caracterX < this.canvas.width - this.caracterWidth) {
            this.caracterX += step;
        } else if (this.leftPressed && this.caracterX > 0) {
            this.caracterX -= step;
        }
    },

    /**
     * Applies type-specific behavior for a collected note.
     * The note type owns the behavior via its onCatch strategy.
     *
     * @param {Note} note
     */
    applyCollisionEffects(note) {
        if (note && note.type && typeof note.type.onCatch === "function") {
            note.type.onCatch(this, note.type);
        }
    },

    /**
     * Updates notes positions, removes out-of-bounds notes, and handles collisions.
     */
    updateNotes() {
        // Compute player rectangle once per frame.
        const paddleX = this.caracterX;
        const paddleY = this.canvas.height - this.caracterHeight;
        const paddleW = this.caracterWidth;
        const paddleH = this.caracterHeight;
        
        for (let i = this.notes.length - 1; i >= 0; i--) {
            const n = this.notes[i];

            n.update();

            if (n.isOut(this.canvas.height)) {
                this.notes.splice(i, 1);
                continue;
            }

            if (this.gameOver) continue;

            if (n.collidesWithRect(paddleX, paddleY, paddleW, paddleH)) {
                this.applyCollisionEffects(n);
                this.notes.splice(i, 1);
            }
        }
    },

    /* =========================
       Rendering (background, entities, HUD)
    ========================= */

    drawBackground() {
        this.ctx.drawImage(this.background, 0, 0, this.canvas.width, this.canvas.height);
    },

    drawPlayer() {
        this.ctx.drawImage(
            this.caracter,
            this.caracterX,
            this.canvas.height - this.caracterHeight,
            this.caracterWidth,
            this.caracterHeight
        );
    },

    drawNotes() {
        for (const index in this.notes) {
            this.notes[index].draw(this.ctx);
        }
    },

    drawScore() {
        this.ctx.save();

        this.ctx.font = "bold 2em 'Press Start 2P', cursive";
        this.ctx.textBaseline = "top";
        this.ctx.textAlign = "left";
        this.ctx.fillStyle = "#00faff";

        // Neon glow layers for readability over the background.
        this.ctx.shadowColor = "#00faff";
        this.ctx.shadowBlur = 8;
        this.ctx.fillText("SCORE: " + this.score, 20, 40);

        this.ctx.shadowColor = "#00e1ff";
        this.ctx.shadowBlur = 20;
        this.ctx.fillText("SCORE: " + this.score, 20, 40);

        this.ctx.shadowBlur = 40;
        this.ctx.fillText("SCORE: " + this.score, 20, 40);

        this.ctx.restore();
    },

    drawLives() {
        this.ctx.save();

        const heartSize = 60;
        const spacing = 8;
        const marginRight = 20;
        const marginTop = 18;

        const full = Math.floor(this.lives);
        const hasHalf = (this.lives % 1 !== 0) ? 1 : 0;

        // Blink effect when health is critical.
        if (this.lives <= 1) {
            const t = (performance.now() - this.blinkStart) / 1000;
            const blink = 0.25 + 0.75 * Math.abs(Math.sin(t * Math.PI * 2));
            this.ctx.globalAlpha = blink;
        }

        // Pulse + shake when taking damage.
        let scale = 1;
        let shakeX = 0;
        let shakeY = 0;

        if (this.livesLostAnimStart !== null) {
            const elapsed = performance.now() - this.livesLostAnimStart;

            if (elapsed <= this.livesLostAnimDuration) {
                const p = elapsed / this.livesLostAnimDuration;
                const pulse = Math.sin(p * Math.PI);
                scale = 1 + 0.18 * pulse;

                shakeX = (Math.random() - 0.5) * 4;
                shakeY = (Math.random() - 0.5) * 3;
            } else {
                this.livesLostAnimStart = null;
            }
        }

        // Apply neon shadow to images.
        this.ctx.shadowColor = "#ff3333";
        this.ctx.shadowBlur = 18;

        // Draw hearts from right to left.
        let x = this.canvas.width - marginRight;
        const y = marginTop;

        if (hasHalf) {
            x -= heartSize;

            this.ctx.save();
            this.ctx.translate(x + heartSize / 2 + shakeX, y + heartSize / 2 + shakeY);
            this.ctx.scale(scale, scale);
            this.ctx.drawImage(this.brokenHeartImg, -heartSize / 2, -heartSize / 2, heartSize, heartSize);
            this.ctx.restore();

            x -= spacing;
        }

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

    drawPressToStart() {
        this.ctx.save();

        // Blink effect for the start prompt (similar to the game over effect).
        const t = (performance.now() - this.startPromptBlinkStart) / 1000;
        const blink = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * Math.PI * 4));
        this.ctx.globalAlpha = blink;

        this.ctx.font = "bold 36px 'Press Start 2P', cursive";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillStyle = "#00faff";

        // Line 1
        this.ctx.shadowColor = "#00faff";
        this.ctx.shadowBlur = 10;
        this.ctx.fillText("PRESS LEFT/RIGHT ARROW", this.canvas.width / 2, this.canvas.height / 2 - 60);

        this.ctx.shadowColor = "#00e1ff";
        this.ctx.shadowBlur = 25;
        this.ctx.fillText("PRESS LEFT/RIGHT ARROW", this.canvas.width / 2, this.canvas.height / 2 - 60);

        this.ctx.shadowBlur = 50;
        this.ctx.fillText("PRESS LEFT/RIGHT ARROW", this.canvas.width / 2, this.canvas.height / 2 - 60);

        // Line 2
        this.ctx.shadowColor = "#00faff";
        this.ctx.shadowBlur = 10;
        this.ctx.fillText("TO START", this.canvas.width / 2, this.canvas.height / 2 + 10);

        this.ctx.shadowColor = "#00e1ff";
        this.ctx.shadowBlur = 25;
        this.ctx.fillText("TO START", this.canvas.width / 2, this.canvas.height / 2 + 10);

        this.ctx.shadowBlur = 50;
        this.ctx.fillText("TO START", this.canvas.width / 2, this.canvas.height / 2 + 10);

        // Line 3 (smaller font for the secondary action)
        this.ctx.font = "bold 22px 'Press Start 2P', cursive";

        this.ctx.shadowColor = "#00faff";
        this.ctx.shadowBlur = 10;
        this.ctx.fillText("OR PRESS SPACE FOR HIGHSCORES", this.canvas.width / 2, this.canvas.height / 2 + 80);

        this.ctx.shadowColor = "#00e1ff";
        this.ctx.shadowBlur = 25;
        this.ctx.fillText("OR PRESS SPACE FOR HIGHSCORES", this.canvas.width / 2, this.canvas.height / 2 + 80);

        this.ctx.shadowBlur = 50;
        this.ctx.fillText("OR PRESS SPACE FOR HIGHSCORES", this.canvas.width / 2, this.canvas.height / 2 + 80);

        this.ctx.restore();
    },

    drawGameOver() {
        this.ctx.save();

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

        // One-shot side effects: save score and redirect.
        if (!this.gameOverAlreadyHandled) {
            this.gameOverAlreadyHandled = true;

            // Keep your existing implementation (assumed to exist in your project).
            set_score_session(this.score);

            setTimeout(() => {
                document.location.href = "highscores.html";
            }, 2000);
        }
    },

    /* =========================
       Main loop
    ========================= */

    /**
     * Main loop: clears frame, renders background, updates and draws entities,
     * and draws overlays for start/game over states.
     */
    loop() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawBackground();

        // Start screen: render prompt and pause gameplay logic.
        if (!this.gameStarted && !this.gameOver) {
            this.drawPressToStart();
            requestAnimationFrame(this.loop);
            return;
        }

        // Spawn notes only while the game is running.
        if (!this.gameOver && Math.random() < 0.03 + (this.difficultyLevel / 300)) {
            this.spawnNote();
        }

        // Update simulation (positions, collisions, player movement).
        this.updateNotes();
        this.updatePlayer();

        // Render entities and HUD.
        this.drawPlayer();
        this.drawNotes();
        this.drawScore();
        this.drawLives();

        // Overlay game over (and one-shot side effects).
        if (this.gameOver) {
            this.drawGameOver();
        }

        requestAnimationFrame(this.loop);
    }
};

Object.assign(Game.prototype, gamePrototype);
