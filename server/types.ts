/** Everything stored in server/data/save.json. */
export interface SaveData {
  version: 1;
  highScore: number;
  /** Each topic's highest unlocked level, e.g. { division: 3 }. A missing topic is at level 1. */
  unlockedLevels: Record<string, number>;
  /**
   * Each topic's best winning score per level, e.g. { division: { "1": 9, "2": 10 } }.
   * A topic's high score is the total of these, so replaying a level only raises it
   * by beating that level's best.
   */
  bestScores: Record<string, Record<string, number>>;
}

/** The main game's topics. Must match `Topic` in src/types.ts. */
export const TOPICS = ["multiplication", "division", "simplification"] as const;

export function defaultSaveData(): SaveData {
  return { version: 1, highScore: 0, unlockedLevels: {}, bestScores: {} };
}
