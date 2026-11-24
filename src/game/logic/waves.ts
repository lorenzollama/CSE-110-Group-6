/** How many waves one level has. Clear them all to finish the level. */
export const TOTAL_WAVES = 3;

// Starting values for level 1 wave 1. Raised for quick testing. A config file will replace them later.
export const BASE_COUNT = 3; // scraps in level 1 wave 1
export const COUNT_PER_WAVE = 1; // extra scraps for each later wave
export const COUNT_PER_LEVEL = 1; // extra scraps for each later level
export const BASE_SPEED = 40; // pixels per second
// Each level is a clear step faster than the last. A level's waves only speed up a little, so
// the next level always starts faster than the previous one ended (5 > 2 × (TOTAL_WAVES - 1)).
export const SPEED_PER_LEVEL = 5;
export const SPEED_PER_WAVE = 2;
export const BASE_INTERVAL = 3; // seconds between scraps
export const MIN_INTERVAL = 1.5; // scraps never come faster than this

export interface WaveSettings {
  count: number; // how many scraps the wave sends
  speed: number; // how fast the scraps fall, in pixels per second
  interval: number; // seconds between one new scrap and the next
}

/**
 * Later levels and later waves send more scraps that fall faster and come sooner.
 * Tweak the numbers here to change the difficulty. Level 1 wave 1 falls at 40 px/s
 * (about 7 seconds to the front line); level 10's last wave at 89 px/s (about 3 seconds).
 */
export function waveSettings(level: number, wave: number): WaveSettings {
  return {
    count: BASE_COUNT + COUNT_PER_WAVE * (wave - 1) + COUNT_PER_LEVEL * (level - 1),
    speed: BASE_SPEED + SPEED_PER_LEVEL * (level - 1) + SPEED_PER_WAVE * (wave - 1),
    interval: Math.max(MIN_INTERVAL, BASE_INTERVAL - 0.25 * (level - 1)),
  };
}
