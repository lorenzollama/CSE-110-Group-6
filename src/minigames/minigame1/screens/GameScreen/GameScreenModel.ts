import type { Coordinates } from "../../objects/Grid.ts";
import { MAX_LIVES } from "../../constants.ts";

export class GameScreenModel {
	private score = 0;
	private round = 1;
	private lives = 0;
	private sequence: Coordinates[] = [];
	private nextSelectionIndex = 0;
	private acceptingInput = false;


	//reset everthing
	reset(): void {
		this.score = 0;
		this.round = 1;
		this.lives = MAX_LIVES;
		this.sequence = [];
		this.nextSelectionIndex = 0;
        this.acceptingInput = false;
	}
	
	// reset current sequence (incorrect)
	resetCurrentSequence(): void {
		this.nextSelectionIndex = 0;
		this.acceptingInput = false;
	}

	// incorrect input -> get correct one
	getCurrentExpected(): Coordinates | undefined {
		return this.sequence[this.nextSelectionIndex];
	}

	// pass in sequence coordiantes
	startPlayerTurn(sequence: Coordinates[]): void {
		this.sequence = sequence.map(signal => ({
			row: signal.row,
			col: signal.col,
		}));
		this.nextSelectionIndex = 0;
        this.acceptingInput = this.sequence.length > 0;
	}
	
	// check a selection against the next expected signal
	// stops accepting input after a mistake or a completed sequence
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

	advanceRound(newSignal: Coordinates): boolean {
		if (this.acceptingInput || this.sequence.length == 0 ||
			this. nextSelectionIndex !== this.sequence.length) {
			return false;
		}
		this.sequence.push({row: newSignal.row, col: newSignal.col});
		this.round++;
		this.resetCurrentSequence();
		return true;
	}

	getSequence(): Coordinates[] {
		return this.sequence.map(signal => ({
			row: signal.row,
			col: signal.col,
		}));
	}

	getRound(): number {
		return this.round;
	}

	incrementScore(): void {
		this.score++;
	}

	getScore(): number {
		return this.score;
	}

	decrementLives(): void {
		this.lives--;
	}

	getLives(): number {
		return this.lives;
	}
}
