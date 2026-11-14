import { describe, expect, it } from "vitest";
import { tileColors } from "./view.ts";

// pulls the hue and lightness numbers out of "hsl(h, s%, l%)"
function hueAndLightness(color: string): { hue: number; lightness: number } {
  const [hue, , lightness] = color.match(/[\d.]+/g)!.map(Number);
  return { hue, lightness };
}

describe("tileColors", () => {
  it("gives each base its own hue", () => {
    const hues = [2, 3, 4, 5, 6, 7, 8, 9].map(base => hueAndLightness(tileColors(base, base).fill).hue);
    expect(new Set(hues).size).toBe(8);
  });

  it("gives the same power the same shade in every base", () => {
    // 8 is 2^3 and 27 is 3^3
    expect(hueAndLightness(tileColors(8, 2).fill).lightness).toBe(hueAndLightness(tileColors(27, 3).fill).lightness);
  });

  it("gets darker with each power", () => {
    const lightness = [3, 9, 27, 81].map(value => hueAndLightness(tileColors(value, 3).fill).lightness);
    expect(lightness).toEqual([...lightness].sort((a, b) => b - a));
    expect(new Set(lightness).size).toBe(4);
  });

  it("uses a dark number on light tiles and a white number on dark tiles", () => {
    expect(tileColors(2, 2).text).not.toBe("white");
    expect(tileColors(2 ** 11, 2).text).toBe("white");
  });

  it("finds the power even when the log comes out a tiny bit off", () => {
    // Math.log(59049) / Math.log(9) is 4.999999999999999, not 5,
    // but 59049 (9^5) still gets the same shade as 32 (2^5)
    expect(hueAndLightness(tileColors(59049, 9).fill).lightness).toBe(hueAndLightness(tileColors(32, 2).fill).lightness);
  });
});
