import { describe, expect, it } from 'vitest';
import {
  BURST_COLORS,
  BURST_COUNT,
  BURST_MAX_DISTANCE,
  BURST_MIN_DISTANCE,
  BURST_SIZES,
  burstParticles,
} from './effects';

/** A repeatable "random" number generator, so the tests get the same numbers every run. */
function seededRng(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

describe('burstParticles', () => {
  it('makes the usual number of pieces by default', () => {
    expect(burstParticles()).toHaveLength(BURST_COUNT);
  });

  it('makes as many pieces as asked for', () => {
    expect(burstParticles(5)).toHaveLength(5);
    expect(burstParticles(0)).toEqual([]);
  });

  it('is the same every time with the same random numbers', () => {
    expect(burstParticles(BURST_COUNT, seededRng(7))).toEqual(burstParticles(BURST_COUNT, seededRng(7)));
  });

  it('is different with different random numbers', () => {
    expect(burstParticles(BURST_COUNT, seededRng(7))).not.toEqual(burstParticles(BURST_COUNT, seededRng(8)));
  });

  it('sends every piece out between the smallest and largest distance', () => {
    for (const piece of burstParticles(200, seededRng(1))) {
      const distance = Math.hypot(piece.dx, piece.dy);
      expect(distance).toBeGreaterThanOrEqual(BURST_MIN_DISTANCE - 1e-9);
      expect(distance).toBeLessThanOrEqual(BURST_MAX_DISTANCE + 1e-9);
    }
  });

  it('gives every piece a known size and color', () => {
    for (const piece of burstParticles(100, seededRng(2))) {
      expect(BURST_SIZES).toContain(piece.size);
      expect(BURST_COLORS).toContain(piece.color);
    }
  });

  it('flies out in every direction, not just one side', () => {
    const pieces = burstParticles(BURST_COUNT, seededRng(3));
    expect(pieces.some(piece => piece.dx > 0)).toBe(true);
    expect(pieces.some(piece => piece.dx < 0)).toBe(true);
    expect(pieces.some(piece => piece.dy > 0)).toBe(true);
    expect(pieces.some(piece => piece.dy < 0)).toBe(true);
  });

  it('works with the smallest and largest random numbers', () => {
    expect(() => burstParticles(BURST_COUNT, () => 0)).not.toThrow();
    expect(() => burstParticles(BURST_COUNT, () => 0.9999999)).not.toThrow();
    const first = burstParticles(BURST_COUNT, () => 0)[0];
    expect(first.dx).toBeCloseTo(BURST_MIN_DISTANCE); // angle 0 points straight right
    expect(first.dy).toBeCloseTo(0);
  });
});
