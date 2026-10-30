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
  dir = await mkdtemp(join(tmpdir(), "high-score-test-"));
  file = join(dir, "save.json");
  app = createApp(createJsonStore(file));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("/api/high-score", () => {
  it("starts at 0", async () => {
    const res = await request(app).get("/api/high-score");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ highScore: 0 });
  });

  it("replaces the high score with a higher one", async () => {
    const res = await request(app).post("/api/high-score").send({ score: 7 });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ highScore: 7, isNewHighScore: true });
  });

  it("keeps the old high score when the new one is lower", async () => {
    await request(app).post("/api/high-score").send({ score: 7 });
    const res = await request(app).post("/api/high-score").send({ score: 3 });
    expect(res.body).toEqual({ highScore: 7, isNewHighScore: false });
  });

  it.each([{ score: "abc" }, { score: -5 }, { score: 3.7 }, {}])("rejects %j", async (body) => {
    const res = await request(app).post("/api/high-score").send(body);
    expect(res.status).toBe(400);
  });

  it("resets to 0", async () => {
    await request(app).post("/api/high-score").send({ score: 7 });
    await request(app).delete("/api/high-score");
    const res = await request(app).get("/api/high-score");
    expect(res.body).toEqual({ highScore: 0 });
  });

  it("keeps the high score after the server restarts", async () => {
    await request(app).post("/api/high-score").send({ score: 9 });
    const restarted = createApp(createJsonStore(file));
    const res = await request(restarted).get("/api/high-score");
    expect(res.body).toEqual({ highScore: 9 });
  });
});
