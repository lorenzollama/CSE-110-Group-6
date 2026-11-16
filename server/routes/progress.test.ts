import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { createJsonStore } from "../store/jsonStore.js";

let dir: string;
let file: string;
let app: ReturnType<typeof createApp>;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "progress-test-"));
  file = join(dir, "save.json");
  app = createApp(createJsonStore(file));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const getProgress = async () => (await request(app).get("/api/progress")).body;
const unlock = (body: object) => request(app).post("/api/progress/unlocked").send(body);
const recordScore = (body: object) => request(app).post("/api/progress/scores").send(body);

describe("GET /api/progress", () => {
  // A new player has nothing saved: every topic is at level 1 with no scores.
  it("starts with nothing saved", async () => {
    const res = await request(app).get("/api/progress");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ unlockedLevels: {}, bestScores: {} });
  });

  // Everything is in the save file, so it's still there after the server restarts.
  it("keeps progress and scores after the server restarts", async () => {
    await unlock({ topic: "simplification", level: 5 });
    await recordScore({ topic: "simplification", level: 4, score: 9 });
    const restarted = createApp(createJsonStore(file));
    const res = await request(restarted).get("/api/progress");
    expect(res.body).toEqual({
      unlockedLevels: { simplification: 5 },
      bestScores: { simplification: { "4": 9 } },
    });
  });
});

describe("POST /api/progress/unlocked", () => {
  // Success path: an unlock is saved and loaded back.
  it("saves a topic's unlocked level", async () => {
    const res = await unlock({ topic: "division", level: 3 });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ unlockedLevels: { division: 3 } });
    expect((await getProgress()).unlockedLevels).toEqual({ division: 3 });
  });

  // Edge case: progress never goes backwards, even if an older save arrives late.
  it("keeps the higher unlocked level", async () => {
    await unlock({ topic: "division", level: 4 });
    const res = await unlock({ topic: "division", level: 2 });
    expect(res.body).toEqual({ unlockedLevels: { division: 4 } });
  });

  it("keeps each topic's level separate", async () => {
    await unlock({ topic: "division", level: 4 });
    await unlock({ topic: "multiplication", level: 2 });
    expect((await getProgress()).unlockedLevels).toEqual({ division: 4, multiplication: 2 });
  });

  // Unsuccessful path: anything that isn't a known topic and a real level is rejected.
  it.each([
    { topic: "geometry", level: 2 },
    { topic: "division", level: 0 },
    { topic: "division", level: 1.5 },
    { topic: "division", level: "3" },
    { topic: "division" },
    {},
  ])("rejects %o", async (body) => {
    const res = await unlock(body);
    expect(res.status).toBe(400);
    expect((await getProgress()).unlockedLevels).toEqual({});
  });
});

describe("POST /api/progress/scores", () => {
  // Success path: a won level's score is saved.
  it("saves a level's score", async () => {
    const res = await recordScore({ topic: "division", level: 1, score: 9 });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ bestScores: { division: { "1": 9 } } });
    expect((await getProgress()).bestScores).toEqual({ division: { "1": 9 } });
  });

  // Edge case: replaying a level with a lower score keeps the best one.
  it("keeps the higher score for a level", async () => {
    await recordScore({ topic: "division", level: 1, score: 9 });
    await recordScore({ topic: "division", level: 1, score: 8 });
    await recordScore({ topic: "division", level: 1, score: 10 });
    expect((await getProgress()).bestScores).toEqual({ division: { "1": 10 } });
  });

  it("keeps a separate best for each topic and level", async () => {
    await recordScore({ topic: "division", level: 1, score: 9 });
    await recordScore({ topic: "division", level: 2, score: 8 });
    await recordScore({ topic: "multiplication", level: 1, score: 10 });
    expect((await getProgress()).bestScores).toEqual({
      division: { "1": 9, "2": 8 },
      multiplication: { "1": 10 },
    });
  });

  // Unsuccessful path: anything that isn't a known topic, real level, and real score is rejected.
  it.each([
    { topic: "geometry", level: 1, score: 9 },
    { topic: "division", level: 0, score: 9 },
    { topic: "division", level: 1, score: -1 },
    { topic: "division", level: 1, score: 8.5 },
    { topic: "division", level: 1, score: "9" },
    { topic: "division", level: 1 },
  ])("rejects %o", async (body) => {
    const res = await recordScore(body);
    expect(res.status).toBe(400);
    expect((await getProgress()).bestScores).toEqual({});
  });
});
