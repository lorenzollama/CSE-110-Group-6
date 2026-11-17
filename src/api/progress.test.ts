/**
 * Tests for the game's progress API calls. A fake fetch stands in for the server, so these
 * check what the game sends and how it handles the replies (the server has its own tests).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { getProgress, submitLevelScore, submitUnlockedLevel } from "./progress";

/** Makes fetch reply with this JSON body and status, and returns the fake to inspect calls. */
function fakeServer(body: unknown, status = 200) {
  const fetch = vi.fn(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

/** The JSON body the game sent in its first fetch call. */
function sentBody(fetch: ReturnType<typeof fakeServer>): unknown {
  const [, options] = fetch.mock.calls[0] as unknown as [string, RequestInit];
  return JSON.parse(options.body as string);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getProgress", () => {
  it("loads each topic's unlocked level and best scores", async () => {
    fakeServer({
      unlockedLevels: { division: 3, multiplication: 2 },
      bestScores: { division: { "1": 9, "2": 10 } },
    });
    expect(await getProgress()).toEqual({
      unlockedLevels: { division: 3, multiplication: 2 },
      bestScores: { division: { "1": 9, "2": 10 } },
    });
  });

  // Edge case: only known topics with numbers get through to the game.
  it("drops unknown topics and values that aren't numbers", async () => {
    fakeServer({
      unlockedLevels: { division: "3", geometry: 2, simplification: 4 },
      bestScores: { division: { "1": 9, "2": "10" }, multiplication: [9], geometry: { "1": 10 } },
    });
    expect(await getProgress()).toEqual({
      unlockedLevels: { simplification: 4 },
      bestScores: { division: { "1": 9 } },
    });
  });

  it("loads nothing when the reply is missing both parts", async () => {
    fakeServer({});
    expect(await getProgress()).toEqual({ unlockedLevels: {}, bestScores: {} });
  });

  // Unsuccessful path: main.ts catches this and starts everyone at level 1 with no scores.
  it("throws when the server replies with an error", async () => {
    fakeServer({ error: "oops" }, 500);
    await expect(getProgress()).rejects.toThrow("500");
  });
});

describe("submitUnlockedLevel", () => {
  it("sends the topic and level to the server", async () => {
    const fetch = fakeServer({ unlockedLevels: { division: 3 } });
    await submitUnlockedLevel("division", 3);
    expect(fetch).toHaveBeenCalledWith("/api/progress/unlocked", expect.objectContaining({ method: "POST" }));
    expect(sentBody(fetch)).toEqual({ topic: "division", level: 3 });
  });

  // Unsuccessful path: the game catches this and keeps going unsaved.
  it("throws when the server rejects the save", async () => {
    fakeServer({ error: "bad level" }, 400);
    await expect(submitUnlockedLevel("division", 0)).rejects.toThrow("400");
  });
});

describe("submitLevelScore", () => {
  it("sends the topic, level and score to the server", async () => {
    const fetch = fakeServer({ bestScores: { division: { "2": 9 } } });
    await submitLevelScore("division", 2, 9);
    expect(fetch).toHaveBeenCalledWith("/api/progress/scores", expect.objectContaining({ method: "POST" }));
    expect(sentBody(fetch)).toEqual({ topic: "division", level: 2, score: 9 });
  });

  // Unsuccessful path: the game catches this and keeps going unsaved.
  it("throws when the server rejects the score", async () => {
    fakeServer({ error: "bad score" }, 400);
    await expect(submitLevelScore("division", 2, -1)).rejects.toThrow("400");
  });
});
