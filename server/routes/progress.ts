import { Router } from "express";
import type { Store } from "../store/jsonStore.js";
import { TOPICS, type SaveData } from "../types.js";

export interface ProgressResponse {
  /** Each topic's highest unlocked level. A missing topic is at level 1. */
  unlockedLevels: Record<string, number>;
  /** Each topic's best winning score per level, e.g. { division: { "1": 9 } }. */
  bestScores: Record<string, Record<string, number>>;
}

type KnownTopic = (typeof TOPICS)[number];

function isKnownTopic(value: unknown): value is KnownTopic {
  return typeof value === "string" && (TOPICS as readonly string[]).includes(value);
}

function isValidLevel(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 1;
}

function isValidScore(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// The two helpers below read the saved data but keep only known topics with valid
// levels and scores, in case save.json was edited by hand.

function unlockedLevelsOf(data: SaveData): Record<string, number> {
  const unlocked: Record<string, number> = {};
  for (const topic of TOPICS) {
    const level: unknown = data.unlockedLevels?.[topic];
    if (isValidLevel(level)) unlocked[topic] = level;
  }
  return unlocked;
}

function bestScoresOf(data: SaveData): Record<string, Record<string, number>> {
  const best: Record<string, Record<string, number>> = {};
  for (const topic of TOPICS) {
    const levels: unknown = data.bestScores?.[topic];
    if (!isPlainObject(levels)) continue;
    const kept: Record<string, number> = {};
    for (const [level, score] of Object.entries(levels)) {
      if (isValidLevel(Number(level)) && isValidScore(score)) kept[level] = score;
    }
    if (Object.keys(kept).length > 0) best[topic] = kept;
  }
  return best;
}

export function progressRouter(store: Store): Router {
  const router = Router();

  // GET /api/progress
  router.get("/", async (_req, res) => {
    const data = await store.read();
    res.json({ unlockedLevels: unlockedLevelsOf(data), bestScores: bestScoresOf(data) } satisfies ProgressResponse);
  });

  // POST /api/progress/unlocked { topic, level }: keeps whichever unlocked level is higher,
  // so progress never goes backwards.
  router.post("/unlocked", async (req, res) => {
    const topic: unknown = req.body?.topic;
    const level: unknown = req.body?.level;
    if (!isKnownTopic(topic) || !isValidLevel(level)) {
      res.status(400).json({ error: `topic must be one of ${TOPICS.join(", ")} and level a whole number >= 1` });
      return;
    }

    const result = await store.update((data) => {
      const unlocked = unlockedLevelsOf(data);
      unlocked[topic] = Math.max(unlocked[topic] ?? 1, level);
      data.unlockedLevels = unlocked;
      return { unlockedLevels: unlocked };
    });
    res.json(result);
  });

  // POST /api/progress/scores { topic, level, score }: records a won level's score,
  // keeping whichever score is higher for that level.
  router.post("/scores", async (req, res) => {
    const topic: unknown = req.body?.topic;
    const level: unknown = req.body?.level;
    const score: unknown = req.body?.score;
    if (!isKnownTopic(topic) || !isValidLevel(level) || !isValidScore(score)) {
      res.status(400).json({
        error: `topic must be one of ${TOPICS.join(", ")}, level a whole number >= 1, and score a whole number >= 0`,
      });
      return;
    }

    const result = await store.update((data) => {
      const best = bestScoresOf(data);
      const levels = best[topic] ?? {};
      levels[level] = Math.max(levels[level] ?? 0, score);
      best[topic] = levels;
      data.bestScores = best;
      return { bestScores: best };
    });
    res.json(result);
  });

  return router;
}
