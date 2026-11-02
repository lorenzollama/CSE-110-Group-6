import Konva from "konva";
import type { ScreenSwitcher, Screen } from "./types.ts";
import { Minigame2Controller } from "../minigames/minigame2/controller.ts";
import { SampleGame } from "../minigames/minigame2/sampleGame.ts";
import { Minigame2View } from "../minigames/minigame2/view.ts";

/**
 * Main Application - Coordinates all screens
 *
 * Shared skeleton: screens and minigames register their controllers here.
 * Each screen has its own Konva.Group on the screen layer, and only one is
 * visible at a time. Popups go on the popup layer so they draw on top.
 */
class App implements ScreenSwitcher {
	private stage: Konva.Stage;
	private screenLayer: Konva.Layer;
	private popupLayer: Konva.Layer;

	constructor(container: string) {
		// initialize Konva stage (the main canvas)
		this.stage = new Konva.Stage({
			container,
			width: window.innerWidth,
			height: window.innerHeight,
		});

		// screens go on the bottom layer, popups on the top layer
		this.screenLayer = new Konva.Layer();
		this.popupLayer = new Konva.Layer();
		this.stage.add(this.screenLayer);
		this.stage.add(this.popupLayer);

		// TODO: create screen controllers and add their groups to screenLayer
		// For now this branch only shows Minigame 2.
		// SampleGame is a stand-in until the real Game class (#81) is ready.
		const minigame2 = new Minigame2Controller(new SampleGame(), new Minigame2View());
		this.screenLayer.add(minigame2.getView().getGroup());
		minigame2.startNewGame();
		this.screenLayer.draw();

		window.addEventListener("resize", () => {
			this.stage.width(window.innerWidth);
			this.stage.height(window.innerHeight);
		});
	}

	/**
	 * Switch to a different screen
	 * Hides every screen, then shows only the requested one
	 */
	switchToScreen(screen: Screen): void {
		// TODO: hide all screen controllers, then show the requested one
		switch (screen.type) {
			case "menu":
			case "game":
			case "result":
				break;
		}
	}
}

// Initialize the application
new App("container");
