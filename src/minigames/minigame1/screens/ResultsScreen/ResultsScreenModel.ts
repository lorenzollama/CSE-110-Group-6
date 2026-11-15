const PERSONAL_BEST_KEY = "alien-signal-memory:personal-best";
/**
 * ResultsScreenModel - Stores final score and leaderboard
 */
export class ResultsScreenModel {
	private finalScore = 0;

	/**
	 * Set the final score
	 */
	setFinalScore(score: number): void {
		this.finalScore = score;
	}

	/**
	 * Get the final score
	 */
	getFinalScore(): number {
		return this.finalScore;
	}

	/**
	 * Loads the player's best completed round count from the browser
	 */
	loadPersonalBest(): number | null {
		const savedRecord = localStorage.getItem(PERSONAL_BEST_KEY);

		if (savedRecord === null || savedRecord.trim() === "") {
			return null;
		}
		const rounds = Number(savedRecord);
		return Number.isSafeInteger(rounds) && rounds >= 0 ? rounds : null;
	}

	/**
	 * Saves the first finished run or updates the record when the player beats it
	 */
	savePersonalBest(completedRounds: number): void {
		const previousBest = this.loadPersonalBest();

		if (previousBest === null || completedRounds > previousBest) {
			localStorage.setItem(PERSONAL_BEST_KEY, String(completedRounds));
		}
	}
}
