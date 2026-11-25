/**
 * The math behind the explosion when a scrap is shot. It has no drawing code, so it can be
 * tested: art/draw.ts turns these numbers into moving squares.
 */

/** A small square that flies out from the scrap and fades. */
export interface Particle {
  dx: number; // how far it flies sideways
  dy: number; // how far it flies down (negative is up)
  size: number; // the square's width and height
  color: string;
}

export const BURST_COUNT = 12;
export const BURST_MIN_DISTANCE = 30;
export const BURST_MAX_DISTANCE = 64;
export const BURST_SIZES = [4, 6];
export const BURST_COLORS = ['#ffffff', '#facc15', '#f97316', '#38bdf8'];

/**
 * The pieces of one explosion. They fly out in every direction: each gets its own slice of the
 * circle, shaken a little so the burst doesn't look like a clock face. Pass an `rng` that
 * returns a number from 0 up to (not including) 1 to get the same burst every time.
 */
export function burstParticles(count: number = BURST_COUNT, rng: () => number = Math.random): Particle[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = ((i + rng() * 0.8) / count) * Math.PI * 2;
    const distance = BURST_MIN_DISTANCE + rng() * (BURST_MAX_DISTANCE - BURST_MIN_DISTANCE);
    return {
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance,
      size: BURST_SIZES[Math.floor(rng() * BURST_SIZES.length)],
      color: BURST_COLORS[Math.floor(rng() * BURST_COLORS.length)],
    };
  });
}
