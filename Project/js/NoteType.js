/**
 * noteType.js
 * ----------
 * Defines the NoteType "class" and a factory-based registry.
 *
 * A NoteType contains immutable/static data shared by all notes of that type:
 *  - weighted spawn probability
 *  - scoring and life impact
 *  - preloaded sprite image
 *  - onCatch strategy (applies gameplay effects when the note is collected)
 */

/**
 * @constructor
 * @param {string} name - Human-readable identifier (e.g., "A", "Fx").
 * @param {string} src - Sprite URL.
 * @param {number} weight - Relative spawn probability weight (used in weighted random).
 * @param {number} scoreValue - Points awarded when collected.
 * @param {number} lifeDelta - Life variation (supports halves, e.g., -0.5).
 * @param {(game: any, type: NoteType) => void} onCatch - Strategy called when collected.
 */
function NoteType(name, src, weight, scoreValue, lifeDelta, onCatch) {
    this.name = name;
    this.src = src;
    this.weight = weight;
    this.score = scoreValue;
    this.lifeDelta = lifeDelta;

    // Strategy function executed on collection (keeps Game free of type-specific branching).
    this.onCatch = onCatch;

    // Preload the sprite once per type (critical for performance).
    this.image = new Image();
    this.image.src = src;
}

/**
 * Factory helper: creates a NoteType from a configuration object.
 * @param {Object} cfg
 * @returns {NoteType}
 */
function makeNoteType(cfg) {
    return new NoteType(cfg.name, cfg.src, cfg.weight, cfg.score, cfg.lifeDelta, cfg.onCatch);
}

/**
 * Builds the NoteType registry (array) using factory-created configurations.
 * Each type defines its own onCatch behavior.
 *
 * @returns {NoteType[]}
 */
function buildNoteTypes() {
    return [
        makeNoteType({
            name: "A",
            src: "../assets/images/A.png",
            weight: 5 / 100,
            score: 100,
            lifeDelta: 0.25,
            onCatch(game, type) {
                game.addScore(type.score);
                game.addLives(type.lifeDelta);
                game.playSfx("goodA");
            }
        }),
        makeNoteType({
            name: "B",
            src: "../assets/images/B.png",
            weight: 10 / 100,
            score: 50,
            lifeDelta: 0,
            onCatch(game, type) {
                game.addScore(type.score);
                game.playSfx("good");
            }
        }),
        makeNoteType({
            name: "C",
            src: "../assets/images/C.png",
            weight: 15 / 100,
            score: 30,
            lifeDelta: 0,
            onCatch(game, type) {
                game.addScore(type.score);
                game.playSfx("good");
            }
        }),
        makeNoteType({
            name: "D",
            src: "../assets/images/D.png",
            weight: 15 / 100,
            score: 20,
            lifeDelta: 0,
            onCatch(game, type) {
                game.addScore(type.score);
                game.playSfx("good");
            }
        }),
        makeNoteType({
            name: "E",
            src: "../assets/images/E.png",
            weight: 15 / 100,
            score: 10,
            lifeDelta: 0,
            onCatch(game, type) {
                game.addScore(type.score);
                game.playSfx("good");
            }
        }),
        makeNoteType({
            name: "Fx",
            src: "../assets/images/Fx.png",
            weight: 25 / 100,
            score: 0,
            lifeDelta: -0.5,
            onCatch(game, type) {
                // Damage note: apply life loss, trigger feedback, then check for game over.
                game.addLives(type.lifeDelta);
                game.notifyDamage();
                game.playSfx("bad");
                game.checkGameOver();
            }
        }),
        makeNoteType({
            name: "F",
            src: "../assets/images/F.png",
            weight: 15 / 100,
            score: 0,
            lifeDelta: -1,
            onCatch(game, type) {
                // Heavy damage note: same pipeline as Fx, stronger life loss.
                game.addLives(type.lifeDelta);
                game.notifyDamage();
                game.playSfx("bad");
                game.checkGameOver();
            }
        })
    ];
}
