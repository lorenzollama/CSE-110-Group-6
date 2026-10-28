
// set up constant grid size to be 4x4
const GRID_SIZE = 4

let board: number[][] = clear();
let score: number = 0;

export type Direction = "left" | "right" | "up" | "down";


function clear(): number[][] {
  return Array.from({length: GRID_SIZE}, () => Array(GRID_SIZE).fill(0));
}

// setup board to be expected
export function setBoard(b: number[][]): void{
  board = b;
}

export function reset(): void {
  board = clear();
  score = 0;
}

export function getState() {
  return { board, score };
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

// 
export function move(dir: Direction): boolean {
  

  return false;
}