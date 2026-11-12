import type { Topic } from "../../types";

export const TOTAL_LEVELS = 10;

export class LevelsModel {
    private unlockedLevels= 1;
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

export function createLevelsByTopic(): LevelsByTopic {
    return {
        multiplication: new LevelsModel(),
        division: new LevelsModel(),
        simplification: new LevelsModel(),
    };
}
