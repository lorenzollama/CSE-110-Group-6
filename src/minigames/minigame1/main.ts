
import Konva from "konva";

import type {
  ScreenSwitcher,
  Screen,
} from "./types";

import { MenuScreenController } from "./screens/MenuScreen/MenuScreenController";
import { GameScreenController } from "./screens/GameScreen/GameScreenController";
import { ResultsScreenController } from "./screens/ResultsScreen/ResultsScreenController";

export class Minigame1Controller implements ScreenSwitcher {
	private menuController: MenuScreenController;
	private gameController: GameScreenController;
	private resultsController: ResultsScreenController;

	constructor(
		stage: Konva.Stage,
		private layer: Konva.Layer,
	) {
		this.menuController = new MenuScreenController(this, stage);
		this.gameController = new GameScreenController(this, stage);
		this.resultsController = new ResultsScreenController(this, stage);

		// Add Minigame 1's screens to the shared layer.
		this.layer.add(this.menuController.getView().getGroup());
		this.layer.add(this.gameController.getView().getGroup());
		this.layer.add(this.resultsController.getView().getGroup());

		// Initially hide all Minigame 1 screens.
		this.hide();
	}

	/** Show Minigame 1's menu when entering the minigame. */
	show(): void {
		this.switchToScreen({ type: "menu" });
	}

	/** Hide every Minigame 1 screen when leaving the minigame. */
	hide(): void {
		this.menuController.hide();
		this.gameController.hide();
		this.resultsController.hide();
	}

	/** Handle navigation between Minigame 1's internal screens. */
	switchToScreen(screen: Screen): void {
		this.hide();

		switch (screen.type) {
		case "menu":
			this.menuController.show();
			break;

		case "game":
			this.gameController.startGame();
			break;

		case "result":
			this.resultsController.showResults(screen.score);
			break;
		}

		this.layer.batchDraw();
	}
}