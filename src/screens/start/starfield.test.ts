import { describe, expect, it } from "vitest";
import {
  MAX_STARS,
  MIN_GLOW,
  SHOOTING_STAR_MAX_WAIT,
  SHOOTING_STAR_MIN_WAIT,
  makeShootingStar,
  makeStars,
  nextShootingStarWait,
  shootingStarAt,
  starCountFor,
  twinkle,
  type ShootingStar,
  type Star,
} from "./starfield";

/** A fake random number generator that always returns the same value. */
const always = (value: number) => () => value;

const star: Star = { x: 10, y: 10, radius: 1, brightness: 0.8, speed: 2, phase: 0 };

describe("makeStars", () => {
  it("makes the requested number of stars inside the sky", () => {
    const stars = makeStars(200, 800, 600);
    expect(stars).toHaveLength(200);
    for (const s of stars) {
      expect(s.x).toBeGreaterThanOrEqual(0);
      expect(s.x).toBeLessThan(800);
      expect(s.y).toBeGreaterThanOrEqual(0);
      expect(s.y).toBeLessThan(600);
    }
  });

  // Edge case: the smallest and largest random values still give sensible stars.
  it("keeps sizes and brightness in range", () => {
    for (const s of [...makeStars(1, 800, 600, always(0)), ...makeStars(1, 800, 600, always(0.999))]) {
      expect(s.radius).toBeGreaterThanOrEqual(0.6);
      expect(s.radius).toBeLessThanOrEqual(1.8);
      expect(s.brightness).toBeGreaterThanOrEqual(0.4);
      expect(s.brightness).toBeLessThanOrEqual(1);
    }
  });
});

describe("starCountFor", () => {
  it("gives the 800×600 menu 140 stars", () => {
    expect(starCountFor(800, 600)).toBe(140);
  });

  // A full-screen window gets more stars, so it isn't emptier than the small one.
  it("gives a bigger sky more stars", () => {
    expect(starCountFor(1280, 720)).toBeGreaterThan(starCountFor(800, 600));
  });

  // Edge case: a huge screen doesn't get so many stars that the animation slows down.
  it("never goes over MAX_STARS", () => {
    expect(starCountFor(7680, 4320)).toBe(MAX_STARS);
  });
});

describe("twinkle", () => {
  it("changes a star's brightness over time", () => {
    expect(twinkle(star, 0)).not.toBeCloseTo(twinkle(star, 0.5));
  });

  // Edge case: a star never disappears completely and never gets brighter than its brightness.
  it("stays between MIN_GLOW and the star's brightness", () => {
    for (let seconds = 0; seconds < 10; seconds += 0.05) {
      const opacity = twinkle(star, seconds);
      expect(opacity).toBeGreaterThanOrEqual(star.brightness * MIN_GLOW - 1e-9);
      expect(opacity).toBeLessThanOrEqual(star.brightness + 1e-9);
    }
  });

  it("doesn't make every star blink together", () => {
    const other = { ...star, phase: Math.PI };
    expect(twinkle(star, 1)).not.toBeCloseTo(twinkle(other, 1));
  });
});

describe("nextShootingStarWait", () => {
  it("waits a random time within the range", () => {
    expect(nextShootingStarWait(always(0))).toBe(SHOOTING_STAR_MIN_WAIT);
    expect(nextShootingStarWait(always(0.999))).toBeLessThan(SHOOTING_STAR_MAX_WAIT);
    expect(nextShootingStarWait(always(0.5))).toBeGreaterThan(SHOOTING_STAR_MIN_WAIT);
  });
});

describe("shooting stars", () => {
  it("starts near the top of the sky and flies downward", () => {
    for (const value of [0, 0.3, 0.6, 0.999]) {
      const s = makeShootingStar(800, 600, always(value));
      expect(s.startX).toBeGreaterThanOrEqual(0);
      expect(s.startX).toBeLessThanOrEqual(800);
      expect(s.startY).toBeLessThan(600 / 2);
      expect(s.dirY).toBeGreaterThan(0);
      expect(Math.hypot(s.dirX, s.dirY)).toBeCloseTo(1);
    }
  });

  it("can fly to the left or to the right", () => {
    expect(makeShootingStar(800, 600, always(0.2)).dirX).toBeGreaterThan(0);
    expect(makeShootingStar(800, 600, always(0.8)).dirX).toBeLessThan(0);
  });

  const flying: ShootingStar = { startX: 100, startY: 50, dirX: 1, dirY: 0, speed: 600, length: 100, duration: 1 };

  it("moves along its direction at its speed, with the tail behind it", () => {
    const frame = shootingStarAt(flying, 0.5)!;
    expect(frame.headX).toBeCloseTo(100 + 600 * 0.5);
    expect(frame.headY).toBeCloseTo(50);
    expect(frame.headX - frame.tailX).toBeCloseTo(100); // a full-length tail, pointing back
  });

  // Edge case: right after it appears, its tail is still short.
  it("grows its tail as it starts out", () => {
    const frame = shootingStarAt(flying, 0.05)!;
    expect(frame.headX - frame.tailX).toBeCloseTo(600 * 0.05);
  });

  it("fades in, then out", () => {
    expect(shootingStarAt(flying, 0)!.opacity).toBe(0);
    expect(shootingStarAt(flying, 0.4)!.opacity).toBe(1);
    expect(shootingStarAt(flying, 0.9)!.opacity).toBeLessThan(0.5);
  });

  // Unsuccessful path: before it appears and after it's gone there's nothing to draw.
  it("is gone outside its flight time", () => {
    expect(shootingStarAt(flying, -0.1)).toBe(null);
    expect(shootingStarAt(flying, 1)).toBe(null);
    expect(shootingStarAt(flying, 5)).toBe(null);
  });
});
