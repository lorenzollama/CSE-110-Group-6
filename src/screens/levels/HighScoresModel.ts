/**
 * High scores MODEL: each topic's high score, which is cumulative across its levels.
 *
 * It remembers the best winning score on each level, and a topic's total is the sum of
 * those bests. That way replaying a level only raises the total by beating that level's
 * old best (otherwise replaying level 1 over and over would pile up points).
 * Only won levels count: the game controller records a score only when a level is passed.
 * No drawing and no saving here, so it's easy to unit test (the server saves the scores).
 */
import type { Topic } from "../../types";
import { TOPIC_OPTIONS } from "../topicSelect/TopicSelectModel";
import { TOTAL_LEVELS } from "./LevelsModel";

/**
 * Each topic's best score per level, as the server sends it, e.g.
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

  /** Starts from saved scores. Saved entries that aren't a real level and score are dropped. */
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

  /** The topic's high score: the total of the best score on each of its won levels. */
  getTopicTotal(topic: Topic): number {
    let total = 0;
    for (let level = 1; level <= TOTAL_LEVELS; level++) {
      total += this.getBest(topic, level) ?? 0;
    }
    return total;
  }

  /**
   * Records the score of a won level. Returns true if it beat that level's old best (or was
   * its first win), which means the topic total went up and the score should be saved.
   */
  recordWin(topic: Topic, level: number, score: number): boolean {
    if (!isRealLevel(level) || !isRealScore(score)) return false;
    const oldBest = this.getBest(topic, level);
    if (oldBest !== null && score <= oldBest) return false;
    this.best.set(keyFor(topic, level), score);
    return true;
  }
}
