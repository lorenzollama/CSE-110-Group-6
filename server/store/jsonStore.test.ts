import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultSaveData } from "../types.js";
import { createJsonStore } from "./jsonStore.js";

let dir: string;
let file: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "store-test-"));
  file = join(dir, "data", "save.json");
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("createJsonStore", () => {
  it("returns the defaults when the file doesn't exist", async () => {
    expect(await createJsonStore(file).read()).toEqual(defaultSaveData());
  });

  it("returns the defaults when the file is corrupt", async () => {
    const corrupt = join(dir, "corrupt.json");
    await writeFile(corrupt, "{ not json");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(await createJsonStore(corrupt).read()).toEqual(defaultSaveData());
  });

  it("saves updates to the file", async () => {
    const store = createJsonStore(file);
    await store.update((data) => {
      data.highScore = 42;
    });

    expect((await store.read()).highScore).toBe(42);
    expect(JSON.parse(await readFile(file, "utf8")).highScore).toBe(42);
  });

  it("doesn't lose updates that happen at the same time", async () => {
    const store = createJsonStore(file);
    await Promise.all(
      Array.from({ length: 10 }, () =>
        store.update((data) => {
          data.highScore++;
        }),
      ),
    );
    expect((await store.read()).highScore).toBe(10);
  });
});
