/**
 * Saves each topic's level progress and high scores in the browser (localStorage), so
 * they're still there after the page is refreshed or closed.
 *
 * Saved data can't be trusted: it can be missing, cleared, edited by hand, or blocked
 * (some private windows throw on any localStorage use). Every problem falls back to
 * "nothing saved" (level 1, no high scores) instead of crashing the game.
 */
import { TOPIC_OPTIONS } from "../topicSelect/TopicSelectModel";
import type { HighScoresModel, SavedHighScores } from "./HighScoresModel";
import type { LevelsByTopic, SavedLevelProgress } from "./LevelsModel";

// localStorage is shared by every app on the same address (like localhost:5173), so the keys are specific.
export const LEVEL_PROGRESS_KEY = "cse110-group6.levelProgress";
export const HIGH_SCORES_KEY = "cse110-group6.levelHighScores";

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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Reads one saved item. Returns null if nothing is saved, it can't be read, or it isn't
 * a { ... } object. `label` is only for the warning message.
 */
function readObject(storage: ProgressStorage | null, key: string, label: string): Record<string, unknown> | null {
  if (!storage) return null;
  let saved: unknown;
  try {
    const text = storage.getItem(key);
    if (text === null) return null; // nothing saved yet: a new player
    saved = JSON.parse(text);
  } catch (err) {
    console.warn(`Could not load ${label}`, err);
    return null;
  }
  return isPlainObject(saved) ? saved : null;
}

/** Saves one item. If saving fails (storage full or blocked), the game keeps going unsaved. */
function writeObject(storage: ProgressStorage | null, key: string, label: string, value: object): void {
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Could not save ${label}`, err);
  }
}

// ------------------------------------------------------------------ level progress

/** Reads the saved progress. Returns {} (everyone at level 1) if there is none or it's unreadable. */
export function loadLevelProgress(storage: ProgressStorage | null = browserStorage()): SavedLevelProgress {
  const saved = readObject(storage, LEVEL_PROGRESS_KEY, "level progress");
  if (!saved) return {};

  // Keep only known topics with a number. LevelsModel then checks the number is a real level.
  const progress: SavedLevelProgress = {};
  for (const { topic } of TOPIC_OPTIONS) {
    const level = saved[topic];
    if (typeof level === "number") progress[topic] = level;
  }
  return progress;
}

/** Saves every topic's highest unlocked level. */
export function saveLevelProgress(
  levelsByTopic: LevelsByTopic,
  storage: ProgressStorage | null = browserStorage(),
): void {
  const progress: SavedLevelProgress = {};
  for (const { topic } of TOPIC_OPTIONS) {
    progress[topic] = levelsByTopic[topic].getUnlockedLevels();
  }
  writeObject(storage, LEVEL_PROGRESS_KEY, "level progress", progress);
}

// ------------------------------------------------------------------ high scores

/** Reads the saved high scores. Returns {} (no high scores) if there are none or they're unreadable. */
export function loadHighScores(storage: ProgressStorage | null = browserStorage()): SavedHighScores {
  const saved = readObject(storage, HIGH_SCORES_KEY, "high scores");
  if (!saved) return {};

  // Keep only known topics, and in each one only the levels saved with a number.
  // HighScoresModel then checks each is a real level and a real score.
  const highScores: SavedHighScores = {};
  for (const { topic } of TOPIC_OPTIONS) {
    const levels = saved[topic];
    if (!isPlainObject(levels)) continue;
    const kept: Record<string, number> = {};
    for (const [level, score] of Object.entries(levels)) {
      if (typeof score === "number") kept[level] = score;
    }
    highScores[topic] = kept;
  }
  return highScores;
}

/** Saves every topic's best score per level. */
export function saveHighScores(
  highScores: HighScoresModel,
  storage: ProgressStorage | null = browserStorage(),
): void {
  writeObject(storage, HIGH_SCORES_KEY, "high scores", highScores.toSaved());
}
