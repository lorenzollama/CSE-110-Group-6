import { describe, expect, it } from "vitest";
import type { GameState } from "./types.ts";
import { displayPage, tileColors, tileFontSize } from "./view.ts";

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

describe("tileColors for blocked tiles", () => {
  it("greys out a blocked tile", () => {
    expect(tileColors(8, 2, [8]).fill).toBe("#9e9e9e");
  });

  it("keeps the base color for a tile that is not blocked", () => {
    expect(tileColors(8, 2, [16])).toEqual(tileColors(8, 2, []));
    expect(tileColors(8, 2, []).fill).not.toBe("#9e9e9e");
  });
});

describe("tileColors when the game is over", () => {
  it("greys out every tile", () => {
    expect(tileColors(8, 2, [], true).fill).toBe("#9e9e9e");
    expect(tileColors(2048, 2, [], true).fill).toBe("#9e9e9e");
  });
});

// Example data: the state when a game starts, before any question
const NEW_GAME: GameState = {
  board: [
    [2, 0],
    [0, 2],
  ],
  score: 0,
  status: "playing",
  base: 2,
  blocked: [],
  question: null,
  feedback: null,
};
const FEEDBACK = "Correct! 2^5 = 32";

describe("displayPage", () => {
  it("shows the instructions when a game starts", () => {
    expect(displayPage(NEW_GAME)).toBe("instructions");
  });

  it("shows the question while one is up", () => {
    expect(displayPage({ ...NEW_GAME, question: "2^5" })).toBe("question");
  });

  it("shows the feedback after an answer, so the instructions don't come back", () => {
    expect(displayPage({ ...NEW_GAME, feedback: FEEDBACK })).toBe("feedback");
  });

  it("shows No moves left when the game is over", () => {
    expect(displayPage({ ...NEW_GAME, status: "over", feedback: FEEDBACK })).toBe("gameOver");
  });

  it("shows the question first, even with a full board and old feedback", () => {
    expect(displayPage({ ...NEW_GAME, question: "3^2", status: "over", feedback: FEEDBACK })).toBe("question");
  });
});
