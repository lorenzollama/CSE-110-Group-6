import type { Coordinates } from "../../objects/Grid.ts";

/**
 * GameScreenModel - Manages game state
 */
export class GameScreenModel {
	private score = 0;
	private sequence: Coordinates[] = [];
	private nextSelectionIndex = 0;
	private acceptingInput = false;


	/**
	 * Resets the score, clears sequence progress, and disables player input
	 */
	reset(): void {
		this.score = 0;
		this.sequence = [];
		this.nextSelectionIndex = 0;
        this.acceptingInput = false;
	}

	/**
	 * Copies the expected sequence and resets the player's input progress
	 * Enables selections only when the sequence is not empty
	 * 
	 * @param sequence the light sequence the player must repeat
	 */
	startPlayerTurn(sequence: Coordinates[]): void {
		this.sequence = sequence.map(signal => ({
			row: signal.row,
			col: signal.col,
		}));
		this.nextSelectionIndex = 0;
        this.acceptingInput = this.sequence.length > 0;
	}
	
	/**
	 * Check a selection against the next expected signal
	 * Stops accepting input after a mistake or a completed sequence
	 *
	 * @param selection the row and column of the selected light
	 * @returns "ignored" if input is disabled, "incorrect" for a mismatch,
	 * "correct" for a match with more signals remaining, or "complete"
	 * when the entire sequence has been entered correctly
	 */
	checkSelection(selection: Coordinates):
		"ignored" | "correct" | "incorrect" | "complete" {
		if (!this.acceptingInput) {
			return "ignored";
		}

		const expected = this.sequence[this.nextSelectionIndex];

		if (selection.row !== expected.row || selection.col !== expected.col) {
			this.acceptingInput = false;
			return "incorrect";
		}
		this.nextSelectionIndex++;

		if (this.nextSelectionIndex === this.sequence.length) {
			this.acceptingInput = false;
			return "complete";
		}
		return "correct";
	}

	/**
	 * Increment score when lemon is clicked
	 */
	incrementScore(): void {
		this.score++;
	}

	/**
	 * Get current score
	 */
	getScore(): number {
		return this.score;
	}
}
