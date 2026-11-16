import express, { type Express } from "express";
import { highScoreRouter } from "./routes/highScore.js";
import type { Store } from "./store/jsonStore.js";

/** Builds the API. Tests call this with a temp-file store instead of starting a server. */
export function createApp(store: Store): Express {
  const app = express();
  app.use(express.json());

  app.use("/api/high-score", highScoreRouter(store));

  return app;
}
