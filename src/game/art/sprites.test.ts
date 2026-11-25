import { describe, expect, it } from 'vitest';
import { FLAME_ROWS, SCRAP_COLORS, SCRAP_SPRITES, SHIP_COLORS, SHIP_ROWS, scrapSprite } from './sprites';

const letters = (rows: string[]) => new Set(rows.flatMap(row => [...row]).filter(letter => letter !== '.'));

describe('ship art', () => {
  it('is a rectangle of pixels', () => {
    expect(new Set(SHIP_ROWS.map(row => row.length)).size).toBe(1);
  });

  it('is as wide as its flame, so the flame sits under it', () => {
    expect(FLAME_ROWS[0].length).toBe(SHIP_ROWS[0].length);
  });

  it('only uses colors that are in its palette', () => {
    for (const letter of [...letters(SHIP_ROWS), ...letters(FLAME_ROWS)]) {
      expect(SHIP_COLORS).toHaveProperty(letter);
    }
  });
});

describe('scrap art', () => {
  it('has several different pictures', () => {
    expect(SCRAP_SPRITES.length).toBeGreaterThanOrEqual(3);
    expect(new Set(SCRAP_SPRITES.map(rows => rows.join('\n'))).size).toBe(SCRAP_SPRITES.length);
  });

  it('draws every picture 16 by 16, so every scrap is the same size', () => {
    for (const rows of SCRAP_SPRITES) {
      expect(rows).toHaveLength(16);
      for (const row of rows) expect(row).toHaveLength(16);
    }
  });

  it('only uses colors that are in its palette', () => {
    for (const rows of SCRAP_SPRITES) {
      for (const letter of letters(rows)) expect(SCRAP_COLORS).toHaveProperty(letter);
    }
  });

  it('keeps a dark label band across the middle for the math problem', () => {
    for (const rows of SCRAP_SPRITES) {
      for (const row of rows.slice(6, 10)) expect(row.slice(1, 15)).toBe('P'.repeat(14));
    }
  });
});

describe('scrapSprite', () => {
  it('gives a scrap the same picture every time', () => {
    for (const id of [1, 2, 3, 50, 999]) expect(scrapSprite(id)).toBe(scrapSprite(id));
  });

  it('only gives pictures from the list', () => {
    for (let id = 1; id <= 200; id++) expect(SCRAP_SPRITES).toContain(scrapSprite(id));
  });

  it('uses every picture and does not just repeat them in order', () => {
    const picks = Array.from({ length: 100 }, (_, i) => SCRAP_SPRITES.indexOf(scrapSprite(i + 1)));
    for (let picture = 0; picture < SCRAP_SPRITES.length; picture++) {
      expect(picks.filter(pick => pick === picture).length).toBeGreaterThan(10);
    }
    const repeating = picks.every((pick, i) => i < 4 || pick === picks[i - 4]);
    expect(repeating).toBe(false);
  });
});
