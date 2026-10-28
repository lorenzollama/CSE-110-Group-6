import Konva from "konva";
import type { ScreenSwitcher, Screen } from "./types.ts";

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
		this.screenLayer.add(new Konva.Text({
			x: 20,
			y: 20,
			text: "CSE 110 Group 6 - shared skeleton",
			fontSize: 24,
			fontFamily: "Arial",
		}));
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
