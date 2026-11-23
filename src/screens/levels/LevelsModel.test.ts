import { describe, expect, it } from 'vitest';
import{createLevelsByTopic, LevelsModel, TOTAL_LEVELS} from './LevelsModel';

describe('LevelModel', () => {
  it('only level 1 is unlocked at the start', () => {
    const model = new LevelsModel;
    expect(model.getUnlockedLevels()).toBe(1);
    expect(model.isUnlocked(1)).toBe(true);
    expect(model.isUnlocked(2)).toBe(false);
  });

  it('completing the newest level unlocks the next one', () => {
    const model = new LevelsModel;
    model.completeLevel(1);
    expect(model.getUnlockedLevels()).toBe(2);
    expect(model.isUnlocked(2)).toBe(true);
  });

    it('replaying an older level unlocks nothing extra', () => {
    const model = new LevelsModel;
    model.completeLevel(1);
    model.completeLevel(2);
    expect(model.getUnlockedLevels()).toBe(3);
    model.completeLevel(1);
    expect(model.getUnlockedLevels()).toBe(3);
  });

   it(`never unlocks past the last level`, () => {
       const model = new LevelsModel;
       for (let level = 1; level <= TOTAL_LEVELS; level++) {
         model.completeLevel(level);
       }
       expect(model.getUnlockedLevels()).toBe(TOTAL_LEVELS);
     });

    it('level 0 is not unlocked', () => {
    const model = new LevelsModel;
    expect(model.isUnlocked(0)).toBe(false);

  });

  it('starts at a saved level', () => {
    const model = new LevelsModel(4);
    expect(model.getUnlockedLevels()).toBe(4);
    expect(model.isUnlocked(4)).toBe(true);
    expect(model.isUnlocked(5)).toBe(false);
  });

  it('can start at the last level', () => {
    expect(new LevelsModel(TOTAL_LEVELS).getUnlockedLevels()).toBe(TOTAL_LEVELS);
  });

  // Edge case: bad save data must not unlock every level (99) or lock all of them (0).
  it('starts at level 1 when the saved level is out of range', () => {
    expect(new LevelsModel(0).getUnlockedLevels()).toBe(1);
    expect(new LevelsModel(-2).getUnlockedLevels()).toBe(1);
    expect(new LevelsModel(TOTAL_LEVELS + 1).getUnlockedLevels()).toBe(1);
  });

  it("starts at level 1 when the saved level isn't a whole number", () => {
    expect(new LevelsModel(2.5).getUnlockedLevels()).toBe(1);
    expect(new LevelsModel(NaN).getUnlockedLevels()).toBe(1);
  });

});

describe('createLevelsByTopic', () => {
  it('starts every topic at level 1', () => {
    const levels = createLevelsByTopic();
    expect(levels.multiplication.getUnlockedLevels()).toBe(1);
    expect(levels.division.getUnlockedLevels()).toBe(1);
    expect(levels.simplification.getUnlockedLevels()).toBe(1);
  });

  it('unlocks levels for one topic without affecting the others', () => {
    const levels = createLevelsByTopic();
    levels.division.completeLevel(1);
    levels.division.completeLevel(2);
    expect(levels.division.getUnlockedLevels()).toBe(3);
    expect(levels.multiplication.getUnlockedLevels()).toBe(1);
    expect(levels.simplification.getUnlockedLevels()).toBe(1);
  });

  it('starts each topic at its saved level, and missing topics at 1', () => {
    const levels = createLevelsByTopic({ multiplication: 3, division: 7 });
    expect(levels.multiplication.getUnlockedLevels()).toBe(3);
    expect(levels.division.getUnlockedLevels()).toBe(7);
    expect(levels.simplification.getUnlockedLevels()).toBe(1);
  });
});
