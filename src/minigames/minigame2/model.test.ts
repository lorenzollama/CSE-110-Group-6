import { describe, expect, it, vi } from "vitest";
import { GRID_SIZE } from "./constants.ts";
import { boardsEqual, canMerge, Game, reverseRows, slideLine, transpose } from "./model.ts";
import type { Board, Direction } from "./types.ts";

const cases: Array<[number[], number[], number]> = [
  [[2, 2, 4, 4], [4, 8, 0, 0], 12],
  [[2, 2, 2, 2], [4, 4, 0, 0], 8],
  [[2, 2, 2, 0], [4, 2, 0, 0], 4],
  [[4, 4, 8, 0], [8, 8, 0, 0], 8],
  [[2, 0, 2, 4], [4, 4, 0, 0], 4],
  [[0, 0, 0, 2], [2, 0, 0, 0], 0],
  [[0, 0, 0, 0], [0, 0, 0, 0], 0],
  [[2, 2, 4, 8], [4, 4, 8, 0], 4],
  [[2, 4, 2, 4], [2, 4, 2, 4], 0],
];

for (const [input, expected, gained] of cases) {
  it(`slideLine(${JSON.stringify(input)})`, () => {
    expect(slideLine(input)).toEqual({ line: expected, gained });
  });
}

describe("transpose", () => {
  it("turns each row into a column", () => {
    const board = [
      [1, 2, 3, 4],
      [5, 6, 7, 8],
      [9, 10, 11, 12],
      [13, 14, 15, 16],
    ];

    expect(transpose(board)).toEqual([
      [1, 5, 9, 13],
      [2, 6, 10, 14],
      [3, 7, 11, 15],
      [4, 8, 12, 16]
    ]);
  });

  it("does not change the board it is given", () => {
    const board = [
      [1, 2],
      [3, 4],
    ];

    transpose(board);

    expect(board).toEqual([
      [1, 2],
      [3, 4]
    ]);
  });
});

describe("reverse rows", () => {
  it("reverses each row", () => {
    const board = [
      [1, 2, 3, 4],
      [5, 6, 7, 8],
      [9, 10, 11, 12],
      [13, 14, 15, 16],
    ];

    expect(reverseRows(board)).toEqual([
      [4, 3, 2, 1],
      [8, 7, 6, 5],
      [12, 11, 10, 9],
      [16, 15, 14, 13],
    ]);
  });

  it("does not change the board it is given", () => {
    const board = [
      [1, 2],
      [3, 4],
    ];

    reverseRows(board);

    expect(board).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });
});

/**
 * A fake Math.random that returns `values` in order, then starts over.
 *
 * Each new tile uses two numbers: the first picks the empty cell (0 = the first
 * empty cell in reading order, 0.99 = the last) and the second picks the value
 * (below 0.1 = a 4, otherwise a 2).
 */
function fakeRandom(...values: number[]): () => number {
  let next = 0;
  return () => values[next++ % values.length];
}

// by default new tiles go in the first empty cell and are always a 2
function gameWithBoard(board: Board, random = fakeRandom(0, 0.5)): Game {
  const game = new Game(random);
  game.setBoard(board);
  return game;
}

describe("Game.newGame", () => {
  it("starts with two tiles, a score of 0, and status playing", () => {
    const state = new Game(fakeRandom(0, 0.5)).newGame();

    const board = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
    board[0][0] = 2;
    board[0][1] = 2;

    expect(state).toEqual({
      board,
      score: 0,
      status: "playing",
      base: 2,
      blocked: [],
      question: null,
    });
  });

  it("puts the starting tiles where the random numbers point", () => {
    // 0.99 picks the last empty cell each time
    const state = new Game(fakeRandom(0.99, 0.5)).newGame();

    expect(state.board[GRID_SIZE - 1].slice(-2)).toEqual([2, 2]);
  });

  it("clears the board and score from the last game", () => {
    const game = gameWithBoard([
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 16],
    ]);
    expect(game.move("left").score).toBe(4);

    const state = game.newGame();

    expect(state.score).toBe(0);
    expect(state.board.flat().filter(tile => tile !== 0)).toHaveLength(2);
  });
});

describe("Game.move", () => {
  // returns a new copy each time, so one test can't change another test's board
  function startBoard(): Board {
    return [
      [2, 2, 4, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [2, 0, 0, 0],
    ];
  }

  // the same start board moved each way: one pair of 2s merges, so every move scores 4.
  // each result also has a new 2 in the first empty cell (reading order)
  const directionCases: Array<[Direction, Board]> = [
    ["left", [[4, 4, 2, 0], [0, 0, 0, 0], [0, 0, 0, 0], [2, 0, 0, 0]]],
    ["right", [[2, 0, 4, 4], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 2]]],
    ["up", [[4, 2, 4, 2], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]],
    ["down", [[2, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [4, 2, 4, 0]]],
  ];

  for (const [direction, expected] of directionCases) {
    it(`slides and merges tiles ${direction}`, () => {
      const state = gameWithBoard(startBoard()).move(direction);

      expect(state.board).toEqual(expected);
      expect(state.score).toBe(4);
    });

    // checks both moves: if move() changed some shared state, one of the two would be wrong
    it(`gives the same result every time it moves ${direction}`, () => {
      const game = gameWithBoard(startBoard());
      expect(game.move(direction).board).toEqual(expected);

      game.setBoard(startBoard());
      expect(game.move(direction).board).toEqual(expected);
    });
  }

  it("slides tiles all the way across a new board", () => {
    const game = new Game(fakeRandom(0, 0.5));
    game.newGame();

    // the two starting 2s merge at the far right, and the new 2 lands at the far left
    const state = game.move("right");

    expect(state.board[0][GRID_SIZE - 1]).toBe(4);
    expect(state.board[0][0]).toBe(2);
  });

  it("adds up the score across moves", () => {
    const game = gameWithBoard([
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [4, 0, 0, 0],
    ]);

    expect(game.move("left").score).toBe(4); // 2 + 2
    expect(game.move("up").score).toBe(12); // then 4 + 4
  });

  it("changes nothing when no tile can move that way", () => {
    const board: Board = [
      [2, 4, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];

    const random = vi.fn(Math.random);

    const state = gameWithBoard(board, random).move("left");

    expect(state.board).toEqual(board);
    expect(state.score).toBe(0);
    expect(random).not.toHaveBeenCalled(); // no new tile was added
  });

  it("puts the new tile in the empty cell the random number points to", () => {
    // 0.99 picks the last empty cell, which is (3, 3) after sliding left
    const state = gameWithBoard(startBoard(), fakeRandom(0.99, 0.5)).move("left");

    expect(state.board[3]).toEqual([2, 0, 0, 2]);
  });

  it("makes the new tile a 4 only when the random number is below the 4-tile chance", () => {
    const four = gameWithBoard(startBoard(), fakeRandom(0, 0.05)).move("left");
    expect(four.board[0]).toEqual([4, 4, 4, 0]);

    // 0.1 is exactly the chance, so it is not below it and makes a 2
    const two = gameWithBoard(startBoard(), fakeRandom(0, 0.1)).move("left");
    expect(two.board[0]).toEqual([4, 4, 2, 0]);
  });
});

describe("Game.answer", () => {
  it("returns the current state for now", () => {
    const game = new Game(fakeRandom(0, 0.5));
    const state = game.newGame();

    expect(game.answer(5)).toEqual(state);
  });
});

describe("boardsEqual", () => {
  // returns a new copy each time, so the two boards being compared are different arrays
  function sampleBoard(): Board {
    return [
      [2, 4, 0, 0],
      [0, 8, 0, 0],
      [0, 0, 16, 0],
      [0, 0, 0, 32],
    ];
  }

  it("is true for two separate boards with the same tiles", () => {
    expect(boardsEqual(sampleBoard(), sampleBoard())).toBe(true);
  });

  it("is false when one tile is different", () => {
    const changed = sampleBoard();
    changed[1][1] = 4;

    expect(boardsEqual(sampleBoard(), changed)).toBe(false);
  });

  it("is false when only the last cell is different", () => {
    const changed = sampleBoard();
    changed[3][3] = 0;

    expect(boardsEqual(sampleBoard(), changed)).toBe(false);
  });

  it("does not ignore a tile that moved to an empty cell", () => {
    const changed = sampleBoard();
    changed[0] = [0, 0, 2, 4];

    expect(boardsEqual(sampleBoard(), changed)).toBe(false);
  });
});

describe("canMerge", () => {
  it("merges two tiles with the same value", () => {
    expect(canMerge(2, 2)).toBe(true);
    expect(canMerge(1024, 1024)).toBe(true);
  });

  it("does not merge tiles with different values", () => {
    expect(canMerge(2, 4)).toBe(false);
    expect(canMerge(2, 0)).toBe(false);
  });

  it("does not merge two empty cells", () => {
    expect(canMerge(0, 0)).toBe(false);
  });
});

describe("Game status", () => {
  it("is over when the board is full and no neighbors can merge", () => {
    const stuck: Board = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ];

    const state = gameWithBoard(stuck).move("left");

    expect(state.board).toEqual(stuck);
    expect(state.status).toBe("over");
  });

  it("is over after the new tile fills the last empty cell with no merges left", () => {
    // sliding right opens (3, 0), and the new 4 there matches none of its neighbors
    const game = gameWithBoard(
      [
        [2, 4, 2, 4],
        [4, 2, 4, 2],
        [2, 4, 2, 4],
        [2, 4, 2, 0],
      ],
      fakeRandom(0, 0.05),
    );

    const state = game.move("right");

    expect(state.board[3]).toEqual([4, 2, 4, 2]);
    expect(state.status).toBe("over");
  });

  it("keeps playing when the board is full but two tiles in a column can merge", () => {
    // the two 8s in the first column can merge up or down
    const board: Board = [
      [8, 4, 2, 4],
      [8, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ];

    // left changes nothing, but the game is not over
    const state = gameWithBoard(board).move("left");

    expect(state.board).toEqual(board);
    expect(state.status).toBe("playing");
  });

  it("keeps playing when the only merge is in the last row", () => {
    // the two 8s are at the bottom right, the last pair hasMoves checks
    const board: Board = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 8, 8],
    ];

    // up changes nothing, but the game is not over
    const state = gameWithBoard(board).move("up");

    expect(state.board).toEqual(board);
    expect(state.status).toBe("playing");
  });
});
