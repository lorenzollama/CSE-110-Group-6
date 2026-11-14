import { describe, expect, it } from "vitest";
import { tileFontSize } from "./view.ts";

// the constants tileFontSize uses, repeated here so the tests can check the
// text really fits instead of just repeating the formula
const DIGIT_WIDTH = 0.6;
const MAX_TEXT_WIDTH = 0.85;

// how wide a number is drawn at this font size, using the same digit estimate as the view
function textWidth(value: number, fontSize: number): number {
  return String(value).length * DIGIT_WIDTH * fontSize;
}

describe("tileFontSize", () => {
  it("uses half the tile size for short numbers", () => {
    expect(tileFontSize(2, 100)).toBe(50);
    expect(tileFontSize(64, 100)).toBe(50);
  });

  it("makes longer numbers smaller", () => {
    const sizes = [8, 512, 2048, 16384, 131072].map(value => tileFontSize(value, 100));

    for (let i = 1; i < sizes.length; i++) {
      expect(sizes[i]).toBeLessThanOrEqual(sizes[i - 1]);
    }
    expect(sizes.at(-1)).toBeLessThan(sizes[0]);
  });

  it.each([2, 64, 512, 2048, 65536, 1048576])("fits %i across the tile", value => {
    for (const tileSize of [36, 43, 100]) {
      const fontSize = tileFontSize(value, tileSize);

      expect(textWidth(value, fontSize)).toBeLessThanOrEqual(tileSize * MAX_TEXT_WIDTH);
    }
  });

  it("returns a whole number", () => {
    expect(Number.isInteger(tileFontSize(2048, 43))).toBe(true);
  });

  it("scales with the tile size", () => {
    expect(tileFontSize(2048, 100)).toBeGreaterThan(tileFontSize(2048, 43));
  });
});
