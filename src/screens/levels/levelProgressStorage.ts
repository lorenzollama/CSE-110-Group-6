/**
 * Saves each topic's level progress in the browser (localStorage), so unlocked levels
 * are still there after the page is refreshed or closed.
 *
 * Saved data can't be trusted: it can be missing, cleared, edited by hand, or blocked
 * (some private windows throw on any localStorage use). Every problem falls back to
 * "no saved progress" (everyone starts at level 1) instead of crashing the game.
 */
import { TOPIC_OPTIONS } from "../topicSelect/TopicSelectModel";
import type { LevelsByTopic, SavedLevelProgress } from "./LevelsModel";

/** localStorage is shared by every app on the same address (like localhost:5173), so the key is specific. */
export const STORAGE_KEY = "cse110-group6.levelProgress";

/** The two localStorage methods used here. Tests pass in a fake with the same methods. */
export type ProgressStorage = Pick<Storage, "getItem" | "setItem">;

/** The browser's localStorage, or null where there is none or the browser blocks it. */
function browserStorage(): ProgressStorage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null; // just reading window.localStorage throws when storage is blocked
  }
}

/** Reads the saved progress. Returns {} (everyone at level 1) if there is none or it's unreadable. */
export function loadLevelProgress(storage: ProgressStorage | null = browserStorage()): SavedLevelProgress {
  if (!storage) return {};

  let saved: unknown;
  try {
    const text = storage.getItem(STORAGE_KEY);
    if (text === null) return {}; // nothing saved yet: a new player
    saved = JSON.parse(text);
  } catch (err) {
    console.warn("Could not load level progress", err);
    return {};
  }
  if (typeof saved !== "object" || saved === null || Array.isArray(saved)) return {};

  // Keep only known topics with a number. LevelsModel then checks the number is a real level.
  const progress: SavedLevelProgress = {};
  for (const { topic } of TOPIC_OPTIONS) {
    const level = (saved as Record<string, unknown>)[topic];
    if (typeof level === "number") progress[topic] = level;
  }
  return progress;
}

/** Saves every topic's highest unlocked level. If saving fails, the game keeps going unsaved. */
export function saveLevelProgress(
  levelsByTopic: LevelsByTopic,
  storage: ProgressStorage | null = browserStorage(),
): void {
  if (!storage) return;

  const progress: SavedLevelProgress = {};
  for (const { topic } of TOPIC_OPTIONS) {
    progress[topic] = levelsByTopic[topic].getUnlockedLevels();
  }
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (err) {
    console.warn("Could not save level progress", err); // e.g. storage full or blocked
  }
}
