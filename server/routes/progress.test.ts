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

const unlock = (body: object) => request(app).post("/api/progress/unlocked").send(body);

describe("/api/progress", () => {
  // A new player has nothing saved: every topic is at level 1.
  it("starts with no unlocked levels saved", async () => {
    const res = await request(app).get("/api/progress");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ unlockedLevels: {} });
  });

  // Success path: an unlock is saved and loaded back.
  it("saves a topic's unlocked level", async () => {
    const res = await unlock({ topic: "division", level: 3 });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ unlockedLevels: { division: 3 } });
    expect((await request(app).get("/api/progress")).body).toEqual({ unlockedLevels: { division: 3 } });
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
    const res = await request(app).get("/api/progress");
    expect(res.body).toEqual({ unlockedLevels: { division: 4, multiplication: 2 } });
  });

  // Progress is in the save file, so it's still there after the server restarts.
  it("keeps progress after the server restarts", async () => {
    await unlock({ topic: "simplification", level: 5 });
    const restarted = createApp(createJsonStore(file));
    const res = await request(restarted).get("/api/progress");
    expect(res.body).toEqual({ unlockedLevels: { simplification: 5 } });
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
    expect((await request(app).get("/api/progress")).body).toEqual({ unlockedLevels: {} });
  });
});
