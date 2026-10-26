import assert from "node:assert/strict";
import { slideLine } from "../src/minigame2/model.ts";

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
  assert.deepEqual(slideLine(input), { line: expected, gained });
}

console.log("slideLine ok");
