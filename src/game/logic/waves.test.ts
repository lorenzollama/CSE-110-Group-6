import { describe, expect, it } from 'vitest';
import { BASE_COUNT, BASE_INTERVAL, BASE_SPEED, MIN_INTERVAL, TOTAL_WAVES, waveSettings } from './waves';

describe('waveSettings', () => {
  it('sends more scraps in later waves', () => {
    expect(waveSettings(1, 2).count).toBeGreaterThan(waveSettings(1, 1).count);
  });

  it('sends more scraps in later levels', () => {
    expect(waveSettings(3, 1).count).toBeGreaterThan(waveSettings(1, 1).count);
  });

  it('makes scraps fall faster in later waves', () => {
    expect(waveSettings(1, 2).speed).toBeGreaterThan(waveSettings(1, 1).speed);
  });

  it('makes scraps fall faster in later levels', () => {
    expect(waveSettings(5, 1).speed).toBeGreaterThan(waveSettings(1, 1).speed);
  });

  it('starts every level faster than the last level ended', () => {
    for (let level = 2; level <= 10; level++) {
      expect(waveSettings(level, 1).speed).toBeGreaterThan(waveSettings(level - 1, TOTAL_WAVES).speed);
    }
  });

  it('sends scraps sooner in later levels but never faster than the minimum', () => {
    expect(waveSettings(5, 1).interval).toBeLessThan(waveSettings(1, 1).interval);
    expect(waveSettings(100, TOTAL_WAVES).interval).toBe(MIN_INTERVAL);
  });

  it('gives level 1 wave 1 an easy start', () => {
    expect(waveSettings(1, 1)).toEqual({ count: BASE_COUNT, speed: BASE_SPEED, interval: BASE_INTERVAL });
  });
});
