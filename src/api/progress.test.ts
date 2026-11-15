/**
 * Tests for the game's progress API calls. A fake fetch stands in for the server, so these
 * check what the game sends and how it handles the replies (the server has its own tests).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { getLevelProgress, submitUnlockedLevel } from "./progress";

/** Makes fetch reply with this JSON body and status, and returns the fake to inspect calls. */
function fakeServer(body: unknown, status = 200) {
  const fetch = vi.fn(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getLevelProgress", () => {
  it("loads each topic's unlocked level", async () => {
    fakeServer({ unlockedLevels: { division: 3, multiplication: 2 } });
    expect(await getLevelProgress()).toEqual({ division: 3, multiplication: 2 });
  });

  // Edge case: only known topics with a number get through to the game.
  it("drops unknown topics and levels that aren't numbers", async () => {
    fakeServer({ unlockedLevels: { division: "3", geometry: 2, simplification: 4 } });
    expect(await getLevelProgress()).toEqual({ simplification: 4 });
  });

  it("loads no progress when the reply has no unlocked levels", async () => {
    fakeServer({});
    expect(await getLevelProgress()).toEqual({});
  });

  // Unsuccessful path: main.ts catches this and starts everyone at level 1.
  it("throws when the server replies with an error", async () => {
    fakeServer({ error: "oops" }, 500);
    await expect(getLevelProgress()).rejects.toThrow("500");
  });
});

describe("submitUnlockedLevel", () => {
  it("sends the topic and level to the server", async () => {
    const fetch = fakeServer({ unlockedLevels: { division: 3 } });
    await submitUnlockedLevel("division", 3);

    expect(fetch).toHaveBeenCalledWith("/api/progress/unlocked", expect.objectContaining({ method: "POST" }));
    const [, options] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(options.body as string)).toEqual({ topic: "division", level: 3 });
  });

  // Unsuccessful path: the game catches this and keeps going unsaved.
  it("throws when the server rejects the save", async () => {
    fakeServer({ error: "bad level" }, 400);
    await expect(submitUnlockedLevel("division", 0)).rejects.toThrow("400");
  });
});
