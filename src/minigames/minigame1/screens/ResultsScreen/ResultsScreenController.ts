import type { Stage } from "konva/lib/Stage";
import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import {
	ResultsScreenModel,
} from "./ResultsScreenModel.ts";
import {
	getMinigame1PersonalBest,
	submitMinigame1Result,
} from "../../../../api/minigame1PersonalBest.ts";
import { ResultsScreenView } from "./ResultsScreenView.ts";

/**
 * ResultsScreenController - Handles results screen interactions
 */
export class ResultsScreenController extends ScreenController {
	private model: ResultsScreenModel;
	private view: ResultsScreenView;
	private screenSwitcher: ScreenSwitcher;

	private gameOverSound: HTMLAudioElement;
	private pendingPersonalBestSave: Promise<void> = Promise.resolve();

	constructor(screenSwitcher: ScreenSwitcher, stage: Stage) {
		super();
		this.screenSwitcher = screenSwitcher;
		this.model = new ResultsScreenModel();
		this.view = new ResultsScreenView(stage, () => this.handlePlayAgainClick());

		this.gameOverSound = new Audio('/minigame1/gameover.mp3')
	}

	/**
	 * Show results screen with final score
	 */
	showResults(finalScore: number): void {
		this.model.setFinalScore(finalScore);
		this.pendingPersonalBestSave = this.pendingPersonalBestSave
			.then(async () => {
				await submitMinigame1Result(finalScore);
			})
			.catch((error) => {
				console.warn("Could not save Minigame 1 personal best", error);
			});
		this.view.updateFinalScore(finalScore);

		this.view.show();

		this.gameOverSound.currentTime = 0;
		this.gameOverSound.play();
	}

	/**
	 * Handle play again button click
	 */
	private handlePlayAgainClick(): void {
		this.screenSwitcher.switchToScreen({ type: "menu" });
	}

	/**
	 * Get the view
	 */
	getView(): ResultsScreenView {
		return this.view;
	}

	/**
	 * Gets the player's saved personal best for the start screen
	 */
	async getPersonalBest(): Promise<number | null> {
		await this.pendingPersonalBestSave;
		return getMinigame1PersonalBest();
	}
}
