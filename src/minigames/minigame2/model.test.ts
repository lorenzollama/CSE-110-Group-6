import { describe, expect, it } from "vitest";
import { boardsEqual, Game, reverseRows, slideLine, transpose } from "./model.ts";
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

  function gameWithBoard(board: Board): Game {
    const game = new Game();
    game.setBoard(board);
    return game;
  }

  // the same start board moved each way: one pair of 2s merges, so every move scores 4
  const directionCases: Array<[Direction, Board]> = [
    ["left", [[4, 4, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [2, 0, 0, 0]]],
    ["right", [[0, 0, 4, 4], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 2]]],
    ["up", [[4, 2, 4, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]],
    ["down", [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [4, 2, 4, 0]]],
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

    const state = gameWithBoard(board).move("left");

    expect(state.board).toEqual(board);
    expect(state.score).toBe(0);
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
