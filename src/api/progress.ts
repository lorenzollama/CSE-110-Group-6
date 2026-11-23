// Calls the backend progress routes (server/routes/progress.ts), which save to server/data/save.json.
// vite.config.ts proxies /api to the server, so start it with `npm run server`.
import type { SavedHighScores } from "../screens/levels/HighScoresModel";
import type { SavedLevelProgress } from "../screens/levels/LevelsModel";
import { TOPIC_OPTIONS } from "../screens/topicSelect/TopicSelectModel";
import type { Topic } from "../types";

export interface SavedProgress {
  unlockedLevels: SavedLevelProgress;
  bestScores: SavedHighScores;
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Loads every topic's unlocked level and best scores. Throws if the server can't be reached. */
export async function getProgress(): Promise<SavedProgress> {
  const res = await fetch("/api/progress");
  if (!res.ok) throw new Error(`GET /api/progress failed: ${res.status}`);
  const body: { unlockedLevels?: unknown; bestScores?: unknown } = await res.json();
  const unlocked = isPlainObject(body.unlockedLevels) ? body.unlockedLevels : {};
  const scores = isPlainObject(body.bestScores) ? body.bestScores : {};

  // Keep only known topics with numbers. LevelsModel and HighScoresModel then check
  // that each number is a real level or score.
  const progress: SavedProgress = { unlockedLevels: {}, bestScores: {} };
  for (const { topic } of TOPIC_OPTIONS) {
    const level = unlocked[topic];
    if (typeof level === "number") progress.unlockedLevels[topic] = level;

    const levels = scores[topic];
    if (!isPlainObject(levels)) continue;
    const kept: Record<string, number> = {};
    for (const [levelText, score] of Object.entries(levels)) {
      if (typeof score === "number") kept[levelText] = score;
    }
    progress.bestScores[topic] = kept;
  }
  return progress;
}

async function post(path: string, body: object): Promise<void> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
}

/** Saves a topic's highest unlocked level. The server keeps whichever is higher. */
export function submitUnlockedLevel(topic: Topic, level: number): Promise<void> {
  return post("/api/progress/unlocked", { topic, level });
}

/** Saves a won level's score. The server keeps whichever score is higher for that level. */
export function submitLevelScore(topic: Topic, level: number, score: number): Promise<void> {
  return post("/api/progress/scores", { topic, level, score });
}
