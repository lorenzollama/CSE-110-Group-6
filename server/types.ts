/** Everything stored in server/data/save.json. */
export interface SaveData {
  version: 1;
  highScore: number;
}

export function defaultSaveData(): SaveData {
  return { version: 1, highScore: 0 };
}
