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
});
