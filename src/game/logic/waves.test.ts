import { describe, expect, it } from 'vitest';
import { TOTAL_WAVES, waveSettings } from './waves';

describe('waveSettings', () => {
  it('sends more scraps in later waves', () => {
    expect(waveSettings(1, 2).count).toBeGreaterThan(waveSettings(1, 1).count);
  });

  it('makes scraps fall faster in later waves', () => {
    expect(waveSettings(1, 2).speed).toBeGreaterThan(waveSettings(1, 1).speed);
  });

  it('makes scraps fall faster in later levels', () => {
    expect(waveSettings(5, 1).speed).toBeGreaterThan(waveSettings(1, 1).speed);
  });

  it('sends scraps sooner in later levels but never faster than every 2.5 seconds', () => {
    expect(waveSettings(5, 1).interval).toBeLessThan(waveSettings(1, 1).interval);
    expect(waveSettings(100, TOTAL_WAVES).interval).toBe(2.5);
  });

  it('gives level 1 wave 1 an easy start', () => {
    expect(waveSettings(1, 1)).toEqual({ count: 4, speed: 20, interval: 5 });
  });
});
