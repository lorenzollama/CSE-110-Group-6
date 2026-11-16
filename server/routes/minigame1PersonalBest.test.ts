import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import request from "supertest";
import { afterEach, beforeEach, describe, it } from "vitest";
import { createApp } from "../app.js";
import { createJsonStore } from "../store/jsonStore.js";

describe("Minigame 1 personal best API", () => {
  const endpoint = "/api/minigame1/personal-best";
  let directory: string;
  let savePath: string;
  let app: ReturnType<typeof createApp>;

  // Give each test its own JSON save file
  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), "minigame1-personal-best-"));
    savePath = join(directory, "save.json");
    app = createApp(createJsonStore(savePath));
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  // Test 1: An older save defaults to no personal best
  it("reads an older save without a Minigame 1 record", async () => {
    await writeFile(savePath, JSON.stringify({ version: 1, highScore: 12 }));

    await request(app).get(endpoint).expect(200, { personalBest: null });
  });

  // Test 2: Zero completed rounds is a valid first record
  it("saves and reloads a first result of zero", async () => {
    await request(app)
      .post(endpoint)
      .send({ completedRounds: 0 })
      .expect(200, { personalBest: 0 });

    const restartedApp = createApp(createJsonStore(savePath));
    await request(restartedApp).get(endpoint).expect(200, { personalBest: 0 });
  });

  // Test 3: A higher result replaces the record while lower and tied results keep it
  it("keeps the highest result", async () => {
    for (const [completedRounds, personalBest] of [[2, 2], [5, 5], [3, 5], [5, 5]]) {
      await request(app)
        .post(endpoint)
        .send({ completedRounds })
        .expect(200, { personalBest });
    }

    await request(app).get(endpoint).expect(200, { personalBest: 5 });
  });

  // Test 4: Saving a Minigame 1 record preserves the main-game high score
  it("keeps the main-game high score separate", async () => {
    await writeFile(savePath, JSON.stringify({ version: 1, highScore: 12 }));

    await request(app)
      .post(endpoint)
      .send({ completedRounds: 4 })
      .expect(200, { personalBest: 4 });

    await request(app).get("/api/high-score").expect(200, { highScore: 12 });
  });

  // Tests 5–7: Invalid round counts are rejected
  it.each([-1, 1.5, "4"])("rejects a round count of %j", async (completedRounds) => {
    await request(app).post(endpoint).send({ completedRounds }).expect(400);
    await request(app).get(endpoint).expect(200, { personalBest: null });
  });
});