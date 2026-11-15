// Calls the backend progress routes (server/routes/progress.ts), which save to server/data/save.json.
// vite.config.ts proxies /api to the server, so start it with `npm run server`.
import type { SavedLevelProgress } from "../screens/levels/LevelsModel";
import { TOPIC_OPTIONS } from "../screens/topicSelect/TopicSelectModel";
import type { Topic } from "../types";

/** Loads every topic's highest unlocked level. Throws if the server can't be reached. */
export async function getLevelProgress(): Promise<SavedLevelProgress> {
  const res = await fetch("/api/progress");
  if (!res.ok) throw new Error(`GET /api/progress failed: ${res.status}`);
  const body: { unlockedLevels?: Record<string, unknown> } = await res.json();

  // Keep only known topics with a number. LevelsModel then checks the number is a real level.
  const progress: SavedLevelProgress = {};
  for (const { topic } of TOPIC_OPTIONS) {
    const level = body.unlockedLevels?.[topic];
    if (typeof level === "number") progress[topic] = level;
  }
  return progress;
}

/** Saves a topic's highest unlocked level. The server keeps whichever is higher. */
export async function submitUnlockedLevel(topic: Topic, level: number): Promise<void> {
  const res = await fetch("/api/progress/unlocked", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, level }),
  });
  if (!res.ok) throw new Error(`POST /api/progress/unlocked failed: ${res.status}`);
}
