/**
 * note.js
 * ------
 * Defines the Note runtime entity (one falling instance) and its prototype methods.
 *
 * Notes reference a NoteType for sprite + gameplay strategy (onCatch).
 * This keeps Note lightweight and focused on movement, rendering and collision tests.
 */

/**
 * @constructor
 * @param {NoteType} type - Registry object holding sprite and gameplay strategy.
 * @param {number} canvasWidth - Canvas width used to generate a random spawn position.
 * @param {number} noteW - Render width for notes.
 * @param {number} noteH - Render height for notes.
 * @param {number} difficultyLevel - Difficulty factor used to scale vertical speed.
 */
function Note(type, canvasWidth, noteW, noteH, difficultyLevel) {
    this.type = type;

    // Dimensions used for rendering and collision.
    this.w = noteW;
    this.h = noteH;

    // Spawn position (random X, starts above the visible area).
    this.x = Math.random() * (canvasWidth - this.w);
    this.y = -this.h;

    // Vertical speed increases with difficulty (plus a random component).
    this.dy = 2 + (difficultyLevel / 10) + Math.random() * difficultyLevel;
}

/**
 * Prototype methods grouped in a single object, then assigned at once.
 * This approach is compact and keeps the prototype definition centralized.
 */
const notePrototype = {
    /**
     * Updates the note's vertical position.
     */
    update() {
        this.y += this.dy;
    },

    /**
     * Draws the note sprite to the canvas.
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        ctx.drawImage(this.type.image, this.x, this.y, this.w, this.h);
    },

    /**
     * Checks whether the note is outside the canvas bounds.
     * @param {number} canvasHeight
     * @returns {boolean}
     */
    isOut(canvasHeight) {
        return this.y > canvasHeight;
    },

    /**
     * Axis-aligned bounding-box collision test against a rectangle.
     * @param {number} rx
     * @param {number} ry
     * @param {number} rw
     * @param {number} rh
     * @returns {boolean}
     */
    collidesWithRect(rx, ry, rw, rh) {
        return (
            this.x < rx + rw &&
            this.x + this.w > rx &&
            this.y < ry + rh &&
            this.y + this.h > ry
        );
    }
};

Object.assign(Note.prototype, notePrototype);
