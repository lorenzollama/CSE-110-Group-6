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

	/**
	 * Creates the model and view and connects player selection
	 * to sequence checking, light highlighting, and status messages
	 *
	 * @param screenSwitcher the service used to navigate between screens
	 * @param stage the Konva stage displaying the game
	 */
	constructor(screenSwitcher: ScreenSwitcher, stage: Stage) {
		super();
		this.screenSwitcher = screenSwitcher;

		this.model = new GameScreenModel();
		this.view = new GameScreenView(stage);
		this.view.setSelectionHandler((row, col) => {
			const result = this.model.checkSelection({ row, col });
			if (result === "ignored") {
				return;
			}
			this.view.showSelectionFeedback(row, col);

			if (result === "correct") {
				this.view.updateStatus("Correct! Keep Going.");
			}
			else if (result === "incorrect") {
				this.view.updateStatus("Incorrect sequence. Attempt ended.");
			}
			else if (result === "complete") {
				this.view.updateStatus("Sequence complete!");
			}
		});
	}

	/**
	 * Start the game
	 * Displays instructions and enables input after playback finishes
	 */
	startGame(): void {
		// Reset model state
		this.model.reset();

		// Update the score and display playback instructions
		this.view.updateScore(this.model.getScore());
		this.view.updateStatus("Watch the sequence.");
		this.view.show();

		// example sequence, pass coords into grid
		const sequence: Coordinates[] = [
			{ row: 0, col: 0 },
			{ row: 0, col: 1 },
			{ row: 1, col: 1 },
			{ row: 2, col: 2 },
		];
		this.view.getGrid().blink(sequence, () => {
			this.model.startPlayerTurn(sequence);
			this.view.updateStatus("Your turn! Repeat the sequence.");
		});
	}

	/**
	 * End the game
	 */
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

	/**
	 * Get final score
	 */
	getFinalScore(): number {
		return this.model.getScore();
	}

	/**
	 * Get the view group
	 */
	getView(): GameScreenView {
		return this.view;
	}
}
