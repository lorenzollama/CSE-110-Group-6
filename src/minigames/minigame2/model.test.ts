import { describe, expect, it, vi } from "vitest";
import { GRID_SIZE } from "./constants.ts";
import {
  boardsEqual,
  canMerge,
  Game,
  makeNewBaseQuestion,
  makeQuestion,
  QUESTIONS_BEFORE_NEW_BASE,
  reverseRows,
  slideLine,
  transpose,
  turnsUntilQuestion,
} from "./model.ts";
import type { Board, Direction, GameState } from "./types.ts";

// Example data: questions to give the game with setQuestion
const POWER_QUESTION = { text: "2^5", answer: 32, tile: 32 };
const NEW_BASE_QUESTION = { text: "3^2", answer: 9, tile: 9, newBase: 3 };

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
function gameWithBoard(board: Board, random = fakeRandom(0, 0.5), base = 2): Game {
  const game = new Game(random);
  game.setBoard(board, base);
  return game;
}

// a game that has started. Each move right changes its board, because the new tile lands at the far left
function startedGame(): Game {
  const game = new Game(fakeRandom(0, 0.5));
  game.newGame();
  return game;
}

// plays the moves and returns the state after the last one
function playTurns(game: Game, turns: number): GameState {
  for (let turn = 1; turn < turns; turn++) {
    game.move("right");
  }
  return game.move("right");
}

// blocks the tile the way the game does, with a wrong answer
function blockTile(game: Game, tile: number): GameState {
  game.setQuestion({ text: "a question", answer: tile, tile });
  return game.answer(0);
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

describe("Game questions", () => {
  it("asks a question after the set number of moves and not before", () => {
    expect(playTurns(startedGame(), turnsUntilQuestion() - 1).question).toBeNull();
    expect(playTurns(startedGame(), turnsUntilQuestion()).question).not.toBeNull();
  });

  it("does not count moves that change nothing", () => {
    const game = gameWithBoard([
      [2, 4, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);

    for (let turn = 0; turn < turnsUntilQuestion(); turn++) {
      expect(game.move("left").question).toBeNull();
    }
  });

  it("clears the question and starts the count over after an answer", () => {
    const game = startedGame();
    playTurns(game, turnsUntilQuestion());

    expect(game.answer(5).question).toBeNull();

    expect(playTurns(game, turnsUntilQuestion() - 1).question).toBeNull();
    expect(game.move("right").question).not.toBeNull();
  });

  it("does nothing when an answer comes with no question", () => {
    const game = startedGame();
    const state = playTurns(game, turnsUntilQuestion() - 1);

    expect(game.answer(5)).toEqual(state);
    expect(game.move("right").question).not.toBeNull(); // the count did not start over
  });

  it("clears the question on a new game", () => {
    const game = startedGame();
    playTurns(game, turnsUntilQuestion());

    expect(game.newGame().question).toBeNull();
  });

  it("starts the count over on a new game", () => {
    const game = startedGame();
    playTurns(game, turnsUntilQuestion() - 1);
    game.newGame();

    expect(playTurns(game, turnsUntilQuestion() - 1).question).toBeNull();
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

describe("makeQuestion", () => {
  // the first random number picks the kind (below 0.5 = a square root), the second picks the power
  it.each([
    [2, 0.5, 0.6, "2^5", 32],
    [3, 0.5, 0.4, "3^4", 81],
    [2, 0.4, 0.99, "√64", 8],
    [3, 0.4, 0.5, "√81", 9],
  ])("in base %i with %d and %d asks %s", (base, kind, power, text, answer) => {
    expect(makeQuestion(base, fakeRandom(kind, power))).toMatchObject({ text, answer });
  });

  it("uses the lowest and highest powers", () => {
    expect(makeQuestion(2, fakeRandom(0.5, 0)).text).toBe("2^2");
    expect(makeQuestion(2, fakeRandom(0.5, 0.99)).text).toBe("2^6");
    expect(makeQuestion(2, fakeRandom(0, 0)).text).toBe("√4");
  });

  it("always gives a square root with a whole number answer", () => {
    for (let base = 2; base <= 9; base++) {
      for (const power of [0, 0.5, 0.99]) {
        const { answer } = makeQuestion(base, fakeRandom(0, power));

        expect(Number.isInteger(answer)).toBe(true);
      }
    }
  });
});

describe("wrong answers", () => {
  it("blocks the tile when the answer is wrong", () => {
    const game = startedGame();
    game.setQuestion(POWER_QUESTION);

    expect(game.answer(30).blocked).toEqual([32]);
  });

  it("blocks nothing when the answer is right", () => {
    const game = startedGame();
    game.setQuestion(POWER_QUESTION);

    expect(game.answer(32).blocked).toEqual([]);
  });

  it("keeps the tiles from earlier wrong answers", () => {
    const game = startedGame();
    game.setQuestion(POWER_QUESTION);
    game.answer(30);
    game.setQuestion({ text: "2^3", answer: 8, tile: 8 });

    expect(game.answer(6).blocked).toEqual([32, 8]);
  });

  it("picks the answer as the tile for a power and the number under the root for a square root", () => {
    expect(makeQuestion(2, fakeRandom(0.5, 0.6)).tile).toBe(32); // 2^5
    expect(makeQuestion(2, fakeRandom(0.4, 0.99)).tile).toBe(64); // √64 has the answer 8
  });

  it("clears the blocked tiles on a new game", () => {
    const game = startedGame();
    game.setQuestion(POWER_QUESTION);
    game.answer(30);

    expect(game.newGame().blocked).toEqual([]);
  });
});

describe("blocked tiles", () => {
  it("can't merge, but other tiles can", () => {
    expect(canMerge(32, 32, [32])).toBe(false);
    expect(canMerge(16, 16, [32])).toBe(true);
  });

  it("still slide on a move", () => {
    const game = gameWithBoard([
      [0, 8, 8, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    blockTile(game, 8);

    const state = game.move("left");

    expect(state.board[0]).toEqual([8, 8, 2, 0]);
    expect(state.score).toBe(0);
  });

  it("can still be made by merging two smaller tiles", () => {
    const game = gameWithBoard([
      [4, 4, 8, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    blockTile(game, 8);

    expect(game.move("left").board[0]).toEqual([8, 8, 2, 0]);
  });

  it("end the game when the only merge left is blocked", () => {
    const game = gameWithBoard([
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 8, 8],
    ]);

    expect(blockTile(game, 8).status).toBe("over");
  });

  it("keep the game going when a different tile is blocked", () => {
    const game = gameWithBoard([
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 8, 8],
    ]);

    expect(blockTile(game, 16).status).toBe("playing");
  });
});

describe("new base questions", () => {
  // the first random number picks the base and the second picks the power
  it("ask about a low power of the new base", () => {
    expect(makeNewBaseQuestion(2, fakeRandom(0, 0))).toEqual({ text: "3^2", answer: 9, tile: 9, newBase: 3 });
    expect(makeNewBaseQuestion(2, fakeRandom(0.99, 0.99))).toEqual({ text: "9^3", answer: 729, tile: 729, newBase: 9 });
  });

  it("pick a base from 2 through 9 that isn't the current one", () => {
    for (let base = 2; base <= 9; base++) {
      for (const pick of [0, 0.5, 0.99]) {
        const { newBase } = makeNewBaseQuestion(base, fakeRandom(pick, 0));

        expect(newBase).not.toBe(base);
        expect(newBase).toBeGreaterThanOrEqual(2);
        expect(newBase).toBeLessThanOrEqual(9);
      }
    }
  });

  it("come after the set number of questions", () => {
    const game = startedGame();

    for (let question = 0; question < QUESTIONS_BEFORE_NEW_BASE; question++) {
      expect(playTurns(game, turnsUntilQuestion()).question).toBe("√16");
      game.answer(4);
    }

    expect(playTurns(game, turnsUntilQuestion()).question).toBe("3^3");
  });

  it("start the question count over on a new game", () => {
    const game = startedGame();
    playTurns(game, turnsUntilQuestion());
    game.answer(4);
    game.newGame();

    for (let question = 0; question < QUESTIONS_BEFORE_NEW_BASE; question++) {
      expect(playTurns(game, turnsUntilQuestion()).question).toBe("√16");
      game.answer(4);
    }
  });
});

describe("changing the base", () => {
  // a game with the new base question waiting for an answer
  function gameWithNewBaseQuestion(): Game {
    const game = gameWithBoard([
      [2, 4, 8, 0],
      [16, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    game.setQuestion(NEW_BASE_QUESTION);
    return game;
  }

  it("changes every tile to the new base and keeps its power", () => {
    const state = gameWithNewBaseQuestion().answer(9);

    expect(state.base).toBe(3);
    expect(state.board).toEqual([
      [3, 9, 27, 0],
      [81, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
  });

  it("changes the base after a wrong answer too", () => {
    expect(gameWithNewBaseQuestion().answer(8).base).toBe(3);
  });

  it("keeps the base after a question that isn't about a new base", () => {
    const game = startedGame();
    game.setQuestion(POWER_QUESTION);

    expect(game.answer(32).base).toBe(2);
  });

  it("clears the old blocked tiles", () => {
    const game = startedGame();
    blockTile(game, 32);
    game.setQuestion(NEW_BASE_QUESTION);

    expect(game.answer(9).blocked).toEqual([]);
  });

  it("only blocks the new tile on a wrong answer", () => {
    const game = startedGame();
    blockTile(game, 32);
    game.setQuestion(NEW_BASE_QUESTION);

    expect(game.answer(8).blocked).toEqual([9]);
  });

  it("starts the question count over", () => {
    const game = startedGame();

    // the last of these questions brings the new base
    for (let question = 0; question <= QUESTIONS_BEFORE_NEW_BASE; question++) {
      playTurns(game, turnsUntilQuestion());
      game.answer(0);
    }

    expect(playTurns(game, turnsUntilQuestion()).question).toBe("√81");
  });

  it("goes back to the first base on a new game", () => {
    const game = gameWithNewBaseQuestion();
    game.answer(9);

    expect(game.newGame().base).toBe(2);
  });
});

describe("a game in base 3", () => {
  // returns a new copy each time, so one test can't change another test's board
  function nineBoard(): Board {
    return [
      [9, 9, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
  }

  it("merges two 9s into a 27 and scores 27", () => {
    const state = gameWithBoard(nineBoard(), fakeRandom(0, 0.5), 3).move("left");

    expect(state.board[0][0]).toBe(27);
    expect(state.score).toBe(27);
  });

  it("makes the new tile a 3 or a 9", () => {
    const three = gameWithBoard(nineBoard(), fakeRandom(0, 0.5), 3).move("left");
    expect(three.board[0]).toEqual([27, 3, 0, 0]);

    const nine = gameWithBoard(nineBoard(), fakeRandom(0, 0.05), 3).move("left");
    expect(nine.board[0]).toEqual([27, 9, 0, 0]);
  });
});

