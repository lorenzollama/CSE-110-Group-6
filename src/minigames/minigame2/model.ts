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
// how many moves that change the board come between questions
const TURNS_BETWEEN_QUESTIONS = 5;
// chance that a question is a square root instead of a power
const SQUARE_ROOT_CHANCE = 0.5;
// the powers a question can ask about
const QUESTION_POWERS = [2, 3, 4, 5, 6];
// only even powers, so the answer is a whole number (64 is 2^6, so √64 is 2^3)
const SQUARE_ROOT_POWERS = [2, 4, 6];

// a question for the player. The front end only gets the text
export interface Question {
  text: string;
  answer: number;
}

export class Game implements GameLogic {
  private board: Board = clear();
  private score: number = 0;
  private base: number = 2;
  private blocked: number[] = [];
  private question: Question | null = null;
  private turnsLeft: number = turnsUntilQuestion();
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
      question: this.question === null ? null : this.question.text,
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
    this.question = null;
    this.turnsLeft = turnsUntilQuestion();
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
      this.countTurn();
    }
  
    return this.getState();
  }

  // take the player's answer, clear the question and start the count over
  answer(_value: number): GameState {
    if (this.question === null) {
      return this.getState();
    }

    this.question = null;
    this.turnsLeft = turnsUntilQuestion();
    return this.getState();
  }

  // count a move that changed the board and ask a question when it is time
  private countTurn(): void {
    this.turnsLeft--;
    if (this.turnsLeft === 0) {
      this.question = makeQuestion(this.base, this.random);
    }
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

// how many turns until the next question. A constant for now so it can be made random later
export function turnsUntilQuestion(): number {
  return TURNS_BETWEEN_QUESTIONS;
}

// pick a random number from the list
function pickRandom(list: number[], random: () => number): number {
  return list[Math.floor(random() * list.length)];
}

// make a random question for the base, either a power like 2^5 or a square root like √64
export function makeQuestion(base: number, random: () => number): Question {
  if (random() < SQUARE_ROOT_CHANCE) {
    const power = pickRandom(SQUARE_ROOT_POWERS, random);
    return { text: `√${base ** power}`, answer: base ** (power / 2) };
  }

  const power = pickRandom(QUESTION_POWERS, random);
  return { text: `${base}^${power}`, answer: base ** power };
}
