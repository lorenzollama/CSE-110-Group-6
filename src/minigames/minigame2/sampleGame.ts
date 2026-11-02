import type { Direction, GameLogic, GameState } from "./types.ts";

// A board with one tile of every value so the tile colors can be checked
const SAMPLE_STATE: GameState = {
  board: [
    [2, 4, 8, 16],
    [32, 64, 128, 256],
    [512, 1024, 2048, 0],
    [0, 0, 0, 0],
  ],
  score: 0,
  status: "playing",
};

/**
 * SampleGame - a temp place holder for the real Game class 
 *
 * newGame() and move() always return the same sample board, so the front end
 * can be built while the back end is wip. When the real Game class is
 * complete, use it in src/main.ts instead and delete this file.
 */
export class SampleGame implements GameLogic {
  newGame(): GameState {
    return SAMPLE_STATE;
  }

  // the underscore marks a parameter that is not used on purpose
  move(_direction: Direction): GameState {
    return SAMPLE_STATE;
  }
}