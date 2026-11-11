
// Shared types for Minigame 2 so the front and backends can share data back and forth

/** The four ways the player can move the tiles */
export type Direction = "up" | "down" | "left" | "right";

/** The board of tiles (board[row][col]). 0 means the cell is empty. */
export type Board = number[][];

/** Game status to communicate to the front end when a game has ended */
export type GameStatus = "playing" | "over";

/** What newGame(), move() and answer() return */
export interface GameState {
  board: Board;
  score: number;
  status: GameStatus;
  /** What the tiles are powers of */
  base: number;
  /** The tile values that can't merge */
  blocked: number[];
  /** The text to show (like "3^4" or "√81"), or null when there is no question */
  question: string | null;
}

/** What the frontend needs from the back end's Game class */
export interface GameLogic {
  newGame(): GameState;
  move(direction: Direction): GameState;
  answer(value: number): GameState;
}