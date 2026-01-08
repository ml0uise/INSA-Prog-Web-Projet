/**
 * Defines the Note runtime entity (a single falling instance) and its prototype methods.
 *
 * References a NoteType for sprite data and gameplay strategy (onCatch),
 * keeping this object focused on movement, rendering, and collision detection.
 */

/**
 * Note constructor.
 *
 * @constructor
 * @param {NoteType} type - Registry entry providing sprite assets and gameplay behavior.
 * @param {number} canvasWidth - Canvas width used to compute a random horizontal spawn position.
 * @param {number} noteW - Render width of the note sprite.
 * @param {number} noteH - Render height of the note sprite.
 * @param {number} difficultyLevel - Difficulty factor used to scale the vertical falling speed.
 */
function Note(type, canvasWidth, noteW, noteH, difficultyLevel) {
    this.type = type;

    // Stores dimensions used for rendering and collision checks.
    this.w = noteW;
    this.h = noteH;

    // Computes the spawn position: random X, starting just above the visible canvas.
    this.x = Math.random() * (canvasWidth - this.w);
    this.y = -this.h;

    // Computes vertical speed based on difficulty, with a small random variance.
    this.dy = 2 + (difficultyLevel / 10) + Math.random() * difficultyLevel;
}

/**
 * Groups all Note prototype methods in a single object.
 * Keeps the prototype definition centralized and easy to maintain.
 */
const notePrototype = {
    /**
     * Updates the note position for the current frame.
     * Advances the note downward using its precomputed vertical speed.
     */
    update() {
        this.y += this.dy;
    },

    /**
     * Renders the note sprite at its current position.
     *
     * @param {CanvasRenderingContext2D} ctx - Rendering context used to draw the note
     */
    draw(ctx) {
        ctx.drawImage(this.type.image, this.x, this.y, this.w, this.h);
    },

    /**
     * Determines whether the note has exited the visible canvas area.
     *
     * @param {number} canvasHeight - Height of the canvas in pixels
     * @returns {boolean} True when the note is fully below the canvas
     */
    isOut(canvasHeight) {
        return this.y > canvasHeight;
    },

    /**
     * Performs an axis-aligned bounding box (AABB) collision test against a rectangle.
     *
     * @param {number} rx - Rectangle X position
     * @param {number} ry - Rectangle Y position
     * @param {number} rw - Rectangle width
     * @param {number} rh - Rectangle height
     * @returns {boolean} True when the note intersects the given rectangle
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

// Assigns the grouped methods to the Note prototype.
Object.assign(Note.prototype, notePrototype);
