import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { defaultSaveData, type SaveData } from "../types.js";

export interface Store {
  read(): Promise<SaveData>;
  /** Reads the data, lets `change` edit it, then writes it back. Updates run one at a time. */
  update<T>(change: (data: SaveData) => T): Promise<T>;
}

/** Keeps all save data in one JSON file. A missing or corrupt file starts over from the defaults. */
export function createJsonStore(filePath: string): Store {
  // Each update waits for the one before it, so two requests can't both read
  // the old data and overwrite each other's changes.
  let queue: Promise<unknown> = Promise.resolve();

  async function read(): Promise<SaveData> {
    let text: string;
    try {
      text = await readFile(filePath, "utf8");
    } catch {
      return defaultSaveData(); // no file yet
    }

    try {
      const parsed = JSON.parse(text);
      if (parsed?.version !== 1) throw new Error(`unknown version ${parsed?.version}`);
      return { ...defaultSaveData(), ...parsed };
    } catch (err) {
      console.warn(`Ignoring unreadable save file ${filePath}:`, err);
      return defaultSaveData();
    }
  }

  // Write to a temp file and rename it, so a crash mid-write can't leave half a file.
  async function write(data: SaveData): Promise<void> {
    await mkdir(dirname(filePath), { recursive: true });
    const tmp = `${filePath}.tmp`;
    await writeFile(tmp, JSON.stringify(data, null, 2));
    await rename(tmp, filePath);
  }

  function update<T>(change: (data: SaveData) => T): Promise<T> {
    const next = queue.then(async () => {
      const data = await read();
      const result = change(data);
      await write(data);
      return result;
    });
    queue = next.catch(() => {}); // a failed update shouldn't block the ones after it
    return next;
  }

  return { read, update };
}
