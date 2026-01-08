/**
 * Defines the NoteType abstraction and the factory-based registry used by the game.
 *
 * A NoteType holds immutable, shared data for all notes of that type:
 *  - weighted spawn probability
 *  - score and life impact values
 *  - preloaded sprite image
 *  - onCatch strategy executed when the note is collected
 */

/**
 * NoteType constructor.
 *
 * @constructor
 * @param {string} name - Human-readable identifier (e.g. "A", "Fx")
 * @param {string} src - Sprite image URL
 * @param {number} weight - Relative spawn probability weight used for weighted selection
 * @param {number} scoreValue - Points awarded when the note is collected
 * @param {number} lifeDelta - Life variation applied on collection (supports fractional values)
 * @param {(game: any, type: NoteType) => void} onCatch - Strategy executed when the note is collected
 */
function NoteType(name, src, weight, scoreValue, lifeDelta, onCatch) {
    this.name = name;
    this.src = src;
    this.weight = weight;
    this.score = scoreValue;
    this.lifeDelta = lifeDelta;

    // Stores the strategy executed on collection to avoid type-specific branching in Game.
    this.onCatch = onCatch;

    // Preloads the sprite once per type to avoid runtime image creation.
    this.image = new Image();
    this.image.src = src;
}

/**
 * Factory helper used to instantiate a NoteType from a configuration object.
 *
 * @param {Object} cfg - Plain configuration object describing a note type
 * @returns {NoteType} Instantiated NoteType
 */
function makeNoteType(cfg) {
    return new NoteType(cfg.name, cfg.src, cfg.weight, cfg.score, cfg.lifeDelta, cfg.onCatch);
}

/**
 * Builds and returns the NoteType registry.
 * Each entry defines its own onCatch behavior, encapsulating gameplay effects.
 *
 * @returns {NoteType[]} Array of all available note types
 */
function buildNoteTypes() {
    return [
        makeNoteType({
            name: "A",
            src: "./assets/images/A.png",
            weight: 5 / 100,
            score: 100,
            lifeDelta: 0.25,
            onCatch(game, type) {
                // High-value note: rewards score and slightly restores life.
                game.addScore(type.score);
                game.addLives(type.lifeDelta);
                game.playSfx("goodA");
            }
        }),
        makeNoteType({
            name: "B",
            src: "./assets/images/B.png",
            weight: 10 / 100,
            score: 50,
            lifeDelta: 0,
            onCatch(game, type) {
                // Standard positive note: awards score only.
                game.addScore(type.score);
                game.playSfx("good");
            }
        }),
        makeNoteType({
            name: "C",
            src: "./assets/images/C.png",
            weight: 15 / 100,
            score: 30,
            lifeDelta: 0,
            onCatch(game, type) {
                // Standard positive note: awards score only.
                game.addScore(type.score);
                game.playSfx("good");
            }
        }),
        makeNoteType({
            name: "D",
            src: "./assets/images/D.png",
            weight: 15 / 100,
            score: 20,
            lifeDelta: 0,
            onCatch(game, type) {
                // Low-value positive note: awards a small score increment.
                game.addScore(type.score);
                game.playSfx("good");
            }
        }),
        makeNoteType({
            name: "E",
            src: "./assets/images/E.png",
            weight: 15 / 100,
            score: 10,
            lifeDelta: 0,
            onCatch(game, type) {
                // Minimal-value positive note: awards a small score increment.
                game.addScore(type.score);
                game.playSfx("good");
            }
        }),
        makeNoteType({
            name: "Fx",
            src: "./assets/images/Fx.png",
            weight: 25 / 100,
            score: 0,
            lifeDelta: -0.5,
            onCatch(game, type) {
                // Damage note: applies life loss, triggers feedback, and checks for game over.
                game.addLives(type.lifeDelta);
                game.notifyDamage();
                game.playSfx("bad");
                game.checkGameOver();
            }
        }),
        makeNoteType({
            name: "F",
            src: "./assets/images/F.png",
            weight: 15 / 100,
            score: 0,
            lifeDelta: -1,
            onCatch(game, type) {
                // Heavy damage note: applies a stronger life loss using the same damage pipeline.
                game.addLives(type.lifeDelta);
                game.notifyDamage();
                game.playSfx("bad");
                game.checkGameOver();
            }
        })
    ];
}
