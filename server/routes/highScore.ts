import { Router } from "express";
import type { Store } from "../store/jsonStore.js";

export interface HighScoreResponse {
  highScore: number;
}

export interface SubmitScoreResponse {
  highScore: number;
  isNewHighScore: boolean;
}

function isValidScore(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0;
}

export function highScoreRouter(store: Store): Router {
  const router = Router();

  // GET /api/high-score
  router.get("/", async (_req, res) => {
    const { highScore } = await store.read();
    res.json({ highScore } satisfies HighScoreResponse);
  });

  // POST /api/high-score { score }: keeps whichever score is higher.
  router.post("/", async (req, res) => {
    const score: unknown = req.body?.score;
    if (!isValidScore(score)) {
      res.status(400).json({ error: "score must be a whole number >= 0" });
      return;
    }

    const result = await store.update((data): SubmitScoreResponse => {
      const isNewHighScore = score > data.highScore;
      if (isNewHighScore) data.highScore = score;
      return { highScore: data.highScore, isNewHighScore };
    });
    res.json(result);
  });

  return router;
}
