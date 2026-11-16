const PERSONAL_BEST_URL = "/api/minigame1/personal-best";

interface PersonalBestResponse {
  personalBest: number | null;
}

/**
 * Loads the saved Minigame 1 personal best from the backend.
 */
export async function getMinigame1PersonalBest(): Promise<number | null> {
  const response = await fetch(PERSONAL_BEST_URL);

  if (!response.ok) {
    throw new Error(`Could not load Minigame 1 personal best (${response.status})`);
  }

  const { personalBest }: PersonalBestResponse = await response.json();
  return personalBest;
}

/**
 * Submits a finished run and returns the personal best stored by the backend.
 */
export async function submitMinigame1Result(completedRounds: number): Promise<number> {
  const response = await fetch(PERSONAL_BEST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ completedRounds }),
  });

  if (!response.ok) {
    throw new Error(`Could not save Minigame 1 personal best (${response.status})`);
  }

  const { personalBest }: { personalBest: number } = await response.json();
  return personalBest;
}