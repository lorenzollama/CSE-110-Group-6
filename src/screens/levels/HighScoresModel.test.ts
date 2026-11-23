import { describe, expect, it } from "vitest";
import { HighScoresModel } from "./HighScoresModel";
import { TOTAL_LEVELS } from "./LevelsModel";

describe("HighScoresModel: best score per level", () => {
  // A new player hasn't won anything yet.
  it("has no best score before a level is won", () => {
    expect(new HighScoresModel().getBest("multiplication", 1)).toBe(null);
  });

  // Success path: the first win is always a new best.
  it("records the first win as a new best", () => {
    const scores = new HighScoresModel();
    expect(scores.recordWin("multiplication", 1, 8)).toBe(true);
    expect(scores.getBest("multiplication", 1)).toBe(8);
  });

  it("replaces the best with a higher score", () => {
    const scores = new HighScoresModel();
    scores.recordWin("multiplication", 1, 8);
    expect(scores.recordWin("multiplication", 1, 10)).toBe(true);
    expect(scores.getBest("multiplication", 1)).toBe(10);
  });

  // Edge case: a tie or a lower score keeps the old best.
  it("keeps the best when a score ties or is lower", () => {
    const scores = new HighScoresModel();
    scores.recordWin("multiplication", 1, 9);
    expect(scores.recordWin("multiplication", 1, 9)).toBe(false);
    expect(scores.recordWin("multiplication", 1, 8)).toBe(false);
    expect(scores.getBest("multiplication", 1)).toBe(9);
  });

  // Unsuccessful path: a level or score that can't happen isn't recorded.
  it("ignores wins on levels that don't exist or with impossible scores", () => {
    const scores = new HighScoresModel();
    expect(scores.recordWin("division", 0, 9)).toBe(false);
    expect(scores.recordWin("division", TOTAL_LEVELS + 1, 9)).toBe(false);
    expect(scores.recordWin("division", 1, -1)).toBe(false);
    expect(scores.recordWin("division", 1, 8.5)).toBe(false);
    expect(scores.getBest("division", 1)).toBe(null);
  });
});

describe("HighScoresModel: topic total", () => {
  it("starts every topic at 0", () => {
    expect(new HighScoresModel().getTopicTotal("multiplication")).toBe(0);
  });

  // Success path: the total adds up the best score of every won level.
  it("adds up the best score of each won level", () => {
    const scores = new HighScoresModel();
    scores.recordWin("division", 1, 9);
    scores.recordWin("division", 2, 10);
    scores.recordWin("division", 3, 8);
    expect(scores.getTopicTotal("division")).toBe(27);
  });

  // Edge case: replaying a level can't pile up points, it only counts its best once.
  it("counts each level once, even when it's replayed", () => {
    const scores = new HighScoresModel();
    scores.recordWin("division", 1, 9);
    scores.recordWin("division", 1, 8);
    scores.recordWin("division", 1, 9);
    expect(scores.getTopicTotal("division")).toBe(9);
    scores.recordWin("division", 1, 10); // beating the old best raises the total by the difference
    expect(scores.getTopicTotal("division")).toBe(10);
  });

  it("keeps each topic's total separate", () => {
    const scores = new HighScoresModel();
    scores.recordWin("division", 1, 9);
    scores.recordWin("multiplication", 1, 10);
    expect(scores.getTopicTotal("division")).toBe(9);
    expect(scores.getTopicTotal("multiplication")).toBe(10);
    expect(scores.getTopicTotal("simplification")).toBe(0);
  });
});

describe("HighScoresModel: saved scores", () => {
  // What the server sends back after a refresh.
  it("starts from saved scores", () => {
    const scores = new HighScoresModel({ multiplication: { "1": 9, "2": 10 }, simplification: { "4": 8 } });
    expect(scores.getBest("multiplication", 2)).toBe(10);
    expect(scores.getTopicTotal("multiplication")).toBe(19);
    expect(scores.getTopicTotal("simplification")).toBe(8);
    expect(scores.getTopicTotal("division")).toBe(0);
  });

  // Edge case: bad saved data is dropped instead of showing a wrong total.
  it("drops saved scores that aren't a real level and score", () => {
    const scores = new HighScoresModel({
      multiplication: { "1": 9, "0": 9, "99": 9, "abc": 9, "2": -3, "3": 7.5 },
    });
    expect(scores.getBest("multiplication", 1)).toBe(9);
    expect(scores.getTopicTotal("multiplication")).toBe(9);
  });
});
