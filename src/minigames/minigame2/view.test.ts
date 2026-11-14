import { describe, expect, it } from "vitest";
import { tileColor } from "./view.ts";

describe("tileColor", () => {
  it("greys out a blocked tile", () => {
    expect(tileColor(8, [8])).toBe("#9e9e9e");
  });

  it("keeps the normal color for a tile that is not blocked", () => {
    expect(tileColor(8, [16])).toBe(tileColor(8, []));
    expect(tileColor(8, [])).not.toBe("#9e9e9e");
  });
});
