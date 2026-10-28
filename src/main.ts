import Konva from "konva";
import type { ScreenSwitcher, Screen } from "./types.ts";
import { MenuScreenController } from "./screens/MenuScreen/MenuScreenController.ts";
import { GameScreenController } from "./screens/GameScreen/GameScreenController.ts";
import { ResultsScreenController } from "./screens/ResultsScreen/ResultsScreenController.ts";

/**
 * Main Application - Coordinates all screens
 *
 * This class demonstrates screen management using Konva Groups.
 * Each screen (Menu, Game, Results) has its own Konva.Group that can be
 * shown or hidden independently.
 *
 * Key concept: All screens are added to the same layer, but only one is
 * visible at a time. This is managed by the switchToScreen() method.
 */
class App implements ScreenSwitcher {
	private stage: Konva.Stage;
	private layer: Konva.Layer;

	private menuController: MenuScreenController;
	private gameController: GameScreenController;
	private resultsController: ResultsScreenController;

	constructor(container: string) {
		// initialize Konva stage (the main canvas)
		this.stage = new Konva.Stage({
			container,
			width: window.innerWidth,
			height: window.innerHeight,
		});

		// create a layer (screens will be added to this layer)
		this.layer = new Konva.Layer();
		this.stage.add(this.layer);

		// initialize all screen controllers
		// each controller manages a Model, View, and handles user interactions
		this.menuController = new MenuScreenController(this, this.stage);
		this.gameController = new GameScreenController(this, this.stage);
		this.resultsController = new ResultsScreenController(this, this.stage);

		// add all screen groups to the layer
		const menuGroup = this.menuController.getView().getGroup();
		const gameGroup = this.gameController.getView().getGroup();
		const resultsGroup = this.resultsController.getView().getGroup();

		this.layer.add(menuGroup);
		this.layer.add(gameGroup);
		this.layer.add(resultsGroup);

		this.layer.draw();

		// start with menu screen visible
		this.menuController.getView().show();

		// TODO - fix reside window
		window.addEventListener("resize", () => {
			this.stage.width(window.innerWidth);
			this.stage.height(window.innerHeight);
			this.layer.batchDraw();
		});
	}

	/**
	 * Switch to a different screen
	 *
	 * This method implements screen management by:
	 * 1. Hiding all screens (setting their Groups to invisible)
	 * 2. Showing only the requested screen
	 *
	 * This pattern ensures only one screen is visible at a time.
	 */
	switchToScreen(screen: Screen): void {
		// hide all screens first by setting their Groups to invisible
		this.menuController.hide();
		this.gameController.hide();
		this.resultsController.hide();

		// show the requested screen based on the screen type
		switch (screen.type) {
			case "menu":
				this.menuController.show();
				break;

			case "game":
				// start the game (which also shows the game screen)
				this.gameController.startGame();
				break;

			case "result":
				// show results with the final score
				this.resultsController.showResults(screen.score);
				break;
		}
	}
}

// Initialize the application
new App("container");
