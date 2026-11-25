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

	private correctAudio: HTMLAudioElement;
	private incorrectAudio: HTMLAudioElement;
	private roundCompleteAudio: HTMLAudioElement;

	constructor(screenSwitcher: ScreenSwitcher, stage: Stage) {
		super();
		this.screenSwitcher = screenSwitcher;

		this.model = new GameScreenModel();
		this.view = new GameScreenView(stage, () => this.quitGame());

		this.correctAudio = new Audio('/minigame1/correct.mp3');
		this.incorrectAudio = new Audio('/minigame1/incorrect.mp3');
		this.roundCompleteAudio = new Audio('/minigame1/round_complete.mp3');

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

				this.correctAudio.currentTime = 0;
				this.correctAudio.play();
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

					this.incorrectAudio.currentTime = 0;
					this.incorrectAudio.play();

					// blink the correct square -> replay round
					if (expected) {
						this.view.getGrid().blink([expected], false, () => {
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

				this.correctAudio.currentTime = 0;
				this.correctAudio.play();

				// scheduled for this game only, so leaving mid-way doesn't start the next round
				this.scheduleForCurrentGame(() => {
					this.roundCompleteAudio.currentTime = 0;
					this.roundCompleteAudio.play();

					this.scheduleForCurrentGame(() => {
						const advanced = this.model.advanceRound(
							this.getRandomCoordinates()
						);

						if (advanced) {
							this.currentSequence = this.model.getSequence();
							this.playSequence(this.currentSequence);
						}
					}, 1000);
				}, 1000);
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
		this.view.getGrid().blink(sequence, true, () => {
			if (generation !== this.gameGeneration || this.gameOver) {
				return;
			}
			this.model.startPlayerTurn(sequence);
			this.view.updateStatus("Your turn! Repeat the sequence.");
		});
	}

	/**
	 * Back was clicked: stops the game (its lights, sounds and timers) without recording a
	 * score, and goes back to the minigame's menu.
	 */
	quitGame(): void {
		this.gameGeneration++;
		this.gameOver = true;
		this.clearPendingTimers();
		this.view.getGrid().stopBlinking();
		this.screenSwitcher.switchToScreen({ type: "menu" });
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
