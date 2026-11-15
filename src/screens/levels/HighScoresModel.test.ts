import { describe, expect, it } from "vitest";
import { HighScoresModel } from "./HighScoresModel";
import { TOTAL_LEVELS } from "./LevelsModel";

describe("HighScoresModel", () => {
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

  // Edge case: a tie or a lower score keeps the old best, and isn't a "New best!".
  it("keeps the best when a score ties or is lower", () => {
    const scores = new HighScoresModel();
    scores.recordWin("multiplication", 1, 9);
    expect(scores.recordWin("multiplication", 1, 9)).toBe(false);
    expect(scores.recordWin("multiplication", 1, 8)).toBe(false);
    expect(scores.getBest("multiplication", 1)).toBe(9);
  });

  // Each topic and each level has its own best.
  it("keeps a separate best for each topic and level", () => {
    const scores = new HighScoresModel();
    scores.recordWin("division", 2, 9);
    expect(scores.getBest("division", 2)).toBe(9);
    expect(scores.getBest("division", 1)).toBe(null);
    expect(scores.getBest("multiplication", 2)).toBe(null);
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

  // What gets saved can be loaded back into a new model (like after a page refresh).
  it("starts from its own saved scores", () => {
    const scores = new HighScoresModel();
    scores.recordWin("multiplication", 1, 9);
    scores.recordWin("simplification", 4, 10);

    const reloaded = new HighScoresModel(scores.toSaved());
    expect(reloaded.getBest("multiplication", 1)).toBe(9);
    expect(reloaded.getBest("simplification", 4)).toBe(10);
    expect(reloaded.getBest("division", 1)).toBe(null);
  });

  it("saves only the levels that have been won", () => {
    const scores = new HighScoresModel();
    scores.recordWin("division", 3, 8);
    expect(scores.toSaved()).toEqual({ division: { "3": 8 } });
  });

  // Edge case: bad saved data is dropped instead of showing a wrong best.
  it("drops saved scores that aren't a real level and score", () => {
    const scores = new HighScoresModel({
      multiplication: { "1": 9, "0": 9, "99": 9, "abc": 9, "2": -3, "3": 7.5 },
    });
    expect(scores.getBest("multiplication", 1)).toBe(9);
    expect(scores.toSaved()).toEqual({ multiplication: { "1": 9 } });
  });
});
