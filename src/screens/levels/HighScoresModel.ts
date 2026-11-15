/**
 * High scores MODEL: the best score on each level of each topic.
 * Only won levels count: the game controller records a score only when a level is passed.
 * No drawing and no saving here, so it's easy to unit test (levelProgressStorage.ts saves it).
 */
import type { Topic } from "../../types";
import { TOPIC_OPTIONS } from "../topicSelect/TopicSelectModel";
import { TOTAL_LEVELS } from "./LevelsModel";

/**
 * Each topic's best score per level, in the shape that gets saved, e.g.
 * { multiplication: { "1": 9, "3": 10 } }. Level numbers are text because JSON object keys are text.
 */
export type SavedHighScores = Partial<Record<Topic, Record<string, number>>>;

const isRealLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= TOTAL_LEVELS;

// No upper limit on purpose: how many questions a level has may change with difficulty.
const isRealScore = (score: number) => Number.isInteger(score) && score >= 0;

/** One key per topic and level, e.g. "division:3". */
const keyFor = (topic: Topic, level: number) => `${topic}:${level}`;

export class HighScoresModel {
  private best = new Map<string, number>();

  /** Starts from saved high scores. Saved entries that aren't a real level and score are dropped. */
  constructor(saved: SavedHighScores = {}) {
    for (const { topic } of TOPIC_OPTIONS) {
      const levels = saved[topic] ?? {};
      for (const [levelText, score] of Object.entries(levels)) {
        const level = Number(levelText);
        if (isRealLevel(level) && isRealScore(score)) this.best.set(keyFor(topic, level), score);
      }
    }
  }

  /** The best winning score on this level, or null if it hasn't been won yet. */
  getBest(topic: Topic, level: number): number | null {
    return this.best.get(keyFor(topic, level)) ?? null;
  }

  /**
   * Records the score of a won level. Returns true if it's a new best (the first win, or
   * higher than the old best). A tie isn't a new best.
   */
  recordWin(topic: Topic, level: number, score: number): boolean {
    if (!isRealLevel(level) || !isRealScore(score)) return false;
    const oldBest = this.getBest(topic, level);
    if (oldBest !== null && score <= oldBest) return false;
    this.best.set(keyFor(topic, level), score);
    return true;
  }

  /** Every best score, in the shape that gets saved. Topics with no wins are left out. */
  toSaved(): SavedHighScores {
    const saved: SavedHighScores = {};
    for (const { topic } of TOPIC_OPTIONS) {
      const levels: Record<string, number> = {};
      for (let level = 1; level <= TOTAL_LEVELS; level++) {
        const best = this.getBest(topic, level);
        if (best !== null) levels[level] = best;
      }
      if (Object.keys(levels).length > 0) saved[topic] = levels;
    }
    return saved;
  }
}
