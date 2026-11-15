/**
 * Tests for saving and loading level progress. They use a fake in-memory storage
 * instead of the browser's localStorage (tests don't run in a browser), which also
 * makes it easy to fake broken or blocked storage.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { createLevelsByTopic } from "./LevelsModel";
import {
  loadLevelProgress,
  saveLevelProgress,
  STORAGE_KEY,
  type ProgressStorage,
} from "./levelProgressStorage";

/** A stand-in for localStorage that keeps items in a Map. */
function fakeStorage(items: Record<string, string> = {}): ProgressStorage {
  const map = new Map(Object.entries(items));
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
  };
}

/** Storage that fails on every use, like a blocked or full localStorage. */
const brokenStorage: ProgressStorage = {
  getItem: () => {
    throw new Error("storage is blocked");
  },
  setItem: () => {
    throw new Error("storage is full");
  },
};

/** Fake storage that already holds this exact saved text. */
const storageWith = (text: string) => fakeStorage({ [STORAGE_KEY]: text });

afterEach(() => {
  vi.restoreAllMocks();
});

describe("saving and loading level progress", () => {
  // Success path: what was unlocked before a refresh is unlocked after it.
  it("loads the progress that was saved", () => {
    const storage = fakeStorage();
    const levels = createLevelsByTopic();
    levels.division.completeLevel(1);
    levels.division.completeLevel(2);
    saveLevelProgress(levels, storage);

    const reloaded = createLevelsByTopic(loadLevelProgress(storage));
    expect(reloaded.division.getUnlockedLevels()).toBe(3);
    expect(reloaded.multiplication.getUnlockedLevels()).toBe(1);
    expect(reloaded.simplification.getUnlockedLevels()).toBe(1);
  });

  // A new player has nothing saved yet.
  it("loads no progress when nothing was saved", () => {
    expect(loadLevelProgress(fakeStorage())).toEqual({});
  });

  // Edge case: corrupted save data.
  it("loads no progress when the saved text isn't JSON", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(loadLevelProgress(storageWith("{ not json"))).toEqual({});
  });

  // Edge case: valid JSON, but not the shape we save.
  it("loads no progress when the saved data isn't an object of levels", () => {
    expect(loadLevelProgress(storageWith("[3, 4]"))).toEqual({});
    expect(loadLevelProgress(storageWith("null"))).toEqual({});
    expect(loadLevelProgress(storageWith('"level 3"'))).toEqual({});
  });

  // Edge case: keep the good topics, drop values that aren't numbers and unknown topics.
  it("keeps only known topics saved as numbers", () => {
    const text = JSON.stringify({ multiplication: 4, division: "5", geometry: 2 });
    expect(loadLevelProgress(storageWith(text))).toEqual({ multiplication: 4 });
  });

  // Edge case: a number that isn't a real level still loads, but LevelsModel starts it at 1.
  it("starts at level 1 when a saved level isn't a real level", () => {
    const text = JSON.stringify({ multiplication: 99, division: 0 });
    const levels = createLevelsByTopic(loadLevelProgress(storageWith(text)));
    expect(levels.multiplication.getUnlockedLevels()).toBe(1);
    expect(levels.division.getUnlockedLevels()).toBe(1);
  });

  // Unsuccessful path: blocked or full storage must not crash the game.
  it("keeps the game going when storage is blocked or full", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(loadLevelProgress(brokenStorage)).toEqual({});
    expect(() => saveLevelProgress(createLevelsByTopic(), brokenStorage)).not.toThrow();
  });

  // Unsuccessful path: no storage at all (e.g. outside a browser).
  it("does nothing when there is no storage", () => {
    expect(loadLevelProgress(null)).toEqual({});
    expect(() => saveLevelProgress(createLevelsByTopic(), null)).not.toThrow();
  });
});
