import type { Board, Direction, GameLogic, GameState, GameStatus } from "./types.ts"

// set up constant grid size to be 4x4
const GRID_SIZE = 4

export class Game implements GameLogic {
  private board: number[][] = clear();
  private score: number = 0;
  private status: GameStatus = "playing";

  // setup board to be expected
  setBoard(b: number[][]): void{
    this.board = b;
  }

  // get current state
  getState() {
    return { board:this.board, score:this.score, status:this.status};
  }
  
  // start new game
  newGame(): GameState {
    this.board = clear();
    this.score = 0;
    this.status = "playing";
    return this.getState();
  }
  
  // 
  move(dir: Direction): GameState {
    
  
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