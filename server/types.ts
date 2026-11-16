/** Everything stored in server/data/save.json. */
export interface SaveData {
  version: 1;
  highScore: number;
  minigame1PersonalBest: number | null;
}

export function defaultSaveData(): SaveData {
  return { version: 1, highScore: 0, minigame1PersonalBest: null };
}
