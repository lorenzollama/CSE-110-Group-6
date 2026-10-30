// Calls the backend high score routes (server/routes/highScore.ts).
// vite.config.ts proxies /api to the server, so start it with `npm run server`.

export interface SubmitScoreResponse {
  highScore: number;
  isNewHighScore: boolean;
}

export async function getHighScore(): Promise<number> {
  const res = await fetch('/api/high-score');
  if (!res.ok) throw new Error(`GET /api/high-score failed: ${res.status}`);
  const body: { highScore: number } = await res.json();
  return body.highScore;
}

/** Saves the score if it beats the current high score. */
export async function submitHighScore(score: number): Promise<SubmitScoreResponse> {
  const res = await fetch('/api/high-score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ score }),
  });
  if (!res.ok) throw new Error(`POST /api/high-score failed: ${res.status}`);
  return res.json();
}
