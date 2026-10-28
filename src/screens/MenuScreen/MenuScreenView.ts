import Konva from "konva";
import type { View } from "../../types.ts";
import type { Stage } from "konva/lib/Stage";

/**
 * MenuScreenView - Renders the menu screen
 */
export class MenuScreenView implements View {
	private group: Konva.Group;
	private background: Konva.Rect;

	constructor(stage: Stage, onStartClick: () => void) {
		this.group = new Konva.Group({ visible: true });
		
		this.background = new Konva.Rect({
			x: 0,
			y: 0,
			width: stage.width(),
			height: stage.height(),
			fill: "black",
			listening: false,
		});
		this.group.add(this.background);

		// Title text
		const title = new Konva.Text({
			x: stage.width() / 2,
			y: 150,
			text: "Minigame 1",
			fontSize: 64,
			fontFamily: "Arial",
			stroke: "white",
			strokeWidth: 2,
			align: "center",
		});
		// Center the text using offsetX
		title.offsetX(title.width() / 2);
		this.group.add(title);

		const startButtonGroup = new Konva.Group();
		const startButton = new Konva.Rect({
			x: stage.width() / 2 - 100,
			y: 300,
			width: 200,
			height: 60,
			fill: "green",
			cornerRadius: 10,
			stroke: "darkgreen",
			strokeWidth: 3,
		});
		const startText = new Konva.Text({
			x: stage.width() / 2,
			y: 315,
			text: "START GAME",
			fontSize: 24,
			fontFamily: "Arial",
			fill: "white",
			align: "center",
		});
		startText.offsetX(startText.width() / 2);
		startButtonGroup.add(startButton);
		startButtonGroup.add(startText);
		startButtonGroup.on("click", onStartClick);
		this.group.add(startButtonGroup);
	}

	/**
	 * Show the screen
	 */
	show(): void {
		this.group.visible(true);
		this.group.getLayer()?.draw();
	}

	/**
	 * Hide the screen
	 */
	hide(): void {
		this.group.visible(false);
		this.group.getLayer()?.draw();
	}

	getGroup(): Konva.Group {
		return this.group;
	}
}
