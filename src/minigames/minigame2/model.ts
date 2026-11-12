import { GRID_SIZE } from "./constants.ts";
import type { Board, Direction, GameLogic, GameState, } from "./types.ts"

const TO_LEFT: Record<Direction, Array<(board: Board)=> Board>> = {
  left: [],
  right: [reverseRows],
  up: [transpose],
  down: [transpose, reverseRows],
}
// chance that a new tile is a 4 instead of a 2
const FOUR_TILE_CHANCE = 0.1;

export class Game implements GameLogic {
  private board: Board = clear();
  private score: number = 0;
  private base: number = 2;
  private blocked: number[] = [];
  private question: string | null = null;
  private random: () => number;

  constructor(random: () => number = Math.random) {
    this.random = random;
  }

  // setup board to be expected
  setBoard(b: Board): void{
    this.board = b;
  }

  // get current state
  private getState(): GameState {
    return {
      board: this.board,
      score: this.score,
      status: hasMoves(this.board) ? "playing" : "over",
      base: this.base,
      blocked: this.blocked,
      question: this.question,
    };
  }

  // add random tile after a successful move
  private addRandomTile(): void{
    const emptyCells: Array<[number, number]> = [];
    for (let row = 0; row < this.board.length; row++) {
      for (let col = 0; col < this.board.length; col++) {
        if (this.board[row][col] === 0) {
          emptyCells.push([row, col]);
        }
      }
    }

    if (emptyCells.length === 0) {
      return;
    }

    // choose a random spot and put 2 or 4 in it
    const [row, col] = emptyCells[Math.floor(this.random() * emptyCells.length)];
    this.board[row][col] = this.random() < FOUR_TILE_CHANCE ? 4 : 2;
  }
  
  // start new game
  newGame(): GameState {
    this.board = clear();
    this.score = 0;
    this.addRandomTile();
    this.addRandomTile();
    return this.getState();
  }
  
  // update board after move
  move(dir: Direction): GameState {
    let board = this.board;

    // apply transformations to board based on direction
    for (const transform of TO_LEFT[dir]) {
      board = transform(board);
    }

    // slide line for each row and update score
    let gained = 0;
    board = board.map(row => {
      const { line, gained: g } = slideLine(row);
      gained += g;
      return line;
    });
    this.score += gained;

    // reverse transformations to get back to original orientation
    for (const transform of [...TO_LEFT[dir]].reverse()) {
      board = transform(board);
    }

    if (!boardsEqual(this.board, board)) {
      this.board = board;
      this.addRandomTile();
    }
  
    return this.getState();
  }

  // take the player's answer. For now it just returns the current state
  answer(_value: number): GameState {
    return this.getState();
  }
  
}

// the player can still move if there is an empty cell or two neighbors can merge
function hasMoves(board: Board): boolean{
  const size = board.length;
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (board[row][col] === 0) {
        return true;
      }
      if (col < size - 1 && canMerge(board[row][col], board[row][col + 1])) {
        return true;
      }
      if (row < size - 1 && canMerge(board[row][col], board[row + 1][col])) {
        return true;
      }
    }
  }
  return false;
}

function clear(): number[][] {
  return Array.from({length: GRID_SIZE}, () => Array(GRID_SIZE).fill(0));
}

// update array after slide 
export function slideLine(line: number[]): { line: number[]; gained: number } {
  const size = line.length;
  let gained: number = 0;
  // remove all 0
  line = line.filter(x => x !== 0);
  // update after-slide array
  for (let i: number = 0; i < line.length-1; i++){
    if (canMerge(line[i], line[i + 1])) {
      line[i] *= 2;
      gained += line[i];
      line.splice(i + 1, 1);
    }
  }
  while (line.length < size) line.push(0);

  return { line, gained };
}

// reverse array
export function reverseRows(board: Board): Board{
  return board.map(row => [...row].reverse());
}

// transpose array
export function transpose(board: Board): Board{
  return board[0].map((_, col) => board.map(row => row[col]));
}

export function boardsEqual(a: Board, b: Board): boolean{
  return a.every((row, i) => row.every((cell, j) => cell === b[i][j]));
}

// two tiles can merge when they have the same value; empty cells (0) never merge
export function canMerge(a: number, b: number): boolean{
  return a !== 0 && a === b;  
}
