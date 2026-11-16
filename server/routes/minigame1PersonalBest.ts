import { Router } from "express";
import type { Store } from "../store/jsonStore.js";

/** Reads and updates Alien Signal Memory's personal best. */
export function minigame1PersonalBestRouter(store: Store): Router {
  const router = Router();

  router.get("/", async (_req, res) => {
    const { minigame1PersonalBest } = await store.read();
    res.json({ personalBest: minigame1PersonalBest });
  });

  router.post("/", async (req, res) => {
    const completedRounds: unknown = req.body?.completedRounds;

    if (
      typeof completedRounds !== "number" ||
      !Number.isSafeInteger(completedRounds) ||
      completedRounds < 0
    ) {
      res.status(400).json({ error: "completedRounds must be a whole number >= 0" });
      return;
    }

    const personalBest = await store.update((data) => {
      if (
        data.minigame1PersonalBest === null ||
        completedRounds > data.minigame1PersonalBest
      ) {
        data.minigame1PersonalBest = completedRounds;
      }

      return data.minigame1PersonalBest;
    });

    res.json({ personalBest });
  });

  return router;
}