import type { Stage } from "konva/lib/Stage";
import type { Coordinates } from "../../objects/Grid.ts";
import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { GameScreenModel } from "./GameScreenModel.ts";
import { GameScreenView } from "./GameScreenView.ts";

/**
 * GameScreenController - Coordinates game logic between Model and View
 */
export class GameScreenController extends ScreenController {
	private model: GameScreenModel;
	private view: GameScreenView;
	private screenSwitcher: ScreenSwitcher;
	private currentSequence: Coordinates[] = [];
	private gameGeneration = 0;
	private gameOver = false;
	private pendingTimers = new Set<ReturnType<typeof setTimeout>>();

	constructor(screenSwitcher: ScreenSwitcher, stage: Stage) {
		super();
		this.screenSwitcher = screenSwitcher;

		this.model = new GameScreenModel();
		this.view = new GameScreenView(stage);
		this.view.setSelectionHandler((row, col) => {
			if (this.gameOver) {
				return;
			}
			const result = this.model.checkSelection({ row, col });
			if (result === "ignored") {
				return;
			}
			this.view.showSelectionFeedback(row, col);

			if (result === "correct") {
				this.view.updateStatus("Correct! Keep Going.");
			}
			else if (result === "incorrect") {
				this.model.decrementLives();
				this.view.updateLives(this.model.getLives());

				if (this.model.getLives() <= 0) { // no lives = game over
					this.gameOver = true;
					this.clearPendingTimers();
					this.view.updateStatus("Out of lives! Game Over.");
					this.endGame();
				} else { // still have lives = replay
					this.view.updateStatus("Incorrect! Here is the correct square.");
					const expected = this.model.getCurrentExpected();
					this.model.resetCurrentSequence();

					// blink the correct square -> replay round
					if (expected) {
						this.view.getGrid().blink([expected], () => {
							this.scheduleForCurrentGame(() => {
								this.playSequence(this.currentSequence);
							}, 500)
						});
					} else {
						this.scheduleForCurrentGame(() => {
							this.playSequence(this.currentSequence);
						}, 1000);
					}
				}
			}
			else if (result === "complete") {
				this.model.incrementScore();
				this.view.updateScore(this.model.getScore());
				const advanced = this.model.advanceRound(
					this.getRandomCoordinates()
				);
				if (advanced) {
					this.currentSequence = this.model.getSequence();
					this.playSequence(this.currentSequence);
				}
			}
		});
	}

	startGame(): void {
		// reset model state
		this.gameGeneration++;
		this.clearPendingTimers();
		this.gameOver = false;

		this.model.reset();

		// update the score and display playback instructions
		this.view.updateScore(this.model.getScore());
		this.view.updateStatus("Watch the sequence.");
		this.view.updateLives(this.model.getLives());
		this.view.show();
		this.currentSequence = [this.getRandomCoordinates()];
		this.playSequence(this.currentSequence);
	}
	
	private playSequence(sequence: Coordinates[]): void {
		const generation = this.gameGeneration;
		this.view.updateRound(this.model.getRound());
		this.view.updateStatus("Watch the sequence.");
		this.view.getGrid().blink(sequence, () => {
			if (generation !== this.gameGeneration || this.gameOver) {
				return;
			}
			this.model.startPlayerTurn(sequence);
			this.view.updateStatus("Your turn! Repeat the sequence.");
		});
	}

	private scheduleForCurrentGame(callback: () => void, delay: number): void {
		const generation = this.gameGeneration;
		const timer = setTimeout(() => {
			this.pendingTimers.delete(timer);
			if (generation !== this.gameGeneration || this.gameOver) {
				return;
			}
			callback();
		}, delay);
		this.pendingTimers.add(timer);
	}

	private clearPendingTimers(): void {
		for (const timer of this.pendingTimers) {
			clearTimeout(timer);
		}
		this.pendingTimers.clear();
	}

	private endGame(): void {
		// Switch to results screen with final score
		this.screenSwitcher.switchToScreen({
			type: "result",
			score: this.model.getScore(),
		});
	}

	getRandomCoordinates(): Coordinates {
		const row = Math.floor(Math.random() * this.view.getGrid().getRowCount());
		const col = Math.floor(Math.random() * this.view.getGrid().getColCount());
		return { row, col };
	}

	getFinalScore(): number {
		return this.model.getScore();
	}
	
	getView(): GameScreenView {
		return this.view;
	}
}
