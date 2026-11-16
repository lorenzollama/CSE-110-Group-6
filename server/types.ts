/** Everything stored in server/data/save.json. */
export interface SaveData {
  version: 1;
  highScore: number;
  minigame1PersonalBest: number | null;
  /** Each topic's highest unlocked level, e.g. { division: 3 }. A missing topic is at level 1. */
  unlockedLevels: Record<string, number>;
}

/** The main game's topics. Must match `Topic` in src/types.ts. */
export const TOPICS = ["multiplication", "division", "simplification"] as const;

export function defaultSaveData(): SaveData {
  return { version: 1, highScore: 0, minigame1PersonalBest: null, unlockedLevels: {} };
}
