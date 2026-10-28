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

	constructor(screenSwitcher: ScreenSwitcher, stage: Stage) {
		super();
		this.screenSwitcher = screenSwitcher;

		this.model = new GameScreenModel();
		this.view = new GameScreenView(stage);
	}

	/**
	 * Start the game
	 */
	startGame(): void {
		// Reset model state
		this.model.reset();

		// Update view
		this.view.updateScore(this.model.getScore());
		this.view.show();

		// example sequence, pass coords into grid
		const sequence: Coordinates[] = [
			{ row: 0, col: 0 },
			{ row: 0, col: 1 },
			{ row: 1, col: 1 },
			{ row: 2, col: 2 },
		];
		this.view.getGrid().blink(sequence);
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
