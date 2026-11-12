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