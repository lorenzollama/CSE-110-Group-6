import type { Topic } from "../../types";

export const TOTAL_LEVELS = 10;

export class LevelsModel {
    private unlockedLevels: number;

    /**
     * Starts at a saved level, or at level 1 for a new player. A saved level that isn't
     * a real level (0, 99, 2.5, NaN, ...) also starts at 1, so bad save data can't
     * unlock every level or lock all of them.
     */
    constructor(startLevel = 1) {
        const isRealLevel = Number.isInteger(startLevel) && startLevel >= 1 && startLevel <= TOTAL_LEVELS;
        this.unlockedLevels = isRealLevel ? startLevel : 1;
    }

    getUnlockedLevels(): number {
        return this.unlockedLevels;
    }
    isUnlocked(level: number): boolean {
        return level >= 1 && level <= this.unlockedLevels;
    }
    completeLevel(level: number): void {
        if (level === this.unlockedLevels && level < TOTAL_LEVELS) {
            this.unlockedLevels++;
        }
    }
}

/** Level progress for each topic. Each topic unlocks its levels separately. */
export type LevelsByTopic = Record<Topic, LevelsModel>;

/** The highest unlocked level of each topic, as it is saved. A missing topic starts at 1. */
export type SavedLevelProgress = Partial<Record<Topic, number>>;

/** Creates every topic's progress, starting from saved progress if there is any. */
export function createLevelsByTopic(saved: SavedLevelProgress = {}): LevelsByTopic {
    return {
        multiplication: new LevelsModel(saved.multiplication),
        division: new LevelsModel(saved.division),
        simplification: new LevelsModel(saved.simplification),
    };
}
