import { describe, expect, it } from "vitest";
import { reverseRows, slideLine, transpose } from "./model.ts";
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
