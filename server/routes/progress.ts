import { Router } from "express";
import type { Store } from "../store/jsonStore.js";
import { TOPICS, type SaveData } from "../types.js";

export interface ProgressResponse {
  /** Each topic's highest unlocked level. A missing topic is at level 1. */
  unlockedLevels: Record<string, number>;
}

type KnownTopic = (typeof TOPICS)[number];

function isKnownTopic(value: unknown): value is KnownTopic {
  return typeof value === "string" && (TOPICS as readonly string[]).includes(value);
}

function isValidLevel(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 1;
}

/** The saved unlocked levels, keeping only known topics with a valid level (in case save.json was edited by hand). */
function unlockedLevelsOf(data: SaveData): Record<string, number> {
  const unlocked: Record<string, number> = {};
  for (const topic of TOPICS) {
    const level: unknown = data.unlockedLevels?.[topic];
    if (isValidLevel(level)) unlocked[topic] = level;
  }
  return unlocked;
}

export function progressRouter(store: Store): Router {
  const router = Router();

  // GET /api/progress
  router.get("/", async (_req, res) => {
    const data = await store.read();
    res.json({ unlockedLevels: unlockedLevelsOf(data) } satisfies ProgressResponse);
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

    const result = await store.update((data): ProgressResponse => {
      const unlocked = unlockedLevelsOf(data);
      unlocked[topic] = Math.max(unlocked[topic] ?? 1, level);
      data.unlockedLevels = unlocked;
      return { unlockedLevels: unlocked };
    });
    res.json(result);
  });

  return router;
}
