import type { Board, Direction, GameLogic, GameState, GameStatus } from "./types.ts"

// set up constant grid size to be 4x4
const GRID_SIZE = 4

const TO_LEFT: Record<Direction, Array<(board: Board)=> Board>> = {
  left: [],
  right: [reverseRows],
  up: [transpose],
  down: [transpose, reverseRows],
}

export class Game implements GameLogic {
  private board: Board = clear();
  private score: number = 0;
  private status: GameStatus = "playing";

  // setup board to be expected
  setBoard(b: Board): void{
    this.board = b;
  }

  // get current state
  private getState(): GameState {
    return { board:this.board, score:this.score, status:this.status};
  }

  // add random tile after a successful move
  private addRandomTile(): void{
    
  }
  
  // start new game
  newGame(): GameState {
    this.board = clear();
    this.score = 0;
    this.status = "playing";
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
}

function clear(): number[][] {
  return Array.from({length: GRID_SIZE}, () => Array(GRID_SIZE).fill(0));
}


// update array after slide 
export function slideLine(line: number[]): { line: number[]; gained: number } {
  let gained: number = 0;
  // remove all 0
  line = line.filter(x => x !== 0);
  // update after-slide array
  for (let i: number = 0; i < line.length-1; i++){
    if (line[i] === line[i + 1]) {
      line[i] *= 2;
      gained += line[i];
      line.splice(i + 1, 1);
    }
  }
  while (line.length < GRID_SIZE) line.push(0);

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