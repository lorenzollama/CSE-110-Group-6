/** How many waves one level has. Clear them all to finish the level. */
export const TOTAL_WAVES = 3;

export interface WaveSettings {
  count: number; // how many scraps the wave sends
  speed: number; // how fast the scraps fall, in pixels per second
  interval: number; // seconds between one new scrap and the next
}

/**
 * Later levels and later waves send more scraps that fall faster and come sooner.
 * Tweak the numbers here to change the difficulty.
 */
export function waveSettings(level: number, wave: number): WaveSettings {
  return {
    count: 3 + wave,
    speed: 20 + 3 * (level - 1) + 2 * (wave - 1),
    interval: Math.max(2.5, 5 - 0.25 * (level - 1)),
  };
}
